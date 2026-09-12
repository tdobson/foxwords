import type { LearningWord } from '../types/learning-word.types';

export const IRREGULAR_PLURALS: Record<string, string> = {
  daddy: 'Daddies',
  mummy: 'Mummies',
  baby: 'Babies',
  granny: 'Grannies',
  fox: 'Foxes',
  splash: 'Splashes',
  orange: 'Oranges',
  games: 'Games',
  box: 'Boxes',
  bus: 'Buses',
  teddy: 'Teddies',
  puppy: 'Puppies',
  fish: 'Fish',
  sheep: 'Sheep',
  mouse: 'Mice',
  foot: 'Feet',
  tooth: 'Teeth',
};

export interface ObjectSpokenLabelOptions {
  word: LearningWord;
  count: number;
}

export function getObjectSpokenLabel({ word, count }: ObjectSpokenLabelOptions): string {
  if (count === 1) {
    return word.promptLabel;
  }
  if (IRREGULAR_PLURALS[word.id]) {
    return IRREGULAR_PLURALS[word.id];
  }
  return `${word.promptLabel}s`;
}
