import { TTS_MAX_CHARS } from './config';

export type TtsTextResult = { ok: true; text: string } | { ok: false; message: string };

const ALLOWED_CHARS = /^[\p{L}\p{M} '’-]+$/u;

export function normaliseTtsText(raw: string): string {
  return raw.trim().replace(/ +/g, ' ');
}

export function validateTtsText(raw: string | null): TtsTextResult {
  if (raw === null) {
    return { ok: false, message: 'Add a word to read aloud.' };
  }
  const text = normaliseTtsText(raw);
  if (text.length === 0) {
    return { ok: false, message: 'Add a word to read aloud.' };
  }
  if ([...text].length > TTS_MAX_CHARS) {
    return { ok: false, message: `Keep it to ${TTS_MAX_CHARS} characters or fewer.` };
  }
  if (!ALLOWED_CHARS.test(text)) {
    return { ok: false, message: 'Use letters, spaces, apostrophes and hyphens only.' };
  }
  return { ok: true, text };
}
