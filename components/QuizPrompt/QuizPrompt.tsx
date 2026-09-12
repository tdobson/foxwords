import { Paper, Title } from '@mantine/core';
import React from 'react';
import type { LearningWord } from '../../types/learning-word.types';
import classes from './QuizPrompt.module.css';

export interface QuizPromptProps {
  word: LearningWord;
  isCorrect: boolean;
}

export function QuizPrompt({ word, isCorrect }: QuizPromptProps) {
  const promptGlyph = word.promptImage || '✨';
  const firstLetter = word.word[0];

  return (
    <Paper
      className={classes.quizCard}
      style={{ borderColor: word.accentColor }}
      role="region"
      aria-label={`What letter does ${word.promptLabel} start with?`}
    >
      {word.photoUrl || word.promptPhoto ? (
        <img
          src={word.photoUrl || word.promptPhoto}
          alt={`Photo of ${word.promptLabel}`}
          className={classes.promptPhoto}
        />
      ) : (
        <div className={classes.promptArt} aria-hidden="true">
          {promptGlyph}
        </div>
      )}
      <Title order={2} className={classes.promptLabel}>
        {word.promptLabel}
      </Title>
      <div className={classes.blankLine} data-testid="quiz-blank" data-correct={isCorrect}>
        <span className={classes.blankTile} aria-hidden="true">
          {isCorrect ? firstLetter : ''}
        </span>
      </div>
    </Paper>
  );
}
