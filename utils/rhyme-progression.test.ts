import { describe, expect, it } from '@jest/globals';
import type { RhymeQuestion } from '../types/learning-word.types';
import { resolveRhymeInput } from './rhyme-progression';

const question: RhymeQuestion = {
  targetWordId: 'cat',
  leftChoice: { wordId: 'hat', isRhyme: true },
  rightChoice: { wordId: 'dog', isRhyme: false },
};

const base = {
  leftWord: 'HAT',
  rightWord: 'DOG',
  question,
};

describe('resolveRhymeInput', () => {
  it('selects left on ArrowLeft and KeyA / a / A', () => {
    expect(resolveRhymeInput({ ...base, key: 'ArrowLeft' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
    expect(resolveRhymeInput({ ...base, key: 'a' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
    expect(resolveRhymeInput({ ...base, key: 'A' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
    expect(resolveRhymeInput({ ...base, key: '', code: 'KeyA' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
  });

  it('selects right on ArrowRight and KeyD / d / D', () => {
    expect(resolveRhymeInput({ ...base, key: 'ArrowRight' })).toEqual({
      selectedSide: 'right',
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: 'd' })).toEqual({
      selectedSide: 'right',
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: 'D' })).toEqual({
      selectedSide: 'right',
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: '', code: 'KeyD' })).toEqual({
      selectedSide: 'right',
      isCorrect: false,
    });
  });

  it('selects by first letter of each word, case-insensitive', () => {
    expect(resolveRhymeInput({ ...base, key: 'h' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
    expect(resolveRhymeInput({ ...base, key: 'H' })).toEqual({
      selectedSide: 'left',
      isCorrect: true,
    });
    expect(resolveRhymeInput({ ...base, key: 'd' })).toEqual({
      selectedSide: 'right',
      isCorrect: false,
    });
  });

  it('reports isCorrect from the chosen side of the question', () => {
    const rhymeOnRight: RhymeQuestion = {
      targetWordId: 'frog',
      leftChoice: { wordId: 'bus', isRhyme: false },
      rightChoice: { wordId: 'log', isRhyme: true },
    };

    expect(
      resolveRhymeInput({
        key: 'ArrowLeft',
        leftWord: 'BUS',
        rightWord: 'LOG',
        question: rhymeOnRight,
      })
    ).toEqual({ selectedSide: 'left', isCorrect: false });

    expect(
      resolveRhymeInput({
        key: 'l',
        leftWord: 'BUS',
        rightWord: 'LOG',
        question: rhymeOnRight,
      })
    ).toEqual({ selectedSide: 'right', isCorrect: true });
  });

  it('ignores unrelated keys', () => {
    expect(resolveRhymeInput({ ...base, key: 'x' })).toEqual({
      selectedSide: null,
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: 'Enter' })).toEqual({
      selectedSide: null,
      isCorrect: false,
    });
  });

  it('ignores ctrl, meta, and alt modifier combinations', () => {
    expect(resolveRhymeInput({ ...base, key: 'ArrowLeft', ctrlKey: true })).toEqual({
      selectedSide: null,
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: 'h', metaKey: true })).toEqual({
      selectedSide: null,
      isCorrect: false,
    });
    expect(resolveRhymeInput({ ...base, key: 'd', altKey: true })).toEqual({
      selectedSide: null,
      isCorrect: false,
    });
  });
});
