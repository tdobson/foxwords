import React from 'react';
import { Paper, Title } from '@mantine/core';
import { LearningWord } from '../../types/learning-word.types';
import classes from './PromptCard.module.css';

export interface PromptCardProps {
  word: LearningWord;
}

export function PromptCard({ word }: PromptCardProps) {
  const promptGlyph = word.promptImage || '✨';

  return (
    <Paper
      className={classes.promptCard}
      style={{ borderColor: word.accentColor }}
      role="region"
      aria-label={`Prompt for ${word.promptLabel}`}
    >
      <div className={classes.promptArt} aria-hidden="true">
        {promptGlyph}
      </div>
      <Title order={2} className={classes.promptLabel}>
        {word.promptLabel}
      </Title>
    </Paper>
  );
}
