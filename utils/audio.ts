/**
 * @fileoverview Audio helpers for letter and word sounds
 * @module utils/audio
 */

const PHONEME_AUDIO_DIR = '/audio/phonemes';
const LETTER_NAME_AUDIO_DIR = '/audio/letter-names';
const WORD_AUDIO_DIR = '/audio/words';

export function getPhonemeAudioPath(slug: string): string {
  return `${PHONEME_AUDIO_DIR}/${slug}.webm`;
}

export function getLetterNameAudioPath(slug: string): string {
  return `${LETTER_NAME_AUDIO_DIR}/${slug}.webm`;
}

export function getWordAudioPath(wordId: string): string {
  return `${WORD_AUDIO_DIR}/${wordId}.webm`;
}

export function playAudio(path: string): void {
  const audio = new Audio(path);
  audio.play().catch(() => {
    // Ignore playback errors (e.g. missing file or autoplay restrictions)
  });
}

export async function saveAudio(
  kind: 'phoneme' | 'letter-name' | 'word',
  id: string,
  blob: Blob
): Promise<void> {
  const audioBase64 = await blobToBase64(blob);
  const response = await fetch('/api/audio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind, id, audioBase64 }),
  });
  if (!response.ok) {
    throw new Error(`Failed to save audio for ${id}`);
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        resolve(result.split(',')[1] ?? '');
      } else {
        reject(new Error('Failed to read audio blob'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read audio blob'));
    reader.readAsDataURL(blob);
  });
}
