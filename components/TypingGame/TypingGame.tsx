'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { REVEAL_DELAY_MS } from '../../constants/difficulty-levels';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { DifficultyLevel } from '../../types/learning-word.types';
import { getProgressionResult } from '../../utils/progression';
import { GameControls } from '../GameControls/GameControls';
import { PromptCard } from '../PromptCard/PromptCard';
import { WordTiles } from '../WordTiles/WordTiles';
import classes from './TypingGame.module.css';

const CELEBRATION_DURATION_MS = 1500;
const FEEDBACK_DURATION_MS = 350;
const ERROR_MESSAGE_DURATION_MS = 2000;

function getStatusMessage(
  completed: boolean,
  nextIndex: number,
  totalLetters: number,
  hasError: boolean
): string {
  if (completed) {
    return '🌟 Word complete! 🌟';
  }
  if (hasError) {
    return 'Try the highlighted letter!';
  }
  return `${nextIndex} of ${totalLetters} letters typed`;
}

export function TypingGame() {
  const [wordIndex, setWordIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('full-outline');
  const [revealCount, setRevealCount] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'shake' | 'celebrate'>('none');
  const [hasErrorStatus, setHasErrorStatus] = useState(false);

  const errorStatusTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentWord = LEARNING_WORDS[wordIndex % LEARNING_WORDS.length];

  const clearErrorStatusTimer = useCallback(() => {
    if (errorStatusTimerRef.current) {
      clearTimeout(errorStatusTimerRef.current);
      errorStatusTimerRef.current = null;
    }
  }, []);

  const handleNextWord = useCallback(() => {
    clearErrorStatusTimer();
    setWordIndex((prev) => (prev + 1) % LEARNING_WORDS.length);
    setNextIndex(0);
    setRevealCount(1);
    setIsCompleted(false);
    setFeedback('none');
    setHasErrorStatus(false);
  }, [clearErrorStatusTimer]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isCompleted || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      const result = getProgressionResult({
        word: currentWord.word,
        nextIndex,
        key: event.key,
      });

      if (result.kind === 'advanced') {
        clearErrorStatusTimer();
        setHasErrorStatus(false);
        setNextIndex(result.nextIndex);
        setRevealCount((prev) => Math.max(prev, result.nextIndex + 1));
        setFeedback('none');
        if (result.completed) {
          setIsCompleted(true);
          setFeedback('celebrate');
        }
      } else if (result.kind === 'incorrect') {
        setFeedback('shake');
        setHasErrorStatus(true);
        clearErrorStatusTimer();
        errorStatusTimerRef.current = setTimeout(() => {
          setHasErrorStatus(false);
        }, ERROR_MESSAGE_DURATION_MS);
      }
    },
    [clearErrorStatusTimer, currentWord.word, isCompleted, nextIndex]
  );

  useEffect(() => {
    return () => {
      clearErrorStatusTimer();
    };
  }, [clearErrorStatusTimer]);

  useEffect(() => {
    if (feedback === 'shake') {
      const id = setTimeout(() => {
        setFeedback('none');
      }, FEEDBACK_DURATION_MS);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [feedback]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isCompleted) {
      return undefined;
    }
    const timer = setTimeout(handleNextWord, CELEBRATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [isCompleted, handleNextWord]);

  useEffect(() => {
    if (difficulty !== 'reveal' || isCompleted) {
      return undefined;
    }
    if (revealCount >= currentWord.word.length) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setRevealCount((prev) => prev + 1);
    }, REVEAL_DELAY_MS);

    return () => clearTimeout(timer);
  }, [difficulty, revealCount, nextIndex, currentWord.word.length, isCompleted]);

  const statusText = getStatusMessage(
    isCompleted,
    nextIndex,
    currentWord.word.length,
    hasErrorStatus
  );

  return (
    <main className={classes.gameWrapper}>
      <header className={classes.gameHeader}>
        <h1 className={classes.gameTitle}>Letter Trail</h1>
        <div role="status" aria-live="polite" className={classes.statusText}>
          {statusText}
        </div>
      </header>

      <section className={classes.interactiveArea} data-feedback={feedback}>
        <PromptCard word={currentWord} />
        <WordTiles
          word={currentWord.word}
          nextIndex={nextIndex}
          difficulty={difficulty}
          revealCount={revealCount}
        />
      </section>

      <p className={classes.keyboardHint}>Press the highlighted letter on your physical keyboard</p>

      <GameControls
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onNewWord={handleNextWord}
      />
    </main>
  );
}
