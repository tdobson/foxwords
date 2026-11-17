const SILENCE_THRESHOLD = 500;

export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const out = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Trims leading and trailing near-silence from mono PCM16 little-endian audio,
 * keeping `paddingMs` either side. Returns an empty array if nothing is audible.
 */
export function trimSilencePcm16(
  pcm: Uint8Array,
  sampleRate: number,
  paddingMs = 80,
  threshold = SILENCE_THRESHOLD
): Uint8Array {
  const sampleCount = Math.floor(pcm.byteLength / 2);
  const view = new DataView(pcm.buffer, pcm.byteOffset, pcm.byteLength);

  let first = -1;
  let last = -1;
  for (let i = 0; i < sampleCount; i++) {
    if (Math.abs(view.getInt16(i * 2, true)) > threshold) {
      if (first === -1) first = i;
      last = i;
    }
  }
  if (first === -1) {
    return new Uint8Array(new ArrayBuffer(0));
  }

  const pad = Math.round((paddingMs / 1000) * sampleRate);
  const start = Math.max(0, first - pad);
  const end = Math.min(sampleCount, last + 1 + pad);
  return pcm.slice(start * 2, end * 2);
}

export function encodeWav(pcm: Uint8Array, sampleRate: number): Uint8Array<ArrayBuffer> {
  const channels = 1;
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const buffer = new ArrayBuffer(44 + pcm.byteLength);
  const view = new DataView(buffer);
  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + pcm.byteLength, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeAscii(36, 'data');
  view.setUint32(40, pcm.byteLength, true);
  new Uint8Array(buffer, 44).set(pcm);

  return new Uint8Array(buffer);
}
