import React from 'react';
import { Button, SegmentedControl, Text } from '@mantine/core';
import { DIFFICULTY_LEVELS } from '../../constants/difficulty-levels';
import { DifficultyLevel } from '../../types/learning-word.types';
import classes from './GameControls.module.css';

export interface GameControlsProps {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  onNewWord: () => void;
}

export function GameControls({ difficulty, onDifficultyChange, onNewWord }: GameControlsProps) {
  const data = Object.values(DIFFICULTY_LEVELS).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <div className={classes.controlsContainer}>
      <div className={classes.controlsRow}>
        <Text size="sm" fw={600} c="dimmed">
          Difficulty:
        </Text>
        <SegmentedControl
          value={difficulty}
          onChange={(val) => onDifficultyChange(val as DifficultyLevel)}
          data={data}
          size="md"
          radius="md"
          className={classes.segmentedControl}
          aria-label="Select difficulty mode"
        />
        <Button
          onClick={onNewWord}
          size="md"
          radius="md"
          color="orange"
          className={classes.newWordButton}
        >
          New word
        </Button>
      </div>
    </div>
  );
}
