import type { NextRequest } from 'next/server';
import { jsonError } from '../../../lib/api-response';
import { getRuntimeEnv } from '../../../lib/cloudflare-context';
import { RateLimitRepository } from '../../../lib/db/repositories/rate-limits';
import { ttsCacheKey } from '../../../lib/tts/cache';
import {
  TTS_GLOBAL_MAX_GENERATIONS,
  TTS_GLOBAL_WINDOW_MS,
  TTS_RATE_MAX_GENERATIONS,
  TTS_RATE_WINDOW_MS,
  TTS_SAMPLE_RATE,
} from '../../../lib/tts/config';
import { synthesisePcm } from '../../../lib/tts/openrouter';
import { validateTtsText } from '../../../lib/tts/validate';
import { encodeWav, trimSilencePcm16 } from '../../../lib/tts/wav';

export const dynamic = 'force-dynamic';

const AUDIO_HEADERS = {
  'Content-Type': 'audio/wav',
  'Cache-Control': 'public, max-age=31536000, immutable',
};

export async function GET(request: NextRequest) {
  const env = await getRuntimeEnv();

  const parsed = validateTtsText(request.nextUrl.searchParams.get('text'));
  if (!parsed.ok) {
    return jsonError(400, 'invalid_text', parsed.message);
  }

  const cacheKey = await ttsCacheKey(parsed.text);
  if (env.MEDIA && typeof env.MEDIA.get === 'function') {
    const cached = await env.MEDIA.get(cacheKey);
    if (cached) {
      return new Response(cached.body, { status: 200, headers: AUDIO_HEADERS });
    }
  }

  if (!env.OPENROUTER_API_KEY) {
    return jsonError(503, 'tts_unavailable', 'Voice is not set up on this server.');
  }

  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'anon';
  const limits = new RateLimitRepository(env.DB);
  const allowed =
    (await limits.consume(`tts:${clientIp}`, TTS_RATE_WINDOW_MS, TTS_RATE_MAX_GENERATIONS)) &&
    (await limits.consume('tts:global', TTS_GLOBAL_WINDOW_MS, TTS_GLOBAL_MAX_GENERATIONS));
  if (!allowed) {
    return jsonError(429, 'rate_limited', 'Too many new words in a short time. Try again soon.');
  }

  let speech: Uint8Array;
  try {
    speech = trimSilencePcm16(
      await synthesisePcm(env.OPENROUTER_API_KEY, parsed.text),
      TTS_SAMPLE_RATE
    );
  } catch {
    return jsonError(503, 'tts_unavailable', 'Could not make the voice just now.');
  }
  if (speech.byteLength === 0) {
    return jsonError(503, 'tts_unavailable', 'Could not make the voice just now.');
  }

  const wav = encodeWav(speech, TTS_SAMPLE_RATE);
  if (env.MEDIA && typeof env.MEDIA.put === 'function') {
    try {
      await env.MEDIA.put(cacheKey, wav, { httpMetadata: { contentType: 'audio/wav' } });
    } catch {
      // Serving the audio matters more than caching it
    }
  }

  return new Response(wav, { status: 200, headers: AUDIO_HEADERS });
}
