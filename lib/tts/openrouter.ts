import { TTS_MODEL, TTS_SYSTEM_PROMPT, TTS_UPSTREAM_TIMEOUT_MS, TTS_VOICE } from './config';
import { base64ToBytes, concatBytes } from './wav';

export class TtsUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TtsUpstreamError';
  }
}

export function buildTtsRequestBody(text: string) {
  return {
    model: TTS_MODEL,
    modalities: ['text', 'audio'],
    audio: { voice: TTS_VOICE, format: 'pcm16' },
    stream: true,
    messages: [
      { role: 'system', content: TTS_SYSTEM_PROMPT },
      { role: 'user', content: `Read this aloud:\n\n${text}` },
    ],
  };
}

/** Pulls every base64 PCM16 audio delta out of an SSE body and joins the bytes in order. */
export function parseSsePcm(sse: string): Uint8Array {
  const chunks: Uint8Array[] = [];
  for (const rawLine of sse.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (payload === '' || payload === '[DONE]') continue;

    let event: any;
    try {
      event = JSON.parse(payload);
    } catch {
      continue;
    }
    if (event?.error) {
      throw new TtsUpstreamError(String(event.error.message ?? 'upstream error'));
    }
    for (const choice of event?.choices ?? []) {
      const data = choice?.delta?.audio?.data;
      if (typeof data === 'string' && data.length > 0) {
        chunks.push(base64ToBytes(data));
      }
    }
  }
  return concatBytes(chunks);
}

export async function synthesisePcm(apiKey: string, text: string): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(buildTtsRequestBody(text)),
      signal: AbortSignal.timeout(TTS_UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    throw new TtsUpstreamError(error instanceof Error ? error.message : 'fetch failed');
  }

  if (!response.ok) {
    throw new TtsUpstreamError(`OpenRouter responded ${response.status}`);
  }

  const pcm = parseSsePcm(await response.text());
  if (pcm.byteLength === 0) {
    throw new TtsUpstreamError('OpenRouter returned no audio');
  }
  return pcm;
}
