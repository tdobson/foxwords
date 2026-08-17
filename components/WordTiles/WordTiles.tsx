import React from 'react';
import { DifficultyLevel } from '../../types/learning-word.types';
import classes from './WordTiles.module.css';

export interface WordTilesProps {
  word: string;
  nextIndex: number;
  difficulty: DifficultyLevel;
  revealCount?: number;
}

export type TileState = 'completed' | 'active' | 'full-outline' | 'outline' | 'faint' | 'hidden';

export interface TileStateOptions {
  index: number;
  nextIndex: number;
  difficulty: DifficultyLevel;
  revealCount: number;
}

function getTileState({ index, nextIndex, difficulty, revealCount }: TileStateOptions): TileState {
  if (index < nextIndex) {
    return 'completed';
  }
  if (index === nextIndex) {
    return 'active';
  }

  switch (difficulty) {
    case 'full-outline':
      return 'full-outline';
    case 'outline':
      return 'outline';
    case 'faint':
      return 'faint';
    case 'reveal':
      return index < revealCount ? 'faint' : 'hidden';
    default:
      return 'outline';
  }
}

function getAriaLabel(letter: string, state: TileState): string {
  if (state === 'completed') {
    return `Letter ${letter}, completed`;
  }
  if (state === 'active') {
    return `Letter ${letter}, current letter`;
  }
  if (state === 'full-outline') {
    return `Letter ${letter}, full outline`;
  }
  return `Letter ${letter}, ${state}`;
}

export function WordTiles({
  word,
  nextIndex,
  difficulty,
  revealCount = word.length,
}: WordTilesProps) {
  const letters = word.toUpperCase().split('');

  return (
    <ol className={classes.tilesContainer} aria-label="Word letter tiles">
      {letters.map((letter, index) => {
        const state = getTileState({
          index,
          nextIndex,
          difficulty,
          revealCount,
        });
        const ariaLabel = getAriaLabel(letter, state);
        const isHidden = state === 'hidden';

        return (
          <li
            key={`${letter}-${index}`}
            className={classes.tile}
            data-testid={`letter-tile-${index}`}
            data-state={state}
            aria-label={ariaLabel}
          >
            {isHidden ? '' : letter}
          </li>
        );
      })}
    </ol>
  );
}
