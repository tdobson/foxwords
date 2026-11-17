#!/usr/bin/env python3
"""Generate the bundled default voice clips.

Each clip is synthesised with OpenRouter (openai/gpt-audio, the same prompt and
request shape as lib/tts), trimmed and encoded to mono 24 kHz MP3, then checked
by transcribing it with Groq Whisper. Clips that never match their expected text
are left out of constants/generated-audio.json so the app falls back to /api/tts.

Usage:
  OPENROUTER_API_KEY=... GROQ_API_KEY=... python3 scripts/voice/generate.py [--only KEY ...] [--limit N] [--workers 4]

Resumable: a clip verified in report.json with an MP3 on disk is skipped.
"""

import argparse
import base64
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
import uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
OUT_DIR = ROOT / 'public' / 'audio' / 'generated'
GENERATED_JSON = ROOT / 'constants' / 'generated-audio.json'
REPORT_PATH = HERE / 'report.json'
LEXICON_PATH = HERE / 'lexicon.json'
MANIFEST_SCRIPT = HERE / 'manifest.mjs'

MAX_VERIFY_ATTEMPTS = 4  # one generation plus three regenerations
OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
GROQ_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
GROQ_MODEL = 'whisper-large-v3'
USER_AGENT = 'foxwords-voice-generator/1.0'
# stop_duration keeps a short pause inside "Great job!" from cutting off the end of the phrase.
SILENCE_FILTER = (
    'silenceremove=start_periods=1:start_threshold=-45dB:'
    'stop_periods=1:stop_threshold=-45dB:stop_duration=0.4,apad=pad_dur=0.08'
)
MIN_MP3_BYTES = 400


class UpstreamError(Exception):
    pass


def load_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding='utf-8'))


def save_json(path, data):
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False, sort_keys=True) + '\n', encoding='utf-8')
    os.replace(tmp, path)


def load_manifest():
    proc = subprocess.run(
        ['node', str(MANIFEST_SCRIPT)], cwd=ROOT, capture_output=True, text=True, check=True
    )
    return json.loads(proc.stdout)


def is_retryable(error):
    if isinstance(error, urllib.error.HTTPError):
        return error.code == 429 or error.code >= 500
    return isinstance(error, (urllib.error.URLError, TimeoutError, UpstreamError))


def with_retries(fn, tries=3):
    last = None
    for attempt in range(tries):
        try:
            return fn()
        except Exception as error:  # noqa: BLE001 - re-raised below when not retryable
            last = error
            if not is_retryable(error) or attempt == tries - 1:
                break
            time.sleep(4 * (attempt + 1))
    raise last


def synthesise_pcm(api_key, cfg, user_text):
    body = {
        'model': cfg['model'],
        'modalities': ['text', 'audio'],
        'audio': {'voice': cfg['voice'], 'format': 'pcm16'},
        'stream': True,
        'messages': [
            {'role': 'system', 'content': cfg['systemPrompt']},
            {'role': 'user', 'content': user_text},
        ],
    }
    request = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(body).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': USER_AGENT,
        },
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        sse = response.read().decode('utf-8', 'replace')

    chunks = []
    for raw_line in sse.split('\n'):
        line = raw_line.strip()
        if not line.startswith('data:'):
            continue
        payload = line[5:].strip()
        if payload in ('', '[DONE]'):
            continue
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            continue
        if event.get('error'):
            raise UpstreamError(str(event['error'].get('message', 'upstream error')))
        for choice in event.get('choices') or []:
            delta = (choice or {}).get('delta') or {}
            data = (delta.get('audio') or {}).get('data')
            if isinstance(data, str) and data:
                chunks.append(base64.b64decode(data))
    pcm = b''.join(chunks)
    if not pcm:
        raise UpstreamError('OpenRouter returned no audio')
    return pcm


def encode_mp3(pcm, sample_rate):
    proc = subprocess.run(
        [
            'ffmpeg', '-hide_banner', '-loglevel', 'error',
            '-f', 's16le', '-ar', str(sample_rate), '-ac', '1', '-i', 'pipe:0',
            '-af', SILENCE_FILTER,
            '-ac', '1', '-ar', '24000', '-codec:a', 'libmp3lame', '-b:a', '48k',
            '-f', 'mp3', 'pipe:1',
        ],
        input=pcm, capture_output=True, check=True,
    )
    if len(proc.stdout) < MIN_MP3_BYTES:
        raise UpstreamError('encoded audio is empty after trimming')
    return proc.stdout


def transcribe(groq_key, mp3):
    boundary = uuid.uuid4().hex

    def text_field(name, value):
        return (
            f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'
        ).encode('utf-8')

    body = (
        text_field('model', GROQ_MODEL)
        + text_field('language', 'en')
        + text_field('response_format', 'json')
        + text_field('temperature', '0')
        + (
            f'--{boundary}\r\nContent-Disposition: form-data; name="file"; '
            'filename="clip.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n'
        ).encode('utf-8')
        + mp3
        + f'\r\n--{boundary}--\r\n'.encode('utf-8')
    )
    request = urllib.request.Request(
        GROQ_URL,
        data=body,
        headers={
            'Authorization': f'Bearer {groq_key}',
            'Content-Type': f'multipart/form-data; boundary={boundary}',
            'User-Agent': USER_AGENT,
        },
        method='POST',
    )
    with urllib.request.urlopen(request, timeout=90) as response:
        result = json.loads(response.read().decode('utf-8'))
    return str(result.get('text', ''))


