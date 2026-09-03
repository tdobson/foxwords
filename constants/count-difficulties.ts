import { CountDifficulty, CountDifficultyDefinition } from '../types/learning-word.types';

export const COUNT_DIFFICULTIES: Record<CountDifficulty, CountDifficultyDefinition> = {
  easy: {
    value: 'easy',
    label: 'Easy',
    description: 'Counts 1–9. Type the single digit.',
    minCount: 1,
    maxCount: 9,
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    description: 'Counts 10–20. Type both digits (tens and ones layout).',
    minCount: 10,
    maxCount: 20,
  },
  hard: {
    value: 'hard',
    label: 'Hard',
    description: 'Counts 1–20. Type the digit(s) then spell the word.',
    minCount: 1,
    maxCount: 20,
  },
};
