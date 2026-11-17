import { renderHook } from '@testing-library/react';
import type React from 'react';
import type { LearningWord } from '../../../types/learning-word.types';
import type { PlayProfile } from '../../play/profile';
import { ProfileProvider } from '../../play/profile-context';
import {
  playClip,
  playSequence,
  playWord,
  resolveClipUrl,
  resolveWordUrl,
  usePlayAudio,
} from '../clips';

// Generated clips are regenerated over time, so pin this suite to an empty set.
jest.mock('../../../constants/generated-audio.json', () => ({ __esModule: true, default: {} }));
const mockGenerated: Record<string, string> = jest.requireMock(
  '../../../constants/generated-audio.json'
).default;

class FakeAudio {
  static instances: FakeAudio[] = [];
  listeners = new Map<string, Array<() => void>>();
  constructor(public src: string) {
    FakeAudio.instances.push(this);
  }
  addEventListener(type: string, listener: () => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  play() {
    return Promise.resolve();
  }
  end() {
    for (const listener of this.listeners.get('ended') ?? []) {
      listener();
    }
  }
}

const originalAudio = globalThis.Audio;
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const srcs = () => FakeAudio.instances.map((audio) => audio.src);

const customWord: LearningWord = {
  id: 'custom_w1',
  word: 'MAYA',
  promptLabel: 'Maya',
  accentColor: '#2f9e44',
  ipa: ['m', 'eɪ', 'ə'],
};

const childWord: LearningWord = {
  id: 'child_leo',
  word: 'LEO',
  promptLabel: 'Leo',
  accentColor: '#e03131',
  ipa: ['l', 'iː', 'ə', 'ʊ'],
};

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

describe('resolveClipUrl', () => {
  afterEach(() => {
    for (const key of Object.keys(mockGenerated)) delete mockGenerated[key];
  });

  it('prefers a family override over the bundled recording', () => {
    expect(resolveClipUrl('phoneme_b', { phoneme_b: '/api/play/X/assets/family' })).toBe(
      '/api/play/X/assets/family'
    );
  });

  it('uses the bundled phoneme recording when there is no override', () => {
    expect(resolveClipUrl('phoneme_b')).toBe('/audio/phonemes/b.webm');
  });

  it('uses the bundled word recording for starter words', () => {
    expect(resolveClipUrl('word_apple')).toBe('/audio/words/apple.webm');
  });

  it('returns null for a clip with no override, bundled or generated audio', () => {
    expect(resolveClipUrl('number_3')).toBeNull();
    expect(resolveClipUrl('letter_q')).toBeNull();
    expect(resolveClipUrl('praise_great_job')).toBeNull();
    expect(resolveClipUrl('clock_clock-it-is-1-oclock')).toBeNull();
  });

  it('ignores empty override strings', () => {
    expect(resolveClipUrl('phoneme_b', { phoneme_b: '' })).toBe('/audio/phonemes/b.webm');
    expect(resolveClipUrl('number_3', { number_3: '' })).toBeNull();
  });

  it('uses a family override for a clip that has no bundled audio', () => {
    expect(resolveClipUrl('letter_b', { letter_b: '/family/b.webm' })).toBe('/family/b.webm');
  });

  it('falls back to generated audio when nothing else exists', () => {
    jest.isolateModules(() => {
      mockGenerated.number_3 = '/audio/generated/number-3.mp3';
      const isolated = require('../clips') as typeof import('../clips');
      expect(isolated.resolveClipUrl('number_3')).toBe('/audio/generated/number-3.mp3');
      expect(isolated.resolveClipUrl('number_4')).toBeNull();
    });
  });

  it('prefers bundled recordings over generated audio', () => {
    jest.isolateModules(() => {
      mockGenerated.phoneme_b = '/audio/generated/b.mp3';
      const isolated = require('../clips') as typeof import('../clips');
      expect(isolated.resolveClipUrl('phoneme_b')).toBe('/audio/phonemes/b.webm');
    });
  });
});

describe('resolveWordUrl', () => {
  it('plays the family recording on the word first', () => {
    const word = { ...customWord, audioUrl: '/api/play/X/assets/maya' };
    expect(resolveWordUrl(word, { word_custom_w1: '/override' })).toBe('/api/play/X/assets/maya');
  });

  it('uses a word_<id> family override before the voice endpoint', () => {
    expect(resolveWordUrl(customWord, { word_custom_w1: '/api/play/X/assets/override' })).toBe(
      '/api/play/X/assets/override'
    );
  });

  it('voices typed names through /api/tts, url-encoded', () => {
    expect(resolveWordUrl(customWord)).toBe('/api/tts?text=MAYA');
    expect(resolveWordUrl(childWord)).toBe('/api/tts?text=LEO');
    expect(resolveWordUrl({ ...customWord, word: 'Green Tractor' })).toBe(
      '/api/tts?text=Green%20Tractor'
    );
  });

  it('plays the bundled recording for a starter word', () => {
    const cat = { id: 'cat', word: 'CAT', promptLabel: 'Cat', accentColor: '#000', ipa: [] };
    expect(resolveWordUrl(cat)).toBe('/audio/words/cat.webm');
  });

  it('is silent for a starter word with no recording or generated clip', () => {
    const hat = { id: 'hat', word: 'HAT', promptLabel: 'Hat', accentColor: '#000', ipa: [] };
    expect(resolveWordUrl(hat)).toBeNull();
  });

  it('is silent for a typed name that is blank', () => {
    expect(resolveWordUrl({ ...customWord, word: '   ' })).toBeNull();
  });
});

describe('playClip and playWord', () => {
  it('plays the resolved URL through a single Audio element', async () => {
    const done = playClip('phoneme_b');
    expect(srcs()).toEqual(['/audio/phonemes/b.webm']);
    FakeAudio.instances[0].end();
    await done;
  });

  it('plays nothing when there is no clip', async () => {
    await playClip('number_3');
    expect(FakeAudio.instances).toHaveLength(0);
  });

  it('plays a family override in place of the bundled clip', () => {
    void playClip('phoneme_b', { phoneme_b: '/family/b.webm' });
    expect(srcs()).toEqual(['/family/b.webm']);
  });

  it('plays a typed name through the voice endpoint', () => {
    void playWord(customWord);
    expect(srcs()).toEqual(['/api/tts?text=MAYA']);
  });

  it('does not play Web Speech', async () => {
    const speak = jest.fn();
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: { speak } });
    void playWord(customWord);
    expect(speak).not.toHaveBeenCalled();
    delete (window as { speechSynthesis?: unknown }).speechSynthesis;
  });
});

