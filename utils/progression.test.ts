import { describe, expect, it } from '@jest/globals';
import { getProgressionResult } from './progression';

describe('getProgressionResult', () => {
  it('advances when the pressed letter is the expected letter', () => {
    expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'j' })).toEqual({
      kind: 'advanced',
      nextIndex: 1,
      completed: false,
    });
  });

  it('does not advance for a wrong letter', () => {
    expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'x' })).toEqual({
      kind: 'incorrect',
      nextIndex: 0,
      completed: false,
    });
  });

  it('ignores non-letter keys', () => {
    expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'ArrowLeft' })).toEqual({
      kind: 'ignored',
      nextIndex: 0,
      completed: false,
    });
  });

  it('reports completion on the final matching letter', () => {
    expect(getProgressionResult({ word: 'JAMES', nextIndex: 4, key: 's' })).toEqual({
      kind: 'advanced',
      nextIndex: 5,
      completed: true,
    });
  });

  it('does not advance after completion', () => {
    expect(getProgressionResult({ word: 'JAMES', nextIndex: 5, key: 's' })).toEqual({
      kind: 'ignored',
      nextIndex: 5,
      completed: true,
    });
  });
});
