import { DifficultyDefinition, DifficultyLevel } from '../types/learning-word.types';

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyDefinition> = {
  faint: {
    value: 'faint',
    label: 'Faint',
    description: 'Unfinished letters shown with faint outlines',
  },
  reveal: {
    value: 'reveal',
    label: 'Reveal',
    description: 'Only the current letter is shown',
  },
};
