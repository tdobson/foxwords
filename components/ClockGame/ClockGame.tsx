'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { CLOCK_CURRICULUM } from '../../constants/clock-curriculum';
import { ClockDifficulty, ClockProgressionState, ClockTargetTime } from '../../types/clock.types';
import { playClockAudio } from '../../utils/clock-audio';
import { getClockProgressionResult } from '../../utils/clock-progression';
import { ClockFace } from './ClockFace';
import classes from './ClockGame.module.css';

const HINT_DELAY_MS = 30000;
const CELEBRATE_ADVANCE_MS = 1200;
const SHAKE_RESET_MS = 400;

interface ClockGameProps {
  initialDifficulty?: ClockDifficulty;
  onTargetComplete?: (target: ClockTargetTime) => void;
}

export function ClockGame({ initialDifficulty = 'easy', onTargetComplete }: ClockGameProps) {
  const [difficulty, setDifficulty] = useState<ClockDifficulty>(initialDifficulty);
  const [targetIndex, setTargetIndex] = useState(0);
  const [progressionState, setProgressionState] = useState<ClockProgressionState>({
    tokenIndex: 0,
    enteredKeyBuffer: '',
  });
  const [revealedText, setRevealedText] = useState<string>('');
  const [showHint, setShowHint] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'none' | 'shake' | 'celebrate'>('none');
  const [isAdvancing, setIsAdvancing] = useState<boolean>(false);

  const curriculumPool = CLOCK_CURRICULUM[difficulty];
  const currentTarget: ClockTargetTime =
    curriculumPool[targetIndex % curriculumPool.length] || curriculumPool[0];

  // Helper to pick next target (shuffles or advances)
  const nextTarget = useCallback(() => {
    setShowHint(false);
    setProgressionState({ tokenIndex: 0, enteredKeyBuffer: '' });
    setRevealedText('');
    setFeedback('none');
    setIsAdvancing(false);
    setTargetIndex((prev) => (prev + 1) % curriculumPool.length);
  }, [curriculumPool.length]);

  // Handle difficulty switch
  const handleDifficultyChange = (newDiff: ClockDifficulty) => {
    if (newDiff === difficulty) {
      return;
    }
    setDifficulty(newDiff);
    setTargetIndex(0);
    setShowHint(false);
    setProgressionState({ tokenIndex: 0, enteredKeyBuffer: '' });
    setRevealedText('');
    setFeedback('none');
    setIsAdvancing(false);
  };

  // Play audio on current target change & reset 30s hint timer
  useEffect(() => {
    setShowHint(false);
    playClockAudio(currentTarget);

    const timer = setTimeout(() => {
      setShowHint(true);
    }, HINT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [currentTarget]);

  // Repeat audio button handler
  const handleRepeatAudio = () => {
    playClockAudio(currentTarget);
  };

  // Process key input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isAdvancing) {
        return;
      }

      const result = getClockProgressionResult(currentTarget, progressionState, e.key);

      if (result.kind === 'ignored') {
        return;
      }

      if (result.kind === 'incorrect') {
        setFeedback('shake');
        setTimeout(() => {
          setFeedback('none');
        }, SHAKE_RESET_MS);
        return;
      }

      // result.kind === 'advanced'
      setProgressionState(result.state);
      setRevealedText(result.revealedText);

      if (result.completed) {
        setIsAdvancing(true);
        setFeedback('celebrate');
        onTargetComplete?.(currentTarget);

        setTimeout(() => {
          nextTarget();
        }, CELEBRATE_ADVANCE_MS);
      }
    },
    [currentTarget, progressionState, isAdvancing, nextTarget, onTargetComplete]
  );

  // Global keyboard listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const difficultyLevels: { key: ClockDifficulty; label: string }[] = [
    { key: 'easy', label: 'Easy' },
    { key: 'medium', label: 'Medium' },
    { key: 'hard', label: 'Hard' },
    { key: 'ultra', label: 'Ultra' },
  ];

  return (
    <div className={classes.gameContainer}>
      {/* Top Bar: Difficulty Selector & Action Buttons */}
      <div className={classes.topBar}>
        <div className={classes.difficultyGroup} role="radiogroup" aria-label="Difficulty Level">
          {difficultyLevels.map((lvl) => (
            <button
              key={lvl.key}
              type="button"
              className={`${classes.diffButton} ${difficulty === lvl.key ? classes.diffButtonActive : ''}`}
              onClick={() => handleDifficultyChange(lvl.key)}
              aria-checked={difficulty === lvl.key}
              role="radio"
            >
              {lvl.label}
            </button>
          ))}
        </div>

        <div className={classes.controlActions}>
          <button
            type="button"
            className={classes.actionButton}
            onClick={handleRepeatAudio}
            aria-label="Repeat time audio"
          >
            🔊 Listen
          </button>
          <button
            type="button"
            className={classes.actionButton}
            onClick={nextTarget}
            aria-label="Skip to new clock"
          >
            ⏭ Skip
          </button>
        </div>
      </div>

      {/* Main Clock Face Stage */}
      <div
        className={`${classes.clockStage} ${
          feedback === 'shake' ? classes.shake : feedback === 'celebrate' ? classes.celebrate : ''
        }`}
        data-testid="clock-stage"
      >
        <ClockFace
          hour={currentTarget.hour}
          minute={currentTarget.minute}
          spokenPhrase={currentTarget.spokenPhrase}
        />
      </div>

      {/* Interactive Prompt Line */}
      <div className={classes.promptArea}>
        {revealedText ? (
          <div className={classes.revealedText} data-testid="revealed-text">
            {revealedText}
          </div>
        ) : (
          <div className={classes.blankPrompt} data-testid="blank-prompt">
            Type the time...
          </div>
        )}

        {/* 30-Second Ghost Hint */}
        {showHint && (
          <div className={classes.ghostPrompt} data-testid="ghost-hint">
            Hint: &quot;{currentTarget.spokenPhrase}&quot;
          </div>
        )}
      </div>

      {/* Helpful Key Helper / Short Guidance */}
      <div className={classes.keyboardGuide} data-testid="keyboard-guide">
        {difficulty === 'easy' && (
          <span>
            Type the hour number (e.g. <span className={classes.keyBadge}>1</span> to{' '}
            <span className={classes.keyBadge}>12</span>)
          </span>
        )}
        {difficulty === 'medium' && (
          <span>
            Type shortcuts: <span className={classes.keyBadge}>Q</span> (Quarter),{' '}
            <span className={classes.keyBadge}>H</span> (Half),{' '}
            <span className={classes.keyBadge}>P</span> (past),{' '}
            <span className={classes.keyBadge}>T</span> (to), then the hour number
          </span>
        )}
        {(difficulty === 'hard' || difficulty === 'ultra') && (
          <span>
            Type the minutes, then <span className={classes.keyBadge}>P</span> /{' '}
            <span className={classes.keyBadge}>T</span>, then the hour number
          </span>
        )}
      </div>
    </div>
  );
}
