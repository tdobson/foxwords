import { ttsCacheKey } from '../cache';
import { TTS_SAMPLE_RATE } from '../config';
import { buildTtsRequestBody, parseSsePcm } from '../openrouter';
import { validateTtsText } from '../validate';
import { base64ToBytes, encodeWav, trimSilencePcm16 } from '../wav';

function pcmFromSamples(samples: number[]): Uint8Array {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  samples.forEach((s, i) => view.setInt16(i * 2, s, true));
  return new Uint8Array(buffer);
}

function samplesFromPcm(pcm: Uint8Array): number[] {
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);
  const out: number[] = [];
  for (let i = 0; i < pcm.byteLength / 2; i++) out.push(view.getInt16(i * 2, true));
  return out;
}

function base64Of(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

describe('validateTtsText', () => {
  it('trims and collapses spaces', () => {
    expect(validateTtsText('  Mary   Ann  ')).toEqual({ ok: true, text: 'Mary Ann' });
  });

  it('accepts letters from any script, apostrophes and hyphens', () => {
    expect(validateTtsText('Juniper')).toEqual({ ok: true, text: 'Juniper' });
    expect(validateTtsText("Jo-Ann O'Neil")).toEqual({ ok: true, text: "Jo-Ann O'Neil" });
    expect(validateTtsText('Zoë’s')).toEqual({ ok: true, text: 'Zoë’s' });
    expect(validateTtsText('Нина')).toEqual({ ok: true, text: 'Нина' });
  });

  it('rejects missing, empty and blank input', () => {
    expect(validateTtsText(null).ok).toBe(false);
    expect(validateTtsText('').ok).toBe(false);
    expect(validateTtsText('   ').ok).toBe(false);
  });

  it('rejects markup, digits, punctuation and emoji', () => {
    for (const bad of ['<script>', 'Leo1', 'hi!', 'a,b', 'cat 🐱', 'a.b', '£5', 'a\tb']) {
      expect(validateTtsText(bad).ok).toBe(false);
    }
  });

  it('enforces the 40 character limit on code points', () => {
    expect(validateTtsText('a'.repeat(40)).ok).toBe(true);
    expect(validateTtsText('a'.repeat(41)).ok).toBe(false);
  });
});

describe('ttsCacheKey', () => {
  it('is case-insensitive and stable', async () => {
    const a = await ttsCacheKey('Juniper');
    const b = await ttsCacheKey('juniper');
    expect(a).toBe(b);
    expect(a).toMatch(/^tts\/v1\/[0-9a-f]{64}\.wav$/);
  });

  it('differs for different words', async () => {
    expect(await ttsCacheKey('cat')).not.toBe(await ttsCacheKey('dog'));
  });
});

describe('parseSsePcm', () => {
  it('concatenates audio deltas in order and ignores other events', () => {
    const a = new Uint8Array([1, 2, 3, 4]);
    const b = new Uint8Array([5, 6]);
    const sse = [
      ': keep-alive',
      '',
      `data: ${JSON.stringify({ choices: [{ delta: { audio: { data: base64Of(a) } } }] })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: 'x' } }] })}`,
      `data: ${JSON.stringify({ choices: [{ delta: { audio: { data: base64Of(b) } } }] })}`,
      'data: [DONE]',
      '',
    ].join('\n');
    expect(Array.from(parseSsePcm(sse))).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('returns no bytes when there is no audio', () => {
    expect(parseSsePcm('data: [DONE]\n').byteLength).toBe(0);
  });

  it('throws when the stream reports an error', () => {
    const sse = `data: ${JSON.stringify({ error: { message: 'rate limited' } })}\n`;
    expect(() => parseSsePcm(sse)).toThrow('rate limited');
  });

  it('builds a streaming audio request with the agreed voice and prompt', () => {
    const body = buildTtsRequestBody('Juniper');
    expect(body.model).toBe('openai/gpt-audio');
    expect(body.modalities).toEqual(['text', 'audio']);
    expect(body.audio).toEqual({ voice: 'ballad', format: 'pcm16' });
    expect(body.stream).toBe(true);
    expect(body.messages[1].content).toBe('Read this aloud:\n\nJuniper');
    expect(body.messages[0].content).toContain('Received Pronunciation');
  });
});

describe('base64ToBytes', () => {
  it('decodes base64 back to the original bytes', () => {
    expect(Array.from(base64ToBytes(base64Of(new Uint8Array([0, 255, 16]))))).toEqual([0, 255, 16]);
  });
});

describe('trimSilencePcm16', () => {
  it('trims silence and keeps 80 ms of padding either side', () => {
    const pad = Math.round(0.08 * TTS_SAMPLE_RATE);
    const silence = new Array(5000).fill(0);
    const speech = [1000, -2000, 3000];
    const pcm = pcmFromSamples([...silence, ...speech, ...silence]);

    const trimmed = samplesFromPcm(trimSilencePcm16(pcm, TTS_SAMPLE_RATE));
    expect(trimmed).toHaveLength(speech.length + 2 * pad);
    expect(trimmed.slice(pad, pad + speech.length)).toEqual(speech);
    expect(trimmed.every((s) => s === 0)).toBe(false);
  });

  it('treats low-level noise below the threshold as silence', () => {
    const pcm = pcmFromSamples([100, -200, 300, 0]);
    expect(trimSilencePcm16(pcm, TTS_SAMPLE_RATE).byteLength).toBe(0);
  });

  it('does not pad past either end of the clip', () => {
    const pcm = pcmFromSamples([5000, 0, 0]);
    expect(samplesFromPcm(trimSilencePcm16(pcm, TTS_SAMPLE_RATE))).toEqual([5000, 0, 0]);
  });
});

describe('encodeWav', () => {
  it('writes a 44 byte PCM16 mono 24 kHz header', () => {
    const pcm = pcmFromSamples([1, 2, 3]);
    const wav = encodeWav(pcm, TTS_SAMPLE_RATE);
    const view = new DataView(wav.buffer);
    const ascii = (o: number, n: number) => String.fromCharCode(...wav.slice(o, o + n));

    expect(wav.byteLength).toBe(44 + pcm.byteLength);
    expect(ascii(0, 4)).toBe('RIFF');
    expect(view.getUint32(4, true)).toBe(36 + pcm.byteLength);
    expect(ascii(8, 4)).toBe('WAVE');
    expect(ascii(12, 4)).toBe('fmt ');
    expect(view.getUint16(20, true)).toBe(1);
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(24000);
    expect(view.getUint32(28, true)).toBe(48000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(ascii(36, 4)).toBe('data');
    expect(view.getUint32(40, true)).toBe(pcm.byteLength);
    expect(Array.from(wav.slice(44))).toEqual(Array.from(pcm));
  });
});