describe('playSequence', () => {
  it('plays URLs one after another, waiting for each to end', async () => {
    const done = playSequence(['/a.webm', '/b.webm', '/c.webm']);
    expect(srcs()).toEqual(['/a.webm']);

    FakeAudio.instances[0].end();
    await flush();
    expect(srcs()).toEqual(['/a.webm', '/b.webm']);

    FakeAudio.instances[1].end();
    await flush();
    expect(srcs()).toEqual(['/a.webm', '/b.webm', '/c.webm']);

    FakeAudio.instances[2].end();
    await done;
  });

  it('moves on when a clip fails to load', async () => {
    const done = playSequence(['/broken.webm', '/ok.webm']);
    for (const listener of FakeAudio.instances[0].listeners.get('error') ?? []) {
      listener();
    }
    await flush();
    expect(srcs()).toEqual(['/broken.webm', '/ok.webm']);
    FakeAudio.instances[1].end();
    await done;
  });

  it('resolves for an empty list', async () => {
    await playSequence([]);
    expect(FakeAudio.instances).toHaveLength(0);
  });
});

describe('usePlayAudio', () => {
  const profile: PlayProfile = {
    playCode: 'LEO123',
    childName: 'Leo',
    words: [childWord],
    audioOverrides: { letter_b: '/api/play/LEO123/assets/ast_b' },
  };

  function renderAudio(initialProfile: PlayProfile | null) {
    return renderHook(() => usePlayAudio(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ProfileProvider initialProfile={initialProfile}>{children}</ProfileProvider>
      ),
    });
  }

  it('plays the family override for a letter from the profile context', () => {
    const { result } = renderAudio(profile);
    void result.current.playClip('letter_b');
    expect(srcs()).toEqual(['/api/play/LEO123/assets/ast_b']);
  });

  it('plays the bundled clip when the profile has no override', () => {
    const { result } = renderAudio(null);
    void result.current.playClip('phoneme_b');
    expect(srcs()).toEqual(['/audio/phonemes/b.webm']);
  });

  it('plays a word, including a typed name, through the hook', () => {
    const { result } = renderAudio(profile);
    void result.current.playWord(childWord);
    expect(srcs()).toEqual(['/api/tts?text=LEO']);
  });

  it('sequences clip keys and words, skipping any step that is silent', async () => {
    const { result } = renderAudio(profile);
    const done = result.current.playSequence(['number_3', childWord, 'phoneme_b', 'letter_b']);
    expect(srcs()).toEqual(['/api/tts?text=LEO']);

    FakeAudio.instances[0].end();
    await flush();
    expect(srcs()).toEqual(['/api/tts?text=LEO', '/audio/phonemes/b.webm']);

    FakeAudio.instances[1].end();
    await flush();
    expect(srcs()).toEqual([
      '/api/tts?text=LEO',
      '/audio/phonemes/b.webm',
      '/api/play/LEO123/assets/ast_b',
    ]);

    FakeAudio.instances[2].end();
    await done;
  });

  it('keeps the same functions while the profile does not change', () => {
    const { result, rerender } = renderAudio(profile);
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
