/**
 * @fileoverview Audio helpers for letter and word sounds
 * @module utils/audio
 */

const LETTER_AUDIO_DIR = '/audio/letters';
const WORD_AUDIO_DIR = '/audio/words';

export function getLetterAudioPath(letter: string): string {
  return `${LETTER_AUDIO_DIR}/${letter.toUpperCase()}.webm`;
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
