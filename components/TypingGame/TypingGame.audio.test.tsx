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

  it('plays the usual letter sound for family names that have no phonics data', async () => {
    const bea: LearningWord = { ...big, id: 'custom_bea', word: 'BEA', ipa: ['', '', ''] };
    render(
      <ProfileProvider initialProfile={{ ...family, words: [bea], audioOverrides: {} }}>
        <TypingGame />
      </ProfileProvider>
    );

    fireEvent.keyDown(window, { key: 'b' });

    await waitFor(() => expect(srcs()).toContain('/audio/phonemes/b.webm'));
  });

  it('says the whole word after the last letter has finished, with no praise', async () => {
    const at: LearningWord = { ...big, id: 'at', word: 'AT', ipa: ['æ', 't'] };
    render(
      <ProfileProvider initialProfile={{ ...family, words: [at], audioOverrides: {} }}>
        <TypingGame />
      </ProfileProvider>
    );
    await waitFor(() => expect(srcs()).toContain('/api/tts?text=AT'));
    FakeAudio.instances = [];

    fireEvent.keyDown(window, { key: 'a' });
    fireEvent.keyDown(window, { key: 't' });
    await waitFor(() => expect(srcs()).toContain('/audio/phonemes/t.webm'));

    // The word must not start while the last letter is still playing.
    await new Promise((resolve) => setTimeout(resolve, 700));
    expect(srcs()).not.toContain('/api/tts?text=AT');

    // Finish each clip as it starts (letter sounds, then letter names, then the pause).
    await waitFor(
      () => {
        act(() => {
          for (const audio of FakeAudio.instances) audio.end();
        });
        expect(srcs()).toContain('/api/tts?text=AT');
      },
      { timeout: 3000 }
    );
    expect(srcs().some((src) => src.includes('praise'))).toBe(false);
  });
});
