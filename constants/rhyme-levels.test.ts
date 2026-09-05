import { describe, expect, it } from '@jest/globals';
import { LEARNING_WORDS } from './learning-words';
import { RHYME_LEVELS } from './rhyme-levels';

function wordById(id: string) {
  return LEARNING_WORDS.find((word) => word.id === id);
}

describe('RHYME_LEVELS', () => {
  it('contains Level 1 and Level 2 with 6 questions each', () => {
    expect(RHYME_LEVELS).toHaveLength(2);
    expect(RHYME_LEVELS[0].levelNumber).toBe(1);
    expect(RHYME_LEVELS[0].name).toBe('Core CVC Rhymes');
    expect(RHYME_LEVELS[0].questions).toHaveLength(6);
    expect(RHYME_LEVELS[1].levelNumber).toBe(2);
    expect(RHYME_LEVELS[1].name).toBe('Mixed & Blends Rhymes');
    expect(RHYME_LEVELS[1].questions).toHaveLength(6);
  });

  it('references only word IDs that exist in LEARNING_WORDS', () => {
    for (const level of RHYME_LEVELS) {
      for (const question of level.questions) {
        expect(wordById(question.targetWordId)).toBeDefined();
        expect(wordById(question.leftChoice.wordId)).toBeDefined();
        expect(wordById(question.rightChoice.wordId)).toBeDefined();
      }
    }
  });

  it('has exactly one rhyming choice per question', () => {
    for (const level of RHYME_LEVELS) {
      for (const question of level.questions) {
        const rhymeFlags = [question.leftChoice.isRhyme, question.rightChoice.isRhyme];
        expect(rhymeFlags.filter(Boolean)).toHaveLength(1);
      }
    }
  });

  it('gives left and right choices distinct initial letters', () => {
    for (const level of RHYME_LEVELS) {
      for (const question of level.questions) {
        const leftWord = wordById(question.leftChoice.wordId)!;
        const rightWord = wordById(question.rightChoice.wordId)!;
        const leftInitial = leftWord.word[0].toLowerCase();
        const rightInitial = rightWord.word[0].toLowerCase();
        expect(leftInitial).not.toBe(rightInitial);
      }
    }
  });
});
