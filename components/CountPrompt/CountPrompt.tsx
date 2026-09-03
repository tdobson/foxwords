import React from 'react';
import { Paper } from '@mantine/core';
import { LearningWord } from '../../types/learning-word.types';
import classes from './CountPrompt.module.css';

export interface CountPromptProps {
  word: LearningWord;
  count: number;
  layout: 'row' | 'tens' | 'grid';
  numberNextIndex: number;
  hintRevealed: boolean;
  isCorrect: boolean;
}

export function CountPrompt({
  word,
  count,
  layout,
  numberNextIndex,
  hintRevealed,
  isCorrect,
}: CountPromptProps) {
  const targetStr = count.toString();
  const digits = targetStr.split('');

  const renderItem = (key: string) => (
    <div key={key} className={classes.itemWrapper} data-testid="count-item" aria-hidden="true">
      {word.promptPhoto ? (
        <img
          src={word.promptPhoto}
          alt={`One of ${count} ${word.promptLabel}`}
          className={classes.itemPhoto}
        />
      ) : (
        <span>{word.promptImage || '✨'}</span>
      )}
    </div>
  );

  const renderCluster = () => {
    if (layout === 'tens') {
      const tenGroupsCount = Math.floor(count / 10);
      const remainder = count % 10;
      const groups = [];

      for (let g = 0; g < tenGroupsCount; g += 1) {
        const tenItems = [];
        for (let i = 0; i < 10; i += 1) {
          tenItems.push(renderItem(`ten-${g}-${i}`));
        }
        groups.push(
          <div
            key={`group-${g}`}
            className={classes.tensGroup}
            data-testid={`tens-group-${g}`}
            aria-label="Group of 10 items"
          >
            {tenItems}
          </div>
        );
      }

      if (remainder > 0) {
        const onesItems = [];
        for (let i = 0; i < remainder; i += 1) {
          onesItems.push(renderItem(`rem-${i}`));
        }
        groups.push(
          <div
            key="remainder"
            className={classes.onesGroup}
            data-testid="ones-group"
            aria-label={`${remainder} leftover items`}
          >
            {onesItems}
          </div>
        );
      }

      return <div className={classes.tensLayout}>{groups}</div>;
    }

    if (layout === 'grid') {
      const items = Array.from({ length: count }, (_, i) => renderItem(`grid-${i}`));
      return <div className={classes.gridLayout}>{items}</div>;
    }

    const items = Array.from({ length: count }, (_, i) => renderItem(`row-${i}`));
    return <div className={classes.rowLayout}>{items}</div>;
  };

  return (
    <Paper
      className={classes.countCard}
      style={{ borderColor: word.accentColor }}
      role="region"
      aria-label={`Count prompt with ${count} objects`}
    >
      <div className={classes.clusterContainer}>{renderCluster()}</div>

      <ol className={classes.numberTilesContainer} aria-label="Number answer tiles">
        {digits.map((digit, index) => {
          let state: 'completed' | 'faint' | 'hidden' = 'hidden';

          if (isCorrect || index < numberNextIndex) {
            state = 'completed';
          } else if (hintRevealed) {
            state = 'faint';
          }

          return (
            <li
              key={`digit-tile-${index}`}
              className={classes.numberTile}
              data-testid={`number-tile-${index}`}
              data-state={state}
              aria-label={
                state === 'completed'
                  ? `Digit ${digit}, completed`
                  : state === 'faint'
                    ? `Digit ${digit}, hint`
                    : `Digit ${index + 1} of ${digits.length}, blank`
              }
            >
              {state === 'hidden' ? '' : digit}
            </li>
          );
        })}
      </ol>
    </Paper>
  );
}
