'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { RHYME_LEVELS } from '../../constants/rhyme-levels';
import { LearningWord, RhymeQuestion } from '../../types/learning-word.types';
import { playWordSound } from '../../utils/audio';
import { RhymeSide, resolveRhymeInput } from '../../utils/rhyme-progression';
import classes from './RhymeGame.module.css';

const SHAKE_MS = 400;
const ADVANCE_MS = 1200;
const TOAST_MS = 1200;

function getWord(id: string): LearningWord {
  const word = LEARNING_WORDS.find((item) => item.id === id);
  if (!word) {
    throw new Error(`Unknown learning word: ${id}`);
  }
  return word;
}

function renderHighlightedLabel(word: string) {
  return (
    <>
      <span className={classes.firstLetter}>{word[0]}</span>
      {word.slice(1)}
    </>
  );
}

export function RhymeGame() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedSide, setSelectedSide] = useState<RhymeSide | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [isCorrectPick, setIsCorrectPick] = useState(false);
  const [showLevelToast, setShowLevelToast] = useState(false);
  const [completedLevelNumber, setCompletedLevelNumber] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const currentLevel = RHYME_LEVELS[levelIndex];
  const question: RhymeQuestion = currentLevel.questions[questionIndex];
  const target = useMemo(() => getWord(question.targetWordId), [question.targetWordId]);
  const leftWord = useMemo(() => getWord(question.leftChoice.wordId), [question.leftChoice.wordId]);
  const rightWord = useMemo(
    () => getWord(question.rightChoice.wordId),
    [question.rightChoice.wordId]
  );

  const applySelection = useCallback(
    (side: RhymeSide, isCorrect: boolean) => {
      if (isCorrectPick || finished) {
        return;
      }

      setSelectedSide(side);
      if (isCorrect) {
        setIsShake(false);
        setIsCorrectPick(true);
        playWordSound(side === 'left' ? leftWord.id : rightWord.id);
      } else {
        setIsShake(true);
        setIsCorrectPick(false);
      }
    },
    [finished, isCorrectPick, leftWord.id, rightWord.id]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat || isCorrectPick || finished) {
        return;
      }

      const result = resolveRhymeInput({
        key: event.key,
        code: event.code,
        leftWord: leftWord.word,
        rightWord: rightWord.word,
        question,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
      });

      if (!result.selectedSide) {
        return;
      }

      applySelection(result.selectedSide, result.isCorrect);
    },
    [applySelection, finished, isCorrectPick, leftWord.word, question, rightWord.word]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  useEffect(() => {
    playWordSound(target.id);
  }, [target.id]);

  useEffect(() => {
    if (!isShake) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setIsShake(false);
    }, SHAKE_MS);
    return () => clearTimeout(timer);
  }, [isShake]);

  useEffect(() => {
    if (!isCorrectPick) {
      return undefined;
    }

    const timer = setTimeout(() => {
      const isLastQuestion = questionIndex === currentLevel.questions.length - 1;
      const isLastLevel = levelIndex === RHYME_LEVELS.length - 1;

      setSelectedSide(null);
      setIsCorrectPick(false);
      setIsShake(false);

      if (isLastQuestion) {
        setCompletedLevelNumber(currentLevel.levelNumber);
        setShowLevelToast(true);
        if (isLastLevel) {
          setFinished(true);
        } else {
          setLevelIndex((prev) => prev + 1);
          setQuestionIndex(0);
        }
      } else {
        setQuestionIndex((prev) => prev + 1);
      }
    }, ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [
    currentLevel.levelNumber,
    currentLevel.questions.length,
    isCorrectPick,
    levelIndex,
    questionIndex,
  ]);

  useEffect(() => {
    if (!showLevelToast) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setShowLevelToast(false);
    }, TOAST_MS);
    return () => clearTimeout(timer);
  }, [showLevelToast]);

  const handleRestart = () => {
    setLevelIndex(0);
    setQuestionIndex(0);
    setSelectedSide(null);
    setIsShake(false);
    setIsCorrectPick(false);
    setShowLevelToast(false);
    setCompletedLevelNumber(null);
    setFinished(false);
  };

  const leftWrong = selectedSide === 'left' && isShake;
  const rightWrong = selectedSide === 'right' && isShake;
  const leftCorrect = selectedSide === 'left' && isCorrectPick;
  const rightCorrect = selectedSide === 'right' && isCorrectPick;

  return (
    <div className={classes.gameContainer}>
      <div
        className={classes.heroCard}
        role="region"
        aria-label={`What rhymes with ${target.promptLabel}?`}
        style={{ borderColor: target.accentColor }}
      >
        <div className={classes.heroEmoji} aria-hidden="true">
          {target.promptImage || '✨'}
        </div>
        <div className={classes.heroTextGroup}>
          <h2 className={classes.heroLabel}>What rhymes with {target.word}?</h2>
          <button
            type="button"
            className={classes.audioReplayBtn}
            aria-label="Replay sound"
            onClick={() => playWordSound(target.id)}
          >
            🔊
          </button>
        </div>
      </div>

      <div className={classes.choicesContainer}>
        <button
          type="button"
          className={classes.choiceCard}
          data-testid="rhyme-choice-left"
          data-correct={leftCorrect ? 'true' : undefined}
          data-wrong={leftWrong ? 'true' : undefined}
          aria-label={`Choose ${leftWord.promptLabel}`}
          onClick={() => applySelection('left', question.leftChoice.isRhyme)}
          style={{ borderColor: leftCorrect ? undefined : leftWord.accentColor }}
        >
          <div className={classes.choiceEmoji} aria-hidden="true">
            {leftWord.promptImage || '✨'}
          </div>
          <div className={classes.choiceLabel}>{renderHighlightedLabel(leftWord.word)}</div>
          <span className={classes.keyBadge}>[ ← or {leftWord.word[0]} ]</span>
        </button>

        <button
          type="button"
          className={classes.choiceCard}
          data-testid="rhyme-choice-right"
          data-correct={rightCorrect ? 'true' : undefined}
          data-wrong={rightWrong ? 'true' : undefined}
          aria-label={`Choose ${rightWord.promptLabel}`}
          onClick={() => applySelection('right', question.rightChoice.isRhyme)}
          style={{ borderColor: rightCorrect ? undefined : rightWord.accentColor }}
        >
          <div className={classes.choiceEmoji} aria-hidden="true">
            {rightWord.promptImage || '✨'}
          </div>
          <div className={classes.choiceLabel}>{renderHighlightedLabel(rightWord.word)}</div>
          <span className={classes.keyBadge}>[ → or {rightWord.word[0]} ]</span>
        </button>
      </div>

      <p className={classes.levelLabel}>Level {currentLevel.levelNumber}</p>

      {finished && (
        <button type="button" className={classes.restartBtn} onClick={handleRestart}>
          Play again
        </button>
      )}

      {showLevelToast && (
        <div className={classes.fireworksToast} role="status" aria-live="polite">
          <span className={classes.fireworkSpark} aria-hidden="true">
            ✨
          </span>
          <span className={classes.toastTitle}>Level {completedLevelNumber} complete!</span>
          <span className={classes.fireworkSpark} aria-hidden="true">
            🎆
          </span>
        </div>
      )}
    </div>
  );
}
