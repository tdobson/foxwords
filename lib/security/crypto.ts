/**
 * Web Crypto-based token generation and hashing compatible with Workers and Node.js
 */

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export async function sha256Hex(value: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function normalizeEmail(value: string): string {
  const trimmed = value.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(trimmed)) {
    throw new Error(`Invalid email address format: ${value}`);
  }
  return trimmed;
}

export function validateWord(value: string): string {
  const trimmed = value.trim().toUpperCase();
  if (!trimmed || trimmed.length === 0) {
    throw new Error('Word cannot be empty');
  }
  if (trimmed.length > 32) {
    throw new Error('Word is too long (max 32 characters)');
  }
  // Foxwords playable words: English letters, hyphens, and apostrophes (e.g. O'BRIEN, TEDDY-BEAR)
  if (!/^[A-Z'-]+$/.test(trimmed)) {
    throw new Error('Word contains invalid characters (allowed: A-Z, hyphens, apostrophes)');
  }
  return trimmed;
}

export function normalizePlayCode(value: string): string {
  const cleaned = value.trim().toUpperCase().replace(/-/g, '');
  if (!/^[A-Z0-9]{4,6}$/.test(cleaned)) {
    throw new Error('Invalid family play code. Must be 4 to 6 alphanumeric characters.');
  }
  return cleaned;
}
