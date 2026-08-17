import React from 'react';
import { act, fireEvent, render, screen, userEvent } from '@/test-utils';
import { REVEAL_DELAY_MS } from '../../constants/difficulty-levels';
import { TypingGame } from './TypingGame';

describe('TypingGame', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  it('renders initial game state with JAMES prompt', () => {
    render(<TypingGame />);
    expect(screen.getByRole('region', { name: /prompt for james/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });

  it('fills the next letter when the matching physical key is pressed', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
    expect(screen.getByRole('status')).toHaveTextContent(/1 of 5/i);
  });

  it('leaves progress unchanged for an incorrect key', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'x' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('status')).toHaveTextContent(/try the highlighted letter/i);
  });

  it('starts the next word after the final letter with celebration', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    for (const key of 'JAMES') {
      fireEvent.keyDown(window, { key });
    }

    expect(screen.getByRole('status')).toHaveTextContent(/word complete/i);

    act(() => {
      jest.advanceTimersByTime(1500);
    });

    expect(screen.getByRole('region', { name: /prompt for grandma/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');

    jest.useRealTimers();
  });

  it('resets and moves to the next word when New word is selected', async () => {
    const user = userEvent.setup();
    render(<TypingGame />);
    await user.click(screen.getByRole('button', { name: /new word/i }));
    expect(screen.getByRole('region', { name: /prompt for grandma/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });

  it('reveals letters incrementally after delay in reveal mode', () => {
    jest.useFakeTimers();
    render(<TypingGame />);

    const revealRadio = screen.getByLabelText(/reveal/i);
    fireEvent.click(revealRadio);

    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'hidden');

    act(() => {
      jest.advanceTimersByTime(REVEAL_DELAY_MS);
    });

    expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'faint');
    expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'hidden');

    jest.useRealTimers();
  });
});
