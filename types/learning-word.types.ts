export type DifficultyLevel = 'faint' | 'reveal';
export type GameMode = 'words' | 'quiz';
export type ProgressionKind = 'advanced' | 'incorrect' | 'ignored';

export interface DifficultyDefinition {
  value: DifficultyLevel;
  label: string;
  description: string;
}

export interface LearningWord {
  id: string;
  word: string;
  promptLabel: string;
  accentColor: string;
  promptImage?: string;
  ipa: string[];
}

export interface Phoneme {
  symbol: string;
  slug: string;
  label: string;
  examples: string[];
}

export interface ProgressionInput {
  word: string;
  nextIndex: number;
  key: string;
}

export interface ProgressionResult {
  kind: ProgressionKind;
  nextIndex: number;
  completed: boolean;
}
