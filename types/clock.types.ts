export type ClockDifficulty = 'easy' | 'medium' | 'hard' | 'ultra';

export interface ClockToken {
  key: string;
  text: string;
}

export interface ClockTargetTime {
  id: string;
  hour: number; // 1 - 12
  minute: number; // 0 - 55 in steps of 5
  difficulty: ClockDifficulty;
  spokenPhrase: string; // e.g. "It is quarter to 8"
  audioSlug: string; // e.g. "clock-it-is-quarter-to-8"
  tokens: ClockToken[];
}

export interface ClockProgressionState {
  tokenIndex: number;
  enteredKeyBuffer: string;
}

export type ClockProgressionKind = 'advanced' | 'incorrect' | 'ignored';

export interface ClockProgressionResult {
  kind: ClockProgressionKind;
  state: ClockProgressionState;
  completed: boolean;
  revealedText: string;
}
