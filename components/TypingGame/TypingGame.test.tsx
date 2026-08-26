import React from 'react';
import { act, fireEvent, render, screen, userEvent } from '@/test-utils';
import { TypingGame } from './TypingGame';
import { QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';

const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDDAD', 'MUMMY', 'DADDY', 'SARAH'];
const unlockWords = [...firstLevelWords, 'BABY', 'GRANDPA', 'GRANNY', 'MEG'];

describe('TypingGame', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const completeWords = (words: string[], advanceMs: number[] = []) => {
    for (let i = 0; i < words.length; i += 1) {
      for (const key of words[i]) {
        fireEvent.keyDown(window, { key });
      }
      act(() => {
        jest.advanceTimersByTime(advanceMs[i] ?? 1600);
      });
    }
  };

  it('renders initial game state with JAMES prompt and reveal as default difficulty', () => {
    render(<TypingGame />);
    expect(screen.getByRole('region', { name: /prompt for james/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');
    expect(screen.getByText(/^Level 1$/)).toBeInTheDocument();
  });

  it('fills the next letter when the matching physical key is pressed', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'active');
  });

  it('does not reveal the next letter until the previous one completes', () => {
    render(<TypingGame />);
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');
    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'hidden');
  });

  it('ignores modifier key combinations', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'j', ctrlKey: true });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');

    fireEvent.keyDown(window, { key: 'j', metaKey: true });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');

    fireEvent.keyDown(window, { key: 'j', altKey: true });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });

  it('leaves progress unchanged for an incorrect key', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'x' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');
  });

  it('starts the next word after the final letter with celebration', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    for (const key of 'JAMES') {
      fireEvent.keyDown(window, { key });
    }

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('region', { name: /prompt for grandma/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });

  it('resets and moves to the next word when New word is selected', async () => {
    const user = userEvent.setup();
    render(<TypingGame />);
    await user.click(screen.getByRole('button', { name: /new word/i }));
    expect(screen.getByRole('region', { name: /prompt for grandma/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });

  it('shows Level 2 after completing six words', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    completeWords(firstLevelWords, ['1600', '1600', '1600', '1600', '1600', '3200'].map(Number));

    expect(screen.getByText(/^Level 2$/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /prompt for baby/i })).toBeInTheDocument();
  });

  it('shows a level-complete celebration when a level finishes', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    completeWords(firstLevelWords, [1600, 1600, 1600, 1600, 1600, 0]);

    expect(screen.getByRole('status')).toHaveTextContent(/level 1 complete/i);

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /prompt for baby/i })).toBeInTheDocument();
  });

  it('locks quiz mode until enough words are completed', async () => {
    const user = userEvent.setup();
    render(<TypingGame />);
    const quizButton = screen.getByRole('button', { name: /quiz/i });
    expect(quizButton).toBeDisabled();
    expect(quizButton).toHaveAttribute(
      'title',
      expect.stringContaining(`${QUIZ_UNLOCK_THRESHOLD} words`)
    );
    await user.click(quizButton);
    expect(screen.getByRole('region', { name: /prompt for james/i })).toBeInTheDocument();
  });

  it('unlocks quiz mode after completing enough words', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    for (let i = 0; i < QUIZ_UNLOCK_THRESHOLD; i += 1) {
      for (const key of unlockWords[i]) {
        fireEvent.keyDown(window, { key });
      }
      act(() => {
        jest.advanceTimersByTime(i === 5 ? 3200 : 1600);
      });
    }

    expect(screen.getByRole('button', { name: /quiz/i })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: /quiz/i }));
    expect(
      screen.getByRole('region', { name: /what letter does fox start with/i })
    ).toBeInTheDocument();
  });

  it('asks for the first letter in quiz mode and advances on a correct answer', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    completeWords(unlockWords, [1600, 1600, 1600, 1600, 1600, 3200, 1600, 1600, 1600, 1600]);

    fireEvent.click(screen.getByRole('button', { name: /quiz/i }));
    expect(
      screen.getByRole('region', { name: /what letter does fox start with/i })
    ).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByTestId('quiz-blank')).toHaveAttribute('data-correct', 'false');
    expect(screen.getByTestId('quiz-blank').textContent).toBe('');

    fireEvent.keyDown(window, { key: 'F' });
    expect(screen.getByTestId('quiz-blank')).toHaveAttribute('data-correct', 'true');
    expect(screen.getByTestId('quiz-blank').textContent).toBe('F');

    act(() => {
      jest.advanceTimersByTime(1600);
    });
    expect(
      screen.getByRole('region', { name: /what letter does bed start with/i })
    ).toBeInTheDocument();
  });
});
