import React from 'react';
import { act, fireEvent, render, screen, userEvent } from '@/test-utils';
import { TypingGame } from './TypingGame';

describe('TypingGame', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

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

    const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDDAD', 'MUMMY', 'DADDY', 'SARAH'];
    for (const word of firstLevelWords) {
      for (const key of word) {
        fireEvent.keyDown(window, { key });
      }
      act(() => {
        jest.advanceTimersByTime(word === 'SARAH' ? 3200 : 1600);
      });
    }

    expect(screen.getByText(/^Level 2$/)).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /prompt for baby/i })).toBeInTheDocument();
  });

  it('shows a level-complete celebration when a level finishes', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDDAD', 'MUMMY', 'DADDY', 'SARAH'];
    for (const word of firstLevelWords) {
      for (const key of word) {
        fireEvent.keyDown(window, { key });
      }
      act(() => {
        jest.advanceTimersByTime(word === 'SARAH' ? 0 : 1600);
      });
    }

    expect(screen.getByRole('status')).toHaveTextContent(/level 1 complete/i);

    act(() => {
      jest.advanceTimersByTime(3200);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: /prompt for baby/i })).toBeInTheDocument();
  });
});
