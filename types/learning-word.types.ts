export type DifficultyLevel = 'faint' | 'reveal';
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
  audioSrc?: string;
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
