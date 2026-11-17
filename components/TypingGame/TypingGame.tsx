'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { COUNT_DIFFICULTIES } from '../../constants/count-difficulties';
import { QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';
import { getPhonemeSlug } from '../../constants/phonemes';
import { usePlayAudio } from '../../lib/audio/clips';
import { useProfile } from '../../lib/play/profile-context';
import { defaultPhonemeSlugForLetter } from '../../lib/play/studio-queue';
import { useChildInput } from '../../lib/play/use-child-input';
import type {
  CountDifficulty,
  DifficultyLevel,
  GameMode,
  LearningWord,
} from '../../types/learning-word.types';
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
const WORD_COMPLETE_MAX_MS = 6000;
// Quiet gap after the finished word, so it doesn't run into the next one.
const PAUSE_AFTER_WORD_MS = 900;
const LEVEL_TOAST_DURATION_MS = 1200;
// Pause between the last letter's sound and the whole word.
const WORD_SOUND_DELAY_MS = 500;
const COUNT_HINT_DELAY_MS = 14000;
const COUNT_OBJECT_AUDIO_DELAY_MS = 600;
const LETTER_SOUND_GAP_MS = 120;

const ignoreBackspace = () => {};

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
  const [typing, setTyping] = useState(false);
  const interactiveRef = useRef<HTMLElement>(null);
  // Resolves when the "well done" audio for the finished word has played.
  const completionAudioRef = useRef<Promise<void>>(Promise.resolve());

  const { words: effectiveWords } = useProfile();
  const audio = usePlayAudio();
  const currentWord = effectiveWords[wordIndex % effectiveWords.length];
  const levelNumber = Math.floor(wordIndex / LEVEL_SIZE) + 1;
  const isQuiz = mode === 'quiz';
  const isCount = mode === 'count';
  const isRhyme = mode === 'rhyme';
  const quizLocked = completedCount < QUIZ_UNLOCK_THRESHOLD;

  const playCountAudio = useCallback(
    (count: number, word: LearningWord) => {
      const objectStep = count === 1 ? word : `plural_${word.id}`;
      audio.playSequence([`number_${count}`, objectStep], COUNT_OBJECT_AUDIO_DELAY_MS);
    },
    [audio]
  );

  const playLetterSound = useCallback(
    (word: LearningWord, index: number) => {
      const steps: string[] = [];
      const letter = (word.word[index] ?? '').toLowerCase();
      // Family names have no phonics data, so fall back to the letter's usual sound.
      const phonemeSlug =
        getPhonemeSlug(word.ipa[index] ?? '') || defaultPhonemeSlugForLetter(letter);
      if (phonemeSlug) {
        steps.push(`phoneme_${phonemeSlug}`);
      }
      if (/^[a-z]$/.test(letter)) {
        steps.push(`letter_${letter}`);
      }
      return audio.playSequence(steps, LETTER_SOUND_GAP_MS);
    },
    [audio]
  );

  const handleNextWord = useCallback(() => {
    setWordIndex((prev) => (prev + 1) % effectiveWords.length);
    setNextIndex(0);
    setNumberNextIndex(0);
    setHintRevealed(false);
    setNumberCompleted(false);
    setIsCompleted(false);
    setFeedback('none');
    setCompletedCount((prev) => prev + 1);
    setTargetCount((prev) => pickNewCount(countDifficulty, prev));
  }, [countDifficulty, effectiveWords.length]);

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

  // One handler for every input path: physical keys, the native keyboard and the on-screen keypad.
  const handleCharacter = useCallback(
    (rawKey: string) => {
      if (isCompleted || isRhyme) {
        return;
      }

      if (isQuiz) {
        const key = rawKey.toUpperCase();
        if (!/^[A-Z]$/.test(key)) {
          return;
        }
        if (key === currentWord.word[0]) {
          completionAudioRef.current = audio.playWord(currentWord);
          setIsCompleted(true);
          setFeedback('celebrate');
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
            key: rawKey,
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
            key: rawKey,
          });

          if (result.kind === 'advanced') {
            setNextIndex(result.nextIndex);
            setFeedback('none');
            playLetterSound(currentWord, nextIndex);

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
        key: rawKey,
      });

      if (result.kind === 'advanced') {
        setNextIndex(result.nextIndex);
        setFeedback('none');
        // The phonic sound, then the letter name (e.g. "kuh" then "kay").
        const letterSound = playLetterSound(currentWord, nextIndex);

        if (result.completed) {
          // Once the last letter has finished, a short pause, then the whole word.
          completionAudioRef.current = letterSound
            .then(() => new Promise<void>((resolve) => setTimeout(resolve, WORD_SOUND_DELAY_MS)))
            .then(() => audio.playWord(currentWord))
            .catch(() => undefined);
          setIsCompleted(true);
          setFeedback('celebrate');
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
      audio,
      countDifficulty,
      currentWord,
      isCompleted,
      isCount,
      isQuiz,
      isRhyme,
      nextIndex,
      numberCompleted,
      numberNextIndex,
      playCountAudio,
      playLetterSound,
      targetCount,
      wordIndex,
    ]
  );

  const childInput = useChildInput({
    onChar: handleCharacter,
    onBackspace: ignoreBackspace,
    numeric: isCount && !numberCompleted,
  });

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      // Keys typed into the hidden child input arrive through its onChar, so skip them here.
      if (event.target instanceof HTMLInputElement) {
        return;
      }
      handleCharacter(event.key);
    },
    [handleCharacter]
  );

  useEffect(() => {
    if (typing) {
      interactiveRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
    }
  }, [typing]);

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
      audio.playWord(currentWord);
    }
  }, [audio, currentWord, mode, playCountAudio, targetCount]);

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
    // Move on once the whole word has been heard (never sooner than WORD_COMPLETE_MS,
    // never later than WORD_COMPLETE_MAX_MS if audio stalls).
    let cancelled = false;
    const minDelay = new Promise<void>((resolve) => setTimeout(resolve, WORD_COMPLETE_MS));
    const maxDelay = new Promise<void>((resolve) => setTimeout(resolve, WORD_COMPLETE_MAX_MS));
    const afterWord = completionAudioRef.current.then(
      () => new Promise<void>((resolve) => setTimeout(resolve, PAUSE_AFTER_WORD_MS))
    );
    Promise.race([Promise.all([minDelay, afterWord]), maxDelay]).then(() => {
      if (!cancelled) handleNextWord();
    });
    return () => {
      cancelled = true;
    };
  }, [isCompleted, handleNextWord]);

  const countLayout: 'row' | 'tens' | 'grid' =
    countDifficulty === 'hard' ? 'grid' : countDifficulty === 'medium' ? 'tens' : 'row';

  return (
    <main className={typing ? `${classes.gameWrapper} ${classes.typing}` : classes.gameWrapper}>
      {isRhyme ? (
        <RhymeGame />
      ) : (
        <>
          <section
            ref={interactiveRef}
            className={classes.interactiveArea}
            data-feedback={feedback}
            data-testid="game-area"
          >
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
            <div
              className={classes.childInput}
              role="group"
              aria-label="Your answer"
              onFocus={() => setTyping(true)}
              onBlur={() => setTyping(false)}
            >
              {childInput.inputElement}
            </div>
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
