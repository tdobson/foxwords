import type { RhymeLevel } from '../types/learning-word.types';

export const RHYME_LEVELS: RhymeLevel[] = [
  {
    levelNumber: 1,
    name: 'Core CVC Rhymes',
    questions: [
      {
        targetWordId: 'cat',
        leftChoice: { wordId: 'hat', isRhyme: true },
        rightChoice: { wordId: 'dog', isRhyme: false },
      },
      {
        targetWordId: 'frog',
        leftChoice: { wordId: 'bus', isRhyme: false },
        rightChoice: { wordId: 'log', isRhyme: true },
      },
      {
        targetWordId: 'rat',
        leftChoice: { wordId: 'bat', isRhyme: true },
        rightChoice: { wordId: 'pig', isRhyme: false },
      },
      {
        targetWordId: 'bug',
        leftChoice: { wordId: 'sun', isRhyme: false },
        rightChoice: { wordId: 'mug', isRhyme: true },
      },
      {
        targetWordId: 'pan',
        leftChoice: { wordId: 'van', isRhyme: true },
        rightChoice: { wordId: 'pot', isRhyme: false },
      },
      {
        targetWordId: 'fox',
        leftChoice: { wordId: 'hen', isRhyme: false },
        rightChoice: { wordId: 'box', isRhyme: true },
      },
    ],
  },
  {
    levelNumber: 2,
    name: 'Mixed & Blends Rhymes',
    questions: [
      {
        targetWordId: 'train',
        leftChoice: { wordId: 'rain', isRhyme: true },
        rightChoice: { wordId: 'track', isRhyme: false },
      },
      {
        targetWordId: 'car',
        leftChoice: { wordId: 'cup', isRhyme: false },
        rightChoice: { wordId: 'star', isRhyme: true },
      },
      {
        targetWordId: 'moon',
        leftChoice: { wordId: 'spoon', isRhyme: true },
        rightChoice: { wordId: 'boot', isRhyme: false },
      },
      {
        targetWordId: 'log',
        leftChoice: { wordId: 'frog', isRhyme: true },
        rightChoice: { wordId: 'pig', isRhyme: false },
      },
      {
        targetWordId: 'bat',
        leftChoice: { wordId: 'fox', isRhyme: false },
        rightChoice: { wordId: 'rat', isRhyme: true },
      },
      {
        targetWordId: 'mug',
        leftChoice: { wordId: 'bug', isRhyme: true },
        rightChoice: { wordId: 'nut', isRhyme: false },
      },
    ],
  },
];
