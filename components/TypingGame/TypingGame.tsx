'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LEARNING_WORDS, QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';
import { getPhonemeSlug } from '../../constants/phonemes';
import { DifficultyLevel, GameMode } from '../../types/learning-word.types';
import { getProgressionResult } from '../../utils/progression';
import { getPhonemeAudioPath, getWordAudioPath, playAudio } from '../../utils/audio';
import { GameControls } from '../GameControls/GameControls';
import { PromptCard } from '../PromptCard/PromptCard';
import { QuizPrompt } from '../QuizPrompt/QuizPrompt';
import { WordTiles } from '../WordTiles/WordTiles';
import classes from './TypingGame.module.css';

const LEVEL_SIZE = 6;
const FEEDBACK_DURATION_MS = 350;
const WORD_COMPLETE_MS = 1500;
const LEVEL_COMPLETE_MS = 3200;

export function TypingGame() {
  const [wordIndex, setWordIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('reveal');
  const [mode, setMode] = useState<GameMode>('words');
  const [completedCount, setCompletedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showLevelComplete, setShowLevelComplete] = useState(false);
  const [feedback, setFeedback] = useState<'none' | 'shake' | 'celebrate'>('none');

  const currentWord = LEARNING_WORDS[wordIndex % LEARNING_WORDS.length];
  const levelNumber = Math.floor(wordIndex / LEVEL_SIZE) + 1;
  const isQuiz = mode === 'quiz';
  const quizLocked = completedCount < QUIZ_UNLOCK_THRESHOLD;

  const handleNextWord = useCallback(() => {
    setWordIndex((prev) => (prev + 1) % LEARNING_WORDS.length);
    setNextIndex(0);
    setIsCompleted(false);
    setShowLevelComplete(false);
    setFeedback('none');
    setCompletedCount((prev) => prev + 1);
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isCompleted || event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
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
        }
        if (result.completed) {
          setIsCompleted(true);
          setFeedback('celebrate');
          playAudio(getWordAudioPath(currentWord.id));
          if ((wordIndex + 1) % LEVEL_SIZE === 0) {
            setShowLevelComplete(true);
          }
        }
      } else if (result.kind === 'incorrect') {
        setFeedback('shake');
      }
    },
    [currentWord.word, currentWord.id, currentWord.ipa, isCompleted, isQuiz, nextIndex, wordIndex]
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
    playAudio(getWordAudioPath(currentWord.id));
  }, [currentWord.id]);

  useEffect(() => {
    if (!isCompleted) {
      return undefined;
    }
    const delay = showLevelComplete ? LEVEL_COMPLETE_MS : WORD_COMPLETE_MS;
    const timer = setTimeout(handleNextWord, delay);
    return () => clearTimeout(timer);
  }, [isCompleted, handleNextWord, showLevelComplete]);

  return (
    <main className={classes.gameWrapper}>
      <section className={classes.interactiveArea} data-feedback={feedback}>
        {isQuiz ? (
          <QuizPrompt word={currentWord} isCorrect={isCompleted} />
        ) : (
          <>
            <PromptCard word={currentWord} />
            <WordTiles word={currentWord.word} nextIndex={nextIndex} difficulty={difficulty} />
          </>
        )}
      </section>

      {!isQuiz && <p className={classes.levelLabel}>Level {levelNumber}</p>}

      <GameControls
        difficulty={difficulty}
        onDifficultyChange={setDifficulty}
        onNewWord={handleNextWord}
        mode={mode}
        onModeChange={setMode}
        quizLocked={quizLocked}
      />

      {showLevelComplete && (
        <div className={classes.levelCompleteOverlay} role="status">
          <div className={classes.levelCompleteCard}>
            <div className={classes.celebrateEmoji} aria-hidden="true">
              🎆 🎉 👏
            </div>
            <h2 className={classes.levelCompleteTitle}>Level {levelNumber} complete!</h2>
            <p className={classes.levelCompleteMessage}>Well done! High five! 🙌</p>
          </div>
        </div>
      )}
    </main>
  );
}
