import type { LearningWord } from '../../types/learning-word.types';
import { getWordAudioPath } from '../../utils/audio';

export interface AudioResolution {
  source: 'family' | 'tim' | 'speech';
  audioPath?: string;
  utteranceText?: string;
}

/**
 * Resolves the playback source for a word or system prompt according to the strict priority chain:
 * 1. Family custom audio (if provided on the word or in profile overrides)
 * 2. Tim's bundled clips (/audio/...)
 * 3. Web Speech synthesis fallback
 */
export function resolveWordAudio(
  word: LearningWord,
  availableTimClips: Set<string>
): AudioResolution {
  // 1. Family custom audio wins
  if (word.audioUrl) {
    return {
      source: 'family',
      audioPath: word.audioUrl,
    };
  }

  // 2. Tim's bundled clips
  const bundledPath = getWordAudioPath(word.id.toLowerCase());
  const clipId = word.id.toLowerCase();
  if (availableTimClips.has(clipId)) {
    return {
      source: 'tim',
      audioPath: bundledPath,
    };
  }

  // 3. Web Speech fallback
  return {
    source: 'speech',
    utteranceText: word.promptLabel || word.word,
  };
}

export function resolveSystemClip(
  _clipKey: string,
  familyOverrideUrl: string | undefined,
  timClipPath: string | undefined,
  speechFallbackText: string
): AudioResolution {
  if (familyOverrideUrl) {
    return {
      source: 'family',
      audioPath: familyOverrideUrl,
    };
  }

  if (timClipPath) {
    return {
      source: 'tim',
      audioPath: timClipPath,
    };
  }

  return {
    source: 'speech',
    utteranceText: speechFallbackText,
  };
}
