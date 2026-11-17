import type { BrowserContext } from '@playwright/test';

/** A 0.1 second silent mono WAV, so <audio> elements load without real clips. */
function silentWav(): Buffer {
  const sampleRate = 8000;
  const samples = sampleRate / 10;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

const SILENT_WAV = silentWav();

/**
 * Stops the browser from calling text-to-speech (OpenRouter behind /api/tts) and
 * serves a silent clip for every bundled or generated audio file.
 */
export async function mockAudio(context: BrowserContext): Promise<void> {
  await context.route(/\/api\/tts(\?|$)|\/audio\/|\/api\/play\/[^/]+\/assets\//, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/wav',
      headers: { 'Cache-Control': 'no-store' },
      body: SILENT_WAV,
    })
  );
}
