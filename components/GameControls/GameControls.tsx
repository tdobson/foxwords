import React from 'react';
import { Button, SegmentedControl, Text } from '@mantine/core';
import { DIFFICULTY_LEVELS } from '../../constants/difficulty-levels';
import { COUNT_DIFFICULTIES } from '../../constants/count-difficulties';
import { QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';
import { CountDifficulty, DifficultyLevel, GameMode } from '../../types/learning-word.types';
import classes from './GameControls.module.css';

export interface GameControlsProps {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  countDifficulty: CountDifficulty;
  onCountDifficultyChange: (difficulty: CountDifficulty) => void;
  onNewWord: () => void;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  quizLocked: boolean;
}

export function GameControls({
  difficulty,
  onDifficultyChange,
  countDifficulty,
  onCountDifficultyChange,
  onNewWord,
  mode,
  onModeChange,
  quizLocked,
}: GameControlsProps) {
  const isCount = mode === 'count';

  const wordDifficultyData = Object.values(DIFFICULTY_LEVELS).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const countDifficultyData = Object.values(COUNT_DIFFICULTIES).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <div className={classes.controlsContainer}>
      <div className={classes.controlsRow}>
        <Text size="sm" fw={600} c="dimmed">
          {isCount ? 'Count Level:' : 'Difficulty:'}
        </Text>
        {isCount ? (
          <SegmentedControl
            value={countDifficulty}
            onChange={(val) => onCountDifficultyChange(val as CountDifficulty)}
            data={countDifficultyData}
            size="md"
            radius="md"
            className={classes.segmentedControl}
            aria-label="Select count difficulty"
          />
        ) : (
          <SegmentedControl
            value={difficulty}
            onChange={(val) => onDifficultyChange(val as DifficultyLevel)}
            data={wordDifficultyData}
            size="md"
            radius="md"
            className={classes.segmentedControl}
            aria-label="Select difficulty mode"
          />
        )}
        <Button
          onClick={onNewWord}
          size="md"
          radius="md"
          color="orange"
          className={classes.newWordButton}
        >
          New word
        </Button>
        <Button
          onClick={() => onModeChange(mode === 'count' ? 'words' : 'count')}
          size="md"
          radius="md"
          variant={mode === 'count' ? 'filled' : 'outline'}
          color="teal"
          title="Switch to counting minigame"
        >
          {mode === 'count' ? 'Back to words' : 'Count'}
        </Button>
        <Button
          onClick={() => onModeChange(mode === 'quiz' ? 'words' : 'quiz')}
          size="md"
          radius="md"
          variant={mode === 'quiz' ? 'filled' : 'outline'}
          disabled={quizLocked}
          title={
            quizLocked
              ? `Keep practising — quiz unlocks after ${QUIZ_UNLOCK_THRESHOLD} words`
              : 'Switch to first-letter quiz'
          }
        >
          {mode === 'quiz' ? 'Back to words' : 'Quiz'}
        </Button>
        <Button
          onClick={() => onModeChange(mode === 'rhyme' ? 'words' : 'rhyme')}
          size="md"
          radius="md"
          variant={mode === 'rhyme' ? 'filled' : 'outline'}
          color="violet"
          title="Switch to Rhyme Time minigame"
        >
          {mode === 'rhyme' ? 'Back to words' : 'Rhyme'}
        </Button>
      </div>
    </div>
  );
}
