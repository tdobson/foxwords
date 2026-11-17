import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import type { InputMode } from '../../lib/device/input-mode';
import { ClockGame } from './ClockGame';

let mockInputMode: InputMode = 'hardware';

jest.mock('../../lib/device/input-mode', () => ({
  useInputMode: () => mockInputMode,
}));

const mockAudio = {
  playClip: jest.fn(),
  playWord: jest.fn(),
  playSequence: jest.fn(),
};

jest.mock('../../lib/audio/clips', () => ({
  usePlayAudio: () => mockAudio,
}));

// The first easy target is 1 o'clock.
describe('ClockGame on touch devices', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    mockInputMode = 'hardware';
    jest.useRealTimers();
  });

  describe('native keyboard (iPad, iPhone, Android)', () => {
    beforeEach(() => {
      mockInputMode = 'native-touch';
    });

    it('takes the hour from the native keyboard and completes the target', () => {
      render(<ClockGame initialDifficulty="easy" />);

      fireEvent.input(screen.getByTestId('child-type-input'), { target: { value: '1' } });

      expect(screen.getByTestId('revealed-text')).toHaveTextContent('1');
      expect(screen.getByTestId('clock-stage').className).toContain('celebrate');
    });

    it('does not count a key twice when it arrives through the hidden input', () => {
      render(<ClockGame initialDifficulty="medium" />);

      fireEvent.keyDown(screen.getByTestId('child-type-input'), { key: 'q' });

      expect(screen.queryByTestId('revealed-text')).not.toBeInTheDocument();
      expect(screen.getByTestId('blank-prompt')).toBeInTheDocument();
    });

    it('shakes on a wrong key from the native keyboard', () => {
      render(<ClockGame initialDifficulty="easy" />);

      fireEvent.input(screen.getByTestId('child-type-input'), { target: { value: '9' } });

      expect(screen.getByTestId('clock-stage').className).toContain('shake');
      expect(screen.queryByTestId('revealed-text')).not.toBeInTheDocument();
    });

    it('still accepts a hardware keyboard when no input is focused', () => {
      render(<ClockGame initialDifficulty="easy" />);

      fireEvent.keyDown(window, { key: '1' });

      expect(screen.getByTestId('revealed-text')).toHaveTextContent('1');
    });
  });

  describe('on-screen keypad (touch-only screens)', () => {
    beforeEach(() => {
      mockInputMode = 'onscreen-keypad';
    });

    it('shows only the number keypad on easy and no native input', () => {
      render(<ClockGame initialDifficulty="easy" />);

      expect(screen.getByRole('group', { name: 'Number keypad' })).toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Letter keyboard' })).not.toBeInTheDocument();
      expect(screen.queryByTestId('child-type-input')).not.toBeInTheDocument();
    });

    it('takes the hour from a tapped number key', () => {
      render(<ClockGame initialDifficulty="easy" />);

      fireEvent.click(screen.getByTestId('child-key-1'));

      expect(screen.getByTestId('revealed-text')).toHaveTextContent('1');
      expect(screen.getByTestId('clock-stage').className).toContain('celebrate');
    });

    it('offers letter shortcuts and number keys on medium', () => {
      render(<ClockGame initialDifficulty="medium" />);

      expect(screen.getByRole('group', { name: 'Letter keyboard' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Number keypad' })).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('child-key-Q'));
      fireEvent.click(screen.getByTestId('child-key-P'));
      fireEvent.click(screen.getByTestId('child-key-1'));

      expect(screen.getByTestId('revealed-text')).toHaveTextContent('Quarter past 1');
    });

    it('shakes on a wrong tapped key', () => {
      render(<ClockGame initialDifficulty="easy" />);

      fireEvent.click(screen.getByTestId('child-key-9'));

      expect(screen.getByTestId('clock-stage').className).toContain('shake');
      act(() => {
        jest.advanceTimersByTime(400);
      });
    });
  });
});
