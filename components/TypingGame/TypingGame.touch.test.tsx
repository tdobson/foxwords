import type React from 'react';
import { act, fireEvent, render, screen } from '@/test-utils';
import { LEARNING_WORDS } from '../../constants/learning-words';
import type { InputMode } from '../../lib/device/input-mode';
import type { PlayProfile } from '../../lib/play/profile';
import { ProfileProvider } from '../../lib/play/profile-context';
import { TypingGame } from './TypingGame';

// Audio is covered by TypingGame.audio.test.tsx; here every clip finishes at once.
jest.mock('../../lib/audio/clips', () => {
  const audio = {
    playClip: () => Promise.resolve(),
    playWord: () => Promise.resolve(),
    playSequence: () => Promise.resolve(),
  };
  return { usePlayAudio: () => audio };
});

let mockInputMode: InputMode = 'hardware';

jest.mock('../../lib/device/input-mode', () => ({
  useInputMode: () => mockInputMode,
}));

const scriptedProfile: PlayProfile = {
  playCode: 'TESTCODE',
  childName: 'Test',
  words: LEARNING_WORDS,
  audioOverrides: {},
};

function renderGame(ui: React.ReactElement) {
  return render(<ProfileProvider initialProfile={scriptedProfile}>{ui}</ProfileProvider>);
}

function typeIntoNativeInput(text: string) {
  const input = screen.getByTestId('child-type-input');
  for (const char of text) {
    fireEvent.input(input, { target: { value: char } });
  }
}

describe('TypingGame on touch devices', () => {
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

    it('shows a large tap target and the hidden input, but no on-screen keypad', async () => {
      renderGame(<TypingGame />);

      expect(screen.getByTestId('child-type-target')).toBeInTheDocument();
      expect(screen.getByTestId('child-type-input')).toBeInTheDocument();
      expect(screen.queryByTestId('child-keyboard')).not.toBeInTheDocument();
    });

    it('fills letters typed through the native keyboard and advances to the next word', async () => {
      renderGame(<TypingGame />);

      typeIntoNativeInput('JAME');
      expect(screen.getByTestId('letter-tile-4')).toHaveAttribute('data-state', 'active');

      typeIntoNativeInput('S');
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1500);
      });
      expect(screen.getByRole('region', { name: /prompt for grandma/i })).toBeInTheDocument();
    });

    it('shakes on a wrong letter from the native keyboard and leaves progress unchanged', async () => {
      renderGame(<TypingGame />);

      typeIntoNativeInput('X');

      expect(screen.getByTestId('game-area')).toHaveAttribute('data-feedback', 'shake');
      expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    });

    it('counts a key once when it arrives through the hidden input', async () => {
      renderGame(<TypingGame />);

      fireEvent.keyDown(screen.getByTestId('child-type-input'), { key: 'j' });

      expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    });

    it('still accepts a hardware keyboard when no input is focused', async () => {
      renderGame(<TypingGame />);

      fireEvent.keyDown(window, { key: 'j' });

      expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
    });

    it('asks for a numeric keyboard during the count phase', async () => {
      renderGame(<TypingGame initialMode="count" />);

      expect(screen.getByTestId('child-type-input')).toHaveAttribute('inputmode', 'numeric');
    });
  });

  describe('on-screen keypad (touch-only screens)', () => {
    beforeEach(() => {
      mockInputMode = 'onscreen-keypad';
    });

    it('shows the letter keypad and no native input', async () => {
      renderGame(<TypingGame />);

      expect(screen.getByRole('group', { name: 'Letter keyboard' })).toBeInTheDocument();
      expect(screen.queryByTestId('child-type-input')).not.toBeInTheDocument();
    });

    it('fills letters tapped on the keypad and shakes on a wrong key', async () => {
      renderGame(<TypingGame />);

      fireEvent.click(screen.getByTestId('child-key-X'));
      expect(screen.getByTestId('game-area')).toHaveAttribute('data-feedback', 'shake');

      fireEvent.click(screen.getByTestId('child-key-J'));
      fireEvent.click(screen.getByTestId('child-key-A'));
      expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
      expect(screen.getByTestId('letter-tile-1')).toHaveAttribute('data-state', 'completed');
      expect(screen.getByTestId('letter-tile-2')).toHaveAttribute('data-state', 'active');
    });

    it('shows the number keypad during the count phase and fills the digit tapped', async () => {
      renderGame(<TypingGame initialMode="count" />);

      expect(screen.getByRole('group', { name: 'Number keypad' })).toBeInTheDocument();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(14000);
      });
      const tile = screen.getByTestId('number-tile-0');
      const digit = tile.textContent ?? '';
      expect(digit).toMatch(/^[1-9]$/);

      fireEvent.click(screen.getByTestId(`child-key-${digit}`));
      expect(tile).toHaveAttribute('data-state', 'completed');
    });
  });
});
