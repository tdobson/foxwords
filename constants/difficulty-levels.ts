import { DifficultyDefinition, DifficultyLevel } from '../types/learning-word.types';

export const REVEAL_DELAY_MS = 5000;

export const DIFFICULTY_LEVELS: Record<DifficultyLevel, DifficultyDefinition> = {
  'full-outline': {
    value: 'full-outline',
    label: 'Full outline',
    description: 'All letters shown with strong outlines',
  },
  outline: {
    value: 'outline',
    label: 'Outline',
    description: 'Completed letters solid, unfinished outlined',
  },
  faint: {
    value: 'faint',
    label: 'Faint',
    description: 'Unfinished letters shown with faint outlines',
  },
  reveal: {
    value: 'reveal',
    label: 'Reveal',
    description: 'Unfinished letters appear one by one after delay',
  },
};
