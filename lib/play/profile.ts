import { LEARNING_WORDS } from '../../constants/learning-words';
import type { LearningWord } from '../../types/learning-word.types';

export const DEFAULT_CHILD_NAME = 'Little Fox';

const PROTOTYPE_WORD_IDS = new Set(['james', 'sarah']);

/** Starter words for a child with no family profile. */
export const STARTER_WORDS: LearningWord[] = LEARNING_WORDS.filter(
  (word) => !PROTOTYPE_WORD_IDS.has(word.id)
);

/**
 * The child's play state. `words` is the finished list from GET /api/play/<code>
 * (child first, then family and custom words, then starter words) and is used as-is.
 */
export interface PlayProfile {
  playCode: string;
  childName: string;
  words: LearningWord[];
  audioOverrides: Record<string, string>;
}

export interface PlayPayload {
  childName: string;
  words: LearningWord[];
  audioOverrides?: Record<string, string>;
}

export function profileFromPlayPayload(playCode: string, payload: PlayPayload): PlayProfile {
  return {
    playCode,
    childName: payload.childName,
    words: payload.words,
    audioOverrides: payload.audioOverrides ?? {},
  };
}

export function isSamePlayCode(profile: PlayProfile | null, playCode: string): boolean {
  return profile !== null && profile.playCode.toUpperCase() === playCode.toUpperCase();
}

export function wordsForProfile(profile: PlayProfile | null): LearningWord[] {
  return profile && profile.words.length > 0 ? profile.words : STARTER_WORDS;
}

function isLearningWordShape(value: unknown): value is LearningWord {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<LearningWord>;
  return typeof candidate.id === 'string' && typeof candidate.word === 'string';
}

/** Validates a profile read back from sessionStorage. Anything older or odd is discarded. */
export function parseStoredProfile(value: unknown): PlayProfile | null {
  if (!value || typeof value !== 'object') {
    return null;
  }
  const candidate = value as Partial<PlayProfile>;
  if (
    typeof candidate.playCode !== 'string' ||
    typeof candidate.childName !== 'string' ||
    !Array.isArray(candidate.words) ||
    candidate.words.length === 0 ||
    !candidate.words.every(isLearningWordShape)
  ) {
    return null;
  }
  const overrides =
    candidate.audioOverrides && typeof candidate.audioOverrides === 'object'
      ? candidate.audioOverrides
      : {};
  return {
    playCode: candidate.playCode,
    childName: candidate.childName,
    words: candidate.words,
    audioOverrides: overrides as Record<string, string>,
  };
}
