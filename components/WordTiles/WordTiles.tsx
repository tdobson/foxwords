import React from 'react';
import type { DifficultyLevel } from '../../types/learning-word.types';
import classes from './WordTiles.module.css';

export interface WordTilesProps {
  word: string;
  nextIndex: number;
  difficulty: DifficultyLevel;
}

export type TileState = 'completed' | 'active' | 'faint' | 'hidden';

export interface TileStateOptions {
  index: number;
  nextIndex: number;
  difficulty: DifficultyLevel;
}

function getTileState({ index, nextIndex, difficulty }: TileStateOptions): TileState {
  if (index < nextIndex) {
    return 'completed';
  }
  if (index === nextIndex) {
    return 'active';
  }

  switch (difficulty) {
    case 'faint':
      return 'faint';
    case 'reveal':
      return 'hidden';
    default:
      return 'faint';
  }
}

function getAriaLabel(letter: string, state: TileState): string {
  if (state === 'completed') {
    return `Letter ${letter}, completed`;
  }
  if (state === 'active') {
    return `Letter ${letter}, current letter`;
  }
  return `Letter ${letter}, ${state}`;
}

export function WordTiles({ word, nextIndex, difficulty }: WordTilesProps) {
  const letters = word.toUpperCase().split('');

  return (
    <ol className={classes.tilesContainer} aria-label="Word letter tiles">
      {letters.map((letter, index) => {
        const state = getTileState({
          index,
          nextIndex,
          difficulty,
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
