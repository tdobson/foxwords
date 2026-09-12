import { Paper, Title } from '@mantine/core';
import React from 'react';
import type { LearningWord } from '../../types/learning-word.types';
import classes from './PromptCard.module.css';

export interface PromptCardProps {
  word: LearningWord;
}

export function PromptCard({ word }: PromptCardProps) {
  const promptGlyph = word.promptImage || '✨';
  const repeatCount = word.promptRepeat && word.promptRepeat > 1 ? word.promptRepeat : 1;
  const displayGlyphs = Array.from({ length: repeatCount }, () => promptGlyph).join(' ');

  return (
    <Paper
      className={classes.promptCard}
      style={{ borderColor: word.accentColor }}
      role="region"
      aria-label={`Prompt for ${word.promptLabel}`}
    >
      {word.photoUrl || word.promptPhoto ? (
        <img
          src={word.photoUrl || word.promptPhoto}
          alt={`Photo of ${word.promptLabel}`}
          className={classes.promptPhoto}
        />
      ) : (
        <div
          className={classes.promptArt}
          data-multi={repeatCount > 1 ? 'true' : undefined}
          aria-hidden="true"
        >
          {displayGlyphs}
        </div>
      )}
      <Title order={2} className={classes.promptLabel}>
        {word.promptLabel}
      </Title>
    </Paper>
  );
}
