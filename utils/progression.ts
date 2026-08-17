import { ProgressionInput, ProgressionResult } from '../types/learning-word.types';

export function getProgressionResult(input: ProgressionInput): ProgressionResult {
  const { word, nextIndex, key } = input;
  const normalizedWord = word.toUpperCase();
  const normalizedKey = key.toUpperCase();

  if (nextIndex >= normalizedWord.length) {
    return { kind: 'ignored', nextIndex, completed: true };
  }

  if (!/^[A-Z]$/.test(normalizedKey)) {
    return { kind: 'ignored', nextIndex, completed: false };
  }

  if (normalizedKey !== normalizedWord[nextIndex]) {
    return { kind: 'incorrect', nextIndex, completed: false };
  }

  const updatedIndex = nextIndex + 1;
  const completed = updatedIndex === normalizedWord.length;

  return {
    kind: 'advanced',
    nextIndex: updatedIndex,
    completed,
  };
}
