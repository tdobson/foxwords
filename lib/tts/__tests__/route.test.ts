import { NextRequest } from 'next/server';
import { GET } from '../../../app/api/tts/route';
import { type RuntimeEnv, setMockRuntimeEnv } from '../../cloudflare-context';
import { ttsCacheKey } from '../cache';
import { TTS_RATE_MAX_GENERATIONS } from '../config';

class RateLimitOnlyD1 {
  public counts = new Map<string, number>();

  prepare(_query: string) {
    const bound: unknown[] = [];
    const counts = this.counts;
    return {
      bind(...values: unknown[]) {
        bound.push(...values);
        return this;
      },
      async first() {
        const bucket = bound[0] as string;
        const max = bound[4] as number;
        const current = counts.get(bucket) ?? 0;
        if (current >= max) return null;
        counts.set(bucket, current + 1);
        return { request_count: current + 1 };
      },
    };
  }
}

class FakeR2 {
  public objects = new Map<string, { body: Uint8Array; contentType?: string }>();
  public get = jest.fn(async (key: string) => {
    const hit = this.objects.get(key);
    if (!hit) return null;
    return { body: hit.body };
  });
  public put = jest.fn(async (key: string, body: Uint8Array, options?: any) => {
    this.objects.set(key, {
      body: body as Uint8Array,
      contentType: options?.httpMetadata?.contentType,
    });
  });
}

function pcmBase64(samples: number[]): string {
  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  samples.forEach((s, i) => view.setInt16(i * 2, s, true));
  let binary = '';
  new Uint8Array(buffer).forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function sseFor(samples: number[]): string {
  const half = Math.floor(samples.length / 2);
  const first = pcmBase64(samples.slice(0, half));
  const second = pcmBase64(samples.slice(half));
  return [
    `data: ${JSON.stringify({ choices: [{ delta: { audio: { data: first } } }] })}`,
    `data: ${JSON.stringify({ choices: [{ delta: { audio: { data: second } } }] })}`,
    'data: [DONE]',
    '',
  ].join('\n');
}

function lettersFor(n: number): string {
  let out = '';
  let rest = n;
  do {
    out = String.fromCharCode(97 + (rest % 26)) + out;
    rest = Math.floor(rest / 26);
  } while (rest > 0);
  return `w${out}`;
}

function makeRequest(query: string, ip = '203.0.113.7') {
  return new NextRequest(`https://foxwords.net/api/tts?${query}`, {
    headers: { 'cf-connecting-ip': ip },
  });
}

describe('GET /api/tts', () => {
  let db: RateLimitOnlyD1;
  let media: FakeR2;
  let fetchMock: jest.Mock;

  const speechSamples = [...new Array(4000).fill(0), 4000, -4000, 2000, ...new Array(4000).fill(0)];

  function setEnv(overrides: Partial<RuntimeEnv> = {}) {
    const env: RuntimeEnv = {
      DB: db as any,
      MEDIA: media,
      APP_ENV: 'local',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
      OPENROUTER_API_KEY: 'test-key',
      ...overrides,
    };
    setMockRuntimeEnv(env);
    return env;
  }

  beforeEach(() => {
    db = new RateLimitOnlyD1();
    media = new FakeR2();
    fetchMock = jest.fn(async () => new Response(sseFor(speechSamples), { status: 200 }));
    global.fetch = fetchMock as any;
  });

  afterEach(() => {
    setMockRuntimeEnv(null);
    jest.restoreAllMocks();
  });

  it('returns 400 JSON for markup without calling upstream', async () => {
    setEnv();
    const res = await GET(makeRequest('text=%3Cscript%3E'));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('invalid_text');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 when text is missing', async () => {
    setEnv();
    const res = await GET(makeRequest(''));
    expect(res.status).toBe(400);
  });

  it('generates, trims, stores and serves a WAV on a cache miss', async () => {
    setEnv();
    const res = await GET(makeRequest('text=Juniper'));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/wav');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');

    const key = await ttsCacheKey('Juniper');
    expect(media.put).toHaveBeenCalledTimes(1);
    expect(media.put.mock.calls[0][0]).toBe(key);
    const stored = media.objects.get(key)!.body;
    expect(new TextDecoder().decode(stored.slice(0, 4))).toBe('RIFF');
    expect(stored.byteLength).toBeLessThan(44 + speechSamples.length * 2);
    expect(stored.byteLength).toBe(44 + (3 + 2 * Math.round(0.08 * 24000)) * 2);

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-key');
  });

  it('serves cache hits without calling upstream or spending rate limit', async () => {
    setEnv();
    const key = await ttsCacheKey('Juniper');
    media.objects.set(key, { body: new Uint8Array([82, 73, 70, 70]) });

    const res = await GET(makeRequest('text=juniper'));
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/wav');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(db.counts.size).toBe(0);
  });

  it('returns 503 JSON without calling upstream when the key is missing', async () => {
    setEnv({ OPENROUTER_API_KEY: undefined });
    const res = await GET(makeRequest('text=Juniper'));
    expect(res.status).toBe(503);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe('tts_unavailable');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(media.put).not.toHaveBeenCalled();
  });

  it('returns 503 JSON when upstream fails and stores nothing', async () => {
    fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
    setEnv();
    const res = await GET(makeRequest('text=Juniper'));
    expect(res.status).toBe(503);
    expect(media.put).not.toHaveBeenCalled();
  });

  it('returns 503 when the upstream stream has no audio', async () => {
    fetchMock.mockResolvedValueOnce(new Response('data: [DONE]\n', { status: 200 }));
    setEnv();
    const res = await GET(makeRequest('text=Juniper'));
    expect(res.status).toBe(503);
    expect(media.put).not.toHaveBeenCalled();
  });

  it('returns 503 when the clip is pure silence', async () => {
    fetchMock.mockResolvedValueOnce(new Response(sseFor([0, 0, 1, -1]), { status: 200 }));
    setEnv();
    const res = await GET(makeRequest('text=Juniper'));
    expect(res.status).toBe(503);
  });

  it('still serves audio when storing in R2 fails', async () => {
    media.put.mockRejectedValueOnce(new Error('r2 down'));
    setEnv();
    const res = await GET(makeRequest('text=Juniper'));
    expect(res.status).toBe(200);
  });

  it('rate limits generation per client IP to 60 per hour', async () => {
    setEnv();
    for (let i = 0; i < TTS_RATE_MAX_GENERATIONS; i++) {
      const res = await GET(makeRequest(`text=${lettersFor(i)}`));
      expect(res.status).toBe(200);
    }
    const blocked = await GET(makeRequest('text=onemore'));
    expect(blocked.status).toBe(429);
    expect(((await blocked.json()) as { error: { code: string } }).error.code).toBe('rate_limited');

    const otherIp = await GET(makeRequest('text=onemore', '198.51.100.9'));
    expect(otherIp.status).toBe(200);
  });
});
