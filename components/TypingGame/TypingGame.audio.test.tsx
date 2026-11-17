import React from 'react';
import { act, fireEvent, render, waitFor } from '@/test-utils';
import type { PlayProfile } from '../../lib/play/profile';
import { ProfileProvider } from '../../lib/play/profile-context';
import type { LearningWord } from '../../types/learning-word.types';
import { TypingGame } from './TypingGame';

class FakeAudio {
  static instances: FakeAudio[] = [];
  private listeners: Array<() => void> = [];
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
  addEventListener(type: string, listener: () => void) {
    if (type === 'ended') {
      this.listeners.push(listener);
    }
  }
  play() {
    return Promise.resolve();
  }
  end() {
    for (const listener of this.listeners) {
      listener();
    }
  }
}

const originalAudio = globalThis.Audio;
const srcs = () => FakeAudio.instances.map((audio) => audio.src);

const big: LearningWord = {
  id: 'child_leo',
  word: 'BIG',
  promptLabel: 'Big',
  accentColor: '#e03131',
  ipa: ['b', 'ɪ', 'g'],
};

const family: PlayProfile = {
  playCode: 'LEO123',
  childName: 'Leo',
  words: [big],
  audioOverrides: { letter_b: '/api/play/LEO123/assets/ast_letter_b' },
};

describe('TypingGame audio', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      writable: true,
      value: FakeAudio,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'Audio', {
      configurable: true,
      writable: true,
      value: originalAudio,
    });
  });

  it('plays the family letter_b recording when B is typed', async () => {
    render(
      <ProfileProvider initialProfile={family}>
        <TypingGame />
      </ProfileProvider>
    );

    fireEvent.keyDown(window, { key: 'b' });

    await waitFor(() => expect(srcs()).toContain('/audio/phonemes/b.webm'));
    expect(srcs()).not.toContain('/api/play/LEO123/assets/ast_letter_b');

    act(() => {
      FakeAudio.instances.find((audio) => audio.src === '/audio/phonemes/b.webm')?.end();
    });

    await waitFor(() => expect(srcs()).toContain('/api/play/LEO123/assets/ast_letter_b'));
  });

  it('voices the child name through /api/tts when there is no recording', async () => {
    render(
      <ProfileProvider initialProfile={{ ...family, words: [{ ...big, word: 'LEO' }] }}>
        <TypingGame />
      </ProfileProvider>
    );

    await waitFor(() => expect(srcs()).toContain('/api/tts?text=LEO'));
  });
});
