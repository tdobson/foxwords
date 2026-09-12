import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import * as clockAudio from '../../utils/clock-audio';
import { ClockGame } from './ClockGame';

jest.mock('../../utils/clock-audio', () => ({
  playClockAudio: jest.fn(),
  speakClockPhrase: jest.fn(),
}));

describe('ClockGame', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders clock face and difficulty buttons', () => {
    render(<ClockGame initialDifficulty="easy" />);

    expect(screen.getByRole('radio', { name: /easy/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /medium/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /hard/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /ultra/i })).toBeInTheDocument();
    expect(screen.getByTestId('blank-prompt')).toBeInTheDocument();
    expect(clockAudio.playClockAudio).toHaveBeenCalledTimes(1);
  });

  it('handles typing progression and completion in easy mode', () => {
    render(<ClockGame initialDifficulty="easy" />);

    // First easy target is 1 o'clock (hour 1)
    // Press '1'
    act(() => {
      fireEvent.keyDown(window, { key: '1' });
    });

    // Revealed text should display '1'
    expect(screen.getByTestId('revealed-text')).toHaveTextContent('1');
    // Screen feedback celebrate
    const stage = screen.getByTestId('clock-stage');
    expect(stage.className).toContain('celebrate');

    // Fast-forward celebrate delay (1200ms)
    act(() => {
      jest.advanceTimersByTime(1200);
    });

    // Advanced to next question (2 o'clock)
    expect(clockAudio.playClockAudio).toHaveBeenCalledTimes(2);
  });

  it('handles medium mode shortcut keys', () => {
    render(<ClockGame initialDifficulty="medium" />);

    // Medium target 1: Quarter past 1 -> tokens: 'Q' -> 'Quarter ', 'P' -> 'past ', '1' -> '1'
    act(() => {
      fireEvent.keyDown(window, { key: 'q' });
    });
    expect(screen.getByTestId('revealed-text')).toHaveTextContent('Quarter');

    act(() => {
      fireEvent.keyDown(window, { key: 'p' });
    });
    expect(screen.getByTestId('revealed-text')).toHaveTextContent('Quarter past');

    act(() => {
      fireEvent.keyDown(window, { key: '1' });
    });
    expect(screen.getByTestId('revealed-text')).toHaveTextContent('Quarter past 1');

    const stage = screen.getByTestId('clock-stage');
    expect(stage.className).toContain('celebrate');
  });

  it('triggers shake feedback on incorrect input', () => {
    render(<ClockGame initialDifficulty="easy" />);

    act(() => {
      fireEvent.keyDown(window, { key: 'z' });
    });

    const stage = screen.getByTestId('clock-stage');
    expect(stage.className).toContain('shake');

    // Shake clears after 400ms
    act(() => {
      jest.advanceTimersByTime(400);
    });
    expect(stage.className).not.toContain('shake');
  });

  it('displays ghost hint after 30 seconds of inactivity', () => {
    render(<ClockGame initialDifficulty="easy" />);

    expect(screen.queryByTestId('ghost-hint')).not.toBeInTheDocument();

    // Advance 29.9s -> still no hint
    act(() => {
      jest.advanceTimersByTime(29900);
    });
    expect(screen.queryByTestId('ghost-hint')).not.toBeInTheDocument();

    // Advance to 30s -> hint appears
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(screen.getByTestId('ghost-hint')).toBeInTheDocument();
    expect(screen.getByTestId('ghost-hint')).toHaveTextContent(/hint:/i);
  });

  it('allows switching difficulty levels', () => {
    render(<ClockGame initialDifficulty="easy" />);

    const mediumBtn = screen.getByRole('radio', { name: /medium/i });
    fireEvent.click(mediumBtn);

    expect(mediumBtn).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('keyboard-guide')).toHaveTextContent(/type shortcuts/i);
  });

  it('re-plays audio on repeat button click', () => {
    render(<ClockGame initialDifficulty="easy" />);

    expect(clockAudio.playClockAudio).toHaveBeenCalledTimes(1);

    const repeatBtn = screen.getByRole('button', { name: /repeat time audio/i });
    fireEvent.click(repeatBtn);

    expect(clockAudio.playClockAudio).toHaveBeenCalledTimes(2);
  });
});
