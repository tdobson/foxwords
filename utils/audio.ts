/**
 * @fileoverview Audio helpers for letter and word sounds
 * @module utils/audio
 */

const PHONEME_AUDIO_DIR = '/audio/phonemes';
const WORD_AUDIO_DIR = '/audio/words';

export function getPhonemeAudioPath(slug: string): string {
  return `${PHONEME_AUDIO_DIR}/${slug}.webm`;
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
