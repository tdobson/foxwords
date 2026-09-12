import type { MediaKind } from '../db/types';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB

export interface ValidatedUpload {
  kind: MediaKind;
  contentType: string;
  extension: string;
  byteSize: number;
}

/**
 * Validates upload byte size, content-type header, and magic-byte signature.
 */
export function validateUpload(declaredContentType: string, buffer: ArrayBuffer): ValidatedUpload {
  const byteSize = buffer.byteLength;
  if (byteSize === 0) {
    throw new Error('Upload file is empty');
  }
  if (byteSize > MAX_UPLOAD_BYTES) {
    throw new Error(`Upload file is too large (max ${MAX_UPLOAD_BYTES} bytes)`);
  }

  const normalizedMime = declaredContentType.toLowerCase().split(';')[0].trim();
  const bytes = new Uint8Array(buffer);

  // Magic byte checks
  if (normalizedMime === 'image/jpeg' || normalizedMime === 'image/jpg') {
    if (bytes.length < 3 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) {
      throw new Error('Signature mismatch: file does not match JPEG magic bytes');
    }
    return { kind: 'photo', contentType: 'image/jpeg', extension: 'jpg', byteSize };
  }

  if (normalizedMime === 'image/png') {
    if (
      bytes.length < 8 ||
      bytes[0] !== 0x89 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x4e ||
      bytes[3] !== 0x47 ||
      bytes[4] !== 0x0d ||
      bytes[5] !== 0x0a ||
      bytes[6] !== 0x1a ||
      bytes[7] !== 0x0a
    ) {
      throw new Error('Signature mismatch: file does not match PNG magic bytes');
    }
    return { kind: 'photo', contentType: 'image/png', extension: 'png', byteSize };
  }

  if (normalizedMime === 'image/webp') {
    // RIFF....WEBP
    if (
      bytes.length < 12 ||
      bytes[0] !== 0x52 || // R
      bytes[1] !== 0x49 || // I
      bytes[2] !== 0x46 || // F
      bytes[3] !== 0x46 || // F
      bytes[8] !== 0x57 || // W
      bytes[9] !== 0x45 || // E
      bytes[10] !== 0x42 || // B
      bytes[11] !== 0x50 // P
    ) {
      throw new Error('Signature mismatch: file does not match WebP magic bytes');
    }
    return { kind: 'photo', contentType: 'image/webp', extension: 'webp', byteSize };
  }

  if (normalizedMime === 'audio/webm') {
    // EBML header 1A 45 DF A3
    if (bytes.length < 4 || bytes[0] !== 0x1a || bytes[1] !== 0x45 || bytes[2] !== 0xdf || bytes[3] !== 0xa3) {
      throw new Error('Signature mismatch: file does not match WebM magic bytes');
    }
    return { kind: 'word-audio', contentType: 'audio/webm', extension: 'webm', byteSize };
  }

  if (normalizedMime === 'audio/ogg' || normalizedMime === 'application/ogg') {
    // OggS: 4F 67 67 53
    if (bytes.length < 4 || bytes[0] !== 0x4f || bytes[1] !== 0x67 || bytes[2] !== 0x67 || bytes[3] !== 0x53) {
      throw new Error('Signature mismatch: file does not match Ogg magic bytes');
    }
    return { kind: 'word-audio', contentType: 'audio/ogg', extension: 'ogg', byteSize };
  }

  if (normalizedMime === 'audio/mp4' || normalizedMime === 'audio/m4a' || normalizedMime === 'audio/x-m4a') {
    // ftyp at offset 4: 66 74 79 70
    if (bytes.length < 8 || bytes[4] !== 0x66 || bytes[5] !== 0x74 || bytes[6] !== 0x79 || bytes[7] !== 0x70) {
      throw new Error('Signature mismatch: file does not match MP4/M4A magic bytes');
    }
    return { kind: 'word-audio', contentType: 'audio/mp4', extension: 'm4a', byteSize };
  }

  throw new Error(`Unsupported file type: ${declaredContentType}. Allowed: JPEG, PNG, WebP, WebM, Ogg, MP4/M4A.`);
}
