export type DifficultyLevel = 'faint' | 'reveal';
export type GameMode = 'words' | 'quiz' | 'count' | 'rhyme';
export type CountDifficulty = 'easy' | 'medium' | 'hard';

export interface RhymeChoice {
  wordId: string;
  isRhyme: boolean;
}

export interface RhymeQuestion {
  targetWordId: string;
  leftChoice: RhymeChoice;
  rightChoice: RhymeChoice;
}

export interface RhymeLevel {
  levelNumber: number;
  name: string;
  questions: RhymeQuestion[];
}
export type ProgressionKind = 'advanced' | 'incorrect' | 'ignored';

export interface DifficultyDefinition {
  value: DifficultyLevel;
  label: string;
  description: string;
}

export interface CountDifficultyDefinition {
  value: CountDifficulty;
  label: string;
  description: string;
  minCount: number;
  maxCount: number;
}

export interface LearningWord {
  id: string;
  word: string;
  promptLabel: string;
  accentColor: string;
  /** Emoji fallback (also used when no photo exists) */
  promptImage?: string;
  /** Number of times to repeat promptImage for plurals (e.g. 3 cars) */
  promptRepeat?: number;
  /** Photo path in public/images/words (e.g. /images/words/daddy.jpg) */
  promptPhoto?: string;
  ipa: string[];
}

export interface Phoneme {
  symbol: string;
  slug: string;
  label: string;
  examples: string[];
  letterName?: string;
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

export interface CountProgressionInput {
  targetNumber: number;
  nextIndex: number;
  key: string;
}

export interface CountProgressionResult {
  kind: ProgressionKind;
  nextIndex: number;
  completed: boolean;
}
