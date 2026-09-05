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

  it('returns Boxes for box count > 1', () => {
    const boxWord = { id: 'box', word: 'BOX', promptLabel: 'Box', accentColor: '#D35400', ipa: [] };
    expect(getObjectSpokenLabel({ word: boxWord, count: 2 })).toBe('Boxes');
  });

  it('returns Buses for bus count > 1', () => {
    const busWord = { id: 'bus', word: 'BUS', promptLabel: 'Bus', accentColor: '#E67E22', ipa: [] };
    expect(getObjectSpokenLabel({ word: busWord, count: 3 })).toBe('Buses');
  });

  it('resolves irregular plurals for levels 11-16 words', () => {
    const cases = [
      { id: 'teddy', promptLabel: 'Teddy', expected: 'Teddies' },
      { id: 'puppy', promptLabel: 'Puppy', expected: 'Puppies' },
      { id: 'fish', promptLabel: 'Fish', expected: 'Fish' },
      { id: 'sheep', promptLabel: 'Sheep', expected: 'Sheep' },
      { id: 'mouse', promptLabel: 'Mouse', expected: 'Mice' },
      { id: 'foot', promptLabel: 'Foot', expected: 'Feet' },
      { id: 'tooth', promptLabel: 'Tooth', expected: 'Teeth' },
    ];

    for (const { id, promptLabel, expected } of cases) {
      const word = {
        id,
        word: promptLabel.toUpperCase(),
        promptLabel,
        accentColor: '#000',
        ipa: [],
      };
      expect(getObjectSpokenLabel({ word, count: 2 })).toBe(expected);
    }
  });
});
