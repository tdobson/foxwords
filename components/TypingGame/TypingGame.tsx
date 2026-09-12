'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { COUNT_DIFFICULTIES } from '../../constants/count-difficulties';
import { getCountNumberSlug } from '../../constants/count-numbers';
import { LEARNING_WORDS, QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';
import { getPhonemeSlug } from '../../constants/phonemes';
import type {
  CountDifficulty,
  DifficultyLevel,
  GameMode,
  LearningWord,
} from '../../types/learning-word.types';
import {
  getLetterNameAudioPath,
  getNumberAudioPath,
  getPhonemeAudioPath,
  getPluralAudioPath,
  getWordAudioPath,
  playAudio,
} from '../../utils/audio';
import { getCountProgressionResult } from '../../utils/count-progression';
import { getProgressionResult } from '../../utils/progression';
import { CountPrompt } from '../CountPrompt/CountPrompt';
import { GameControls } from '../GameControls/GameControls';
import { PromptCard } from '../PromptCard/PromptCard';
import { QuizPrompt } from '../QuizPrompt/QuizPrompt';
import { RhymeGame } from '../RhymeGame/RhymeGame';
import { WordTiles } from '../WordTiles/WordTiles';
import classes from './TypingGame.module.css';

const LEVEL_SIZE = 6;
const FEEDBACK_DURATION_MS = 350;
const WORD_COMPLETE_MS = 1500;
const LEVEL_TOAST_DURATION_MS = 1200;
const WORD_SOUND_DELAY_MS = 700;
const COUNT_HINT_DELAY_MS = 14000;
const COUNT_OBJECT_AUDIO_DELAY_MS = 600;

function pickNewCount(diff: CountDifficulty, prevCount?: number): number {
  const { minCount, maxCount } = COUNT_DIFFICULTIES[diff];
  const range = maxCount - minCount + 1;
  if (range <= 1) {
    return minCount;
  }
  let picked = minCount + Math.floor(Math.random() * range);
  while (picked === prevCount) {
    picked = minCount + Math.floor(Math.random() * range);
  }
  return picked;
}

export interface TypingGameProps {
  initialMode?: GameMode;
}

export function TypingGame({ initialMode = 'words' }: TypingGameProps = {}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('reveal');
  const [mode, setMode] = useState<GameMode>(initialMode);
  const [countDifficulty, setCountDifficulty] = useState<CountDifficulty>('easy');
  const [targetCount, setTargetCount] = useState(() => pickNewCount('easy'));
  const [numberNextIndex, setNumberNextIndex] = useState(0);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [numberCompleted, setNumberCompleted] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLevelToast, setShowLevelToast] = useState(false);
  const [completedLevelNumber, setCompletedLevelNumber] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<'none' | 'shake' | 'celebrate'>('none');

  const currentWord = LEARNING_WORDS[wordIndex % LEARNING_WORDS.length];
  const levelNumber = Math.floor(wordIndex / LEVEL_SIZE) + 1;
  const isQuiz = mode === 'quiz';
  const isCount = mode === 'count';
  const isRhyme = mode === 'rhyme';
  const quizLocked = completedCount < QUIZ_UNLOCK_THRESHOLD;

  const playCountAudio = useCallback((count: number, word: LearningWord) => {
    const slug = getCountNumberSlug(count);
    if (slug) {
      playAudio(getNumberAudioPath(slug));
    }
    setTimeout(() => {
      if (count === 1) {
        playAudio(getWordAudioPath(word.id));
      } else {
        playAudio(getPluralAudioPath(word.id));
      }
    }, COUNT_OBJECT_AUDIO_DELAY_MS);
  }, []);

  const handleNextWord = useCallback(() => {
    setWordIndex((prev) => (prev + 1) % LEARNING_WORDS.length);
    setNextIndex(0);
    setNumberNextIndex(0);
    setHintRevealed(false);
    setNumberCompleted(false);
    setIsCompleted(false);
    setFeedback('none');
    setCompletedCount((prev) => prev + 1);
    setTargetCount((prev) => pickNewCount(countDifficulty, prev));
  }, [countDifficulty]);

  const handleCountDifficultyChange = useCallback((newDiff: CountDifficulty) => {
    setCountDifficulty(newDiff);
    setNumberNextIndex(0);
    setNextIndex(0);
    setHintRevealed(false);
    setNumberCompleted(false);
    setIsCompleted(false);
    setFeedback('none');
    setTargetCount((prev) => pickNewCount(newDiff, prev));
  }, []);

  const handleModeChange = useCallback(
    (newMode: GameMode) => {
      setMode(newMode);
      setNextIndex(0);
      setNumberNextIndex(0);
      setHintRevealed(false);
      setNumberCompleted(false);
      setIsCompleted(false);
      setFeedback('none');
      if (newMode === 'count') {
        setTargetCount((prev) => pickNewCount(countDifficulty, prev));
      }
    },
    [countDifficulty]
  );

  // Hint timer for count mode (14s)
  useEffect(() => {
    if (mode !== 'count' || numberCompleted || isCompleted) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setHintRevealed(true);
    }, COUNT_HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mode, numberCompleted, isCompleted, targetCount]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isCompleted || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (isRhyme) {
        return;
      }

      if (isQuiz) {
        const key = event.key.toUpperCase();
        if (!/^[A-Z]$/.test(key)) {
          return;
        }
        if (key === currentWord.word[0]) {
          setIsCompleted(true);
          setFeedback('celebrate');
          playAudio(getWordAudioPath(currentWord.id));
        } else {
          setFeedback('shake');
        }
        return;
      }

      if (isCount) {
        if (!numberCompleted) {
          const result = getCountProgressionResult({
            targetNumber: targetCount,
            nextIndex: numberNextIndex,
            key: event.key,
          });

          if (result.kind === 'advanced') {
            setNumberNextIndex(result.nextIndex);
            setFeedback('none');

            if (result.completed) {
              setNumberCompleted(true);
              if (countDifficulty !== 'hard') {
                setIsCompleted(true);
                setFeedback('celebrate');
                playCountAudio(targetCount, currentWord);
                if ((wordIndex + 1) % LEVEL_SIZE === 0) {
                  setCompletedLevelNumber(levelNumber);
                  setShowLevelToast(true);
                }
              }
            }
          } else if (result.kind === 'incorrect') {
            setFeedback('shake');
          }
          return;
        }

        // Hard mode word spelling phase after number is completed
        if (countDifficulty === 'hard') {
          const result = getProgressionResult({
            word: currentWord.word,
            nextIndex,
            key: event.key,
          });

          if (result.kind === 'advanced') {
            setNextIndex(result.nextIndex);
            setFeedback('none');

            const phonemeSlug = getPhonemeSlug(currentWord.ipa[nextIndex] ?? '');
            if (phonemeSlug) {
              playAudio(getPhonemeAudioPath(phonemeSlug));
              playAudio(getLetterNameAudioPath(phonemeSlug));
            }

            if (result.completed) {
              setIsCompleted(true);
              setFeedback('celebrate');
              playCountAudio(targetCount, currentWord);
              if ((wordIndex + 1) % LEVEL_SIZE === 0) {
                setCompletedLevelNumber(levelNumber);
                setShowLevelToast(true);
              }
            }
          } else if (result.kind === 'incorrect') {
            setFeedback('shake');
          }
        }
        return;
      }

      const result = getProgressionResult({
        word: currentWord.word,
        nextIndex,
        key: event.key,
      });

      if (result.kind === 'advanced') {
        setNextIndex(result.nextIndex);
        setFeedback('none');

        // Play the phonic sound, then the letter name (e.g. "kuh" then "kay").
        const phonemeSlug = getPhonemeSlug(currentWord.ipa[nextIndex] ?? '');
        if (phonemeSlug) {
          playAudio(getPhonemeAudioPath(phonemeSlug));
          playAudio(getLetterNameAudioPath(phonemeSlug));
        }

        if (result.completed) {
          setIsCompleted(true);
          setFeedback('celebrate');
          // A short pause after the last letter, then the whole word.
          setTimeout(() => {
            playAudio(getWordAudioPath(currentWord.id));
          }, WORD_SOUND_DELAY_MS);
          if ((wordIndex + 1) % LEVEL_SIZE === 0) {
            setCompletedLevelNumber(levelNumber);
            setShowLevelToast(true);
          }
        }
      } else if (result.kind === 'incorrect') {
        setFeedback('shake');
      }
    },
    [
      countDifficulty,
      currentWord,
      isCompleted,
      isCount,
      isQuiz,
      nextIndex,
      numberCompleted,
      numberNextIndex,
      playCountAudio,
      targetCount,
      wordIndex,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

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
    if (mode === 'rhyme') {
      return;
    }
    if (mode === 'count') {
      playCountAudio(targetCount, currentWord);
    } else {
      playAudio(getWordAudioPath(currentWord.id));
    }
  }, [currentWord, mode, playCountAudio, targetCount]);

  useEffect(() => {
    if (!showLevelToast) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setShowLevelToast(false);
    }, LEVEL_TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [showLevelToast]);

  useEffect(() => {
    if (!isCompleted) {
      return undefined;
    }
    const timer = setTimeout(handleNextWord, WORD_COMPLETE_MS);
    return () => clearTimeout(timer);
  }, [isCompleted, handleNextWord]);

  const countLayout: 'row' | 'tens' | 'grid' =
    countDifficulty === 'hard' ? 'grid' : countDifficulty === 'medium' ? 'tens' : 'row';

  return (
    <main className={classes.gameWrapper}>
      {isRhyme ? (
        <RhymeGame />
      ) : (
        <>
          <section className={classes.interactiveArea} data-feedback={feedback}>
            {isQuiz ? (
              <QuizPrompt word={currentWord} isCorrect={isCompleted} />
            ) : isCount ? (
              <>
                <CountPrompt
                  word={currentWord}
                  count={targetCount}
                  layout={countLayout}
                  numberNextIndex={numberNextIndex}
                  hintRevealed={hintRevealed}
                  isCorrect={numberCompleted}
                />
                {countDifficulty === 'hard' && numberCompleted && (
                  <WordTiles word={currentWord.word} nextIndex={nextIndex} difficulty="reveal" />
                )}
              </>
            ) : (
              <>
                <PromptCard word={currentWord} />
                <WordTiles word={currentWord.word} nextIndex={nextIndex} difficulty={difficulty} />
              </>
            )}
          </section>

          {!isQuiz && <p className={classes.levelLabel}>Level {levelNumber}</p>}
        </>
      )}

      <GameControls
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        countDifficulty={countDifficulty}
        onCountDifficultyChange={handleCountDifficultyChange}
        onNewWord={handleNextWord}
        mode={mode}
        onModeChange={handleModeChange}
        quizLocked={quizLocked}
      />

      {showLevelToast && (
        <div className={classes.levelToast} role="status" aria-live="polite">
          <span className={classes.fireworkSpark} aria-hidden="true">
            🎆
          </span>
          <span className={classes.toastTitle}>Level {completedLevelNumber} complete!</span>
          <span className={classes.fireworkSpark} aria-hidden="true">
            ✨
          </span>
        </div>
      )}
    </main>
  );
}
