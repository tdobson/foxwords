import { describe, expect, it } from '@jest/globals';
import { getObjectSpokenLabel } from './count-plurals';
import { LEARNING_WORDS } from './learning-words';

describe('getObjectSpokenLabel', () => {
  const daddy = LEARNING_WORDS.find((w) => w.id === 'daddy')!;
  const fox = LEARNING_WORDS.find((w) => w.id === 'fox')!;
  const games = LEARNING_WORDS.find((w) => w.id === 'games')!;
  const cat = LEARNING_WORDS.find((w) => w.id === 'cat')!;

  it('returns singular promptLabel when count is 1', () => {
    expect(getObjectSpokenLabel({ word: daddy, count: 1 })).toBe('Daddy');
    expect(getObjectSpokenLabel({ word: fox, count: 1 })).toBe('Fox');
  });

  it('resolves irregular plurals correctly', () => {
    expect(getObjectSpokenLabel({ word: daddy, count: 2 })).toBe('Daddies');
    expect(getObjectSpokenLabel({ word: fox, count: 3 })).toBe('Foxes');
  });

  it('keeps games unchanged for plural', () => {
    expect(getObjectSpokenLabel({ word: games, count: 4 })).toBe('Games');
  });

  it('appends s for standard regular nouns', () => {
    expect(getObjectSpokenLabel({ word: cat, count: 2 })).toBe('Cats');
  });
});