ONES = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
    'nineteen',
]
TENS = {2: 'twenty', 3: 'thirty', 4: 'forty', 5: 'fifty', 6: 'sixty', 7: 'seventy', 8: 'eighty', 9: 'ninety'}


def number_to_words(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        tens, ones = divmod(n, 10)
        return TENS[tens] + ('' if ones == 0 else ' ' + ONES[ones])
    return str(n)


def normalise(text):
    """Lower-case letters only, digits as words, so spacing and punctuation never matter."""
    s = text.lower().replace('’', "'")
    s = re.sub(r'\d+', lambda m: number_to_words(int(m.group(0))), s)
    s = s.replace("it's", 'it is')
    s = re.sub(r"o'?\s*clock", 'oclock', s)
    return re.sub(r'[^a-z]', '', s)


def transcript_matches(clip, transcript):
    got = normalise(transcript)
    if got == normalise(clip['text']):
        return True
    # Letter names often come back as the letter itself ("a" for "ay").
    return clip['kind'] == 'letter' and got == clip['key'][-1]


def user_prompt(clip, spoken):
    if clip['kind'] == 'letter':
        return f'Read this aloud. This is the name of a letter of the alphabet, not a word:\n\n{spoken}'
    return f'Read this aloud:\n\n{spoken}'


def run_clip(clip, cfg, lexicon, openrouter_key, groq_key):
    spoken = lexicon.get(clip['text'], clip['text'])
    history = []
    for attempt in range(1, MAX_VERIFY_ATTEMPTS + 1):
        try:
            pcm = with_retries(lambda: synthesise_pcm(openrouter_key, cfg, user_prompt(clip, spoken)))
            mp3 = encode_mp3(pcm, cfg['sampleRate'])
            transcript = with_retries(lambda: transcribe(groq_key, mp3))
        except Exception as error:  # noqa: BLE001 - recorded in the report
            history.append({'error': f'{type(error).__name__}: {str(error)[:160]}'})
            continue

        matched = transcript_matches(clip, transcript)
        history.append({'transcript': transcript, 'match': matched})
        if matched:
            tmp = OUT_DIR / f"{clip['key']}.mp3.tmp"
            tmp.write_bytes(mp3)
            os.replace(tmp, OUT_DIR / f"{clip['key']}.mp3")
            return {
                'kind': clip['kind'], 'text': clip['text'], 'spoken': spoken,
                'verified': True, 'attempts': attempt, 'transcript': transcript,
                'bytes': len(mp3),
            }

    return {
        'kind': clip['kind'], 'text': clip['text'], 'spoken': spoken,
        'verified': False, 'attempts': len(history), 'history': history,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--only', nargs='+', default=[], help='clip keys to (re)generate')
    parser.add_argument('--limit', type=int, default=0, help='stop after this many clips to generate')
    parser.add_argument('--workers', type=int, default=4)
    args = parser.parse_args()

    openrouter_key = os.environ.get('OPENROUTER_API_KEY', '')
    groq_key = os.environ.get('GROQ_API_KEY', '')
    if not openrouter_key or not groq_key:
        sys.exit('OPENROUTER_API_KEY and GROQ_API_KEY must be set')

    manifest = load_manifest()
    cfg = manifest['config']
    clips = manifest['clips']
    lexicon = load_json(LEXICON_PATH, {})
    report = load_json(REPORT_PATH, {})
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    todo = []
    skipped = 0
    for clip in clips:
        key = clip['key']
        if args.only and key not in args.only:
            continue
        entry = report.get(key)
        if entry and entry.get('verified') and (OUT_DIR / f'{key}.mp3').exists():
            skipped += 1
            continue
        todo.append(clip)
    if args.limit:
        todo = todo[:args.limit]

    print(f'clips total={len(clips)} skipped={skipped} to_generate={len(todo)}', flush=True)

    done = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {
            pool.submit(run_clip, clip, cfg, lexicon, openrouter_key, groq_key): clip for clip in todo
        }
        for future in as_completed(futures):
            clip = futures[future]
            result = future.result()
            report[clip['key']] = result
            save_json(REPORT_PATH, report)
            done += 1
            if result['verified']:
                status = f"ok attempts={result['attempts']} heard={result['transcript']!r}"
            else:
                status = f"FAILED attempts={result['attempts']}"
            print(f'[{done}/{len(todo)}] {clip["key"]} {status}', flush=True)

    keys = {clip['key'] for clip in clips}
    verified = {}
    for clip in clips:
        key = clip['key']
        mp3 = OUT_DIR / f'{key}.mp3'
        entry = report.get(key)
        if entry and entry.get('verified') and mp3.exists():
            verified[key] = f'/audio/generated/{key}.mp3'
        elif mp3.exists():
            mp3.unlink()
    for stale in OUT_DIR.glob('*.mp3'):
        if stale.stem not in keys:
            stale.unlink()

    save_json(GENERATED_JSON, dict(sorted(verified.items())))

    failed = sorted(k for k in keys if not (report.get(k) or {}).get('verified'))
    total_bytes = sum(p.stat().st_size for p in OUT_DIR.glob('*.mp3'))
    print(f'generated_json_entries={len(verified)} failed={len(failed)} total_bytes={total_bytes}', flush=True)
    if failed:
        print(f'failed keys listed in {REPORT_PATH.relative_to(ROOT)}', flush=True)


if __name__ == '__main__':
    main()
