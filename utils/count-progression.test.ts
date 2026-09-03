import { describe, expect, it } from '@jest/globals';
import { getCountProgressionResult } from './count-progression';

describe('getCountProgressionResult', () => {
  it('advances on correct single digit', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: '2' })).toEqual({
      kind: 'advanced',
      nextIndex: 1,
      completed: true,
    });
  });

  it('marks incorrect on wrong single digit', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: '3' })).toEqual({
      kind: 'incorrect',
      nextIndex: 0,
      completed: false,
    });
  });

  it('advances on first digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 0, key: '1' })).toEqual({
      kind: 'advanced',
      nextIndex: 1,
      completed: false,
    });
  });

  it('completes on second digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 1, key: '2' })).toEqual({
      kind: 'advanced',
      nextIndex: 2,
      completed: true,
    });
  });

  it('shakes on wrong second digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 1, key: '3' })).toEqual({
      kind: 'incorrect',
      nextIndex: 1,
      completed: false,
    });
  });

  it('ignores non-digit keys (letters, symbols, navigation)', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: 'd' })).toEqual({
      kind: 'ignored',
      nextIndex: 0,
      completed: false,
    });
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: 'Enter' })).toEqual({
      kind: 'ignored',
      nextIndex: 0,
      completed: false,
    });
  });

  it('ignores input once number is already completed', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 1, key: '2' })).toEqual({
      kind: 'ignored',
      nextIndex: 1,
      completed: true,
    });
  });
});
