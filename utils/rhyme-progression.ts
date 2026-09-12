import type { RhymeQuestion } from '../types/learning-word.types';

export type RhymeSide = 'left' | 'right';

export interface RhymeInput {
  key: string;
  leftWord: string;
  rightWord: string;
  question: RhymeQuestion;
  code?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

export interface RhymeInputResult {
  selectedSide: RhymeSide | null;
  isCorrect: boolean;
}

function resultFor(side: RhymeSide, question: RhymeQuestion): RhymeInputResult {
  const choice = side === 'left' ? question.leftChoice : question.rightChoice;
  return { selectedSide: side, isCorrect: choice.isRhyme };
}

export function resolveRhymeInput(input: RhymeInput): RhymeInputResult {
  const { key, leftWord, rightWord, question, code, ctrlKey, metaKey, altKey } = input;

  if (ctrlKey || metaKey || altKey) {
    return { selectedSide: null, isCorrect: false };
  }

  if (key === 'ArrowLeft' || key === 'a' || key === 'A' || code === 'KeyA') {
    return resultFor('left', question);
  }

  if (key === 'ArrowRight' || key === 'd' || key === 'D' || code === 'KeyD') {
    return resultFor('right', question);
  }

  const pressed = key.toLowerCase();
  if (pressed.length === 1) {
    if (pressed === leftWord[0]?.toLowerCase()) {
      return resultFor('left', question);
    }
    if (pressed === rightWord[0]?.toLowerCase()) {
      return resultFor('right', question);
    }
  }

  return { selectedSide: null, isCorrect: false };
}
