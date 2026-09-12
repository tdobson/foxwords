import type { CountProgressionInput, CountProgressionResult } from '../types/learning-word.types';

export function getCountProgressionResult(input: CountProgressionInput): CountProgressionResult {
  const { targetNumber, nextIndex, key } = input;
  const targetStr = targetNumber.toString();

  if (nextIndex >= targetStr.length) {
    return { kind: 'ignored', nextIndex, completed: true };
  }

  // Only accept digits 0-9
  if (!/^[0-9]$/.test(key)) {
    return { kind: 'ignored', nextIndex, completed: false };
  }

  const expectedChar = targetStr[nextIndex];
  if (key !== expectedChar) {
    return { kind: 'incorrect', nextIndex, completed: false };
  }

  const updatedIndex = nextIndex + 1;
  const completed = updatedIndex === targetStr.length;

  return {
    kind: 'advanced',
    nextIndex: updatedIndex,
    completed,
  };
}
