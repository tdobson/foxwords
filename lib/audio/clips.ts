'use client';

import { useMemo } from 'react';
import audioInventory from '../../constants/audio-inventory.json';
import generatedAudio from '../../constants/generated-audio.json';
import { LEARNING_WORDS } from '../../constants/learning-words';
import type { LearningWord } from '../../types/learning-word.types';
import { getPhonemeAudioPath, getWordAudioPath } from '../../utils/audio';
import { useProfile } from '../play/profile-context';

export type AudioOverrides = Record<string, string>;

/** A step in a sequence: a clip key, or a word whose audio is resolved for that word. */
export type AudioStep = string | LearningWord;

const SEQUENCE_STEP_TIMEOUT_MS = 10000;
const STARTER_WORD_IDS = new Set(LEARNING_WORDS.map((word) => word.id));
const BUNDLED_PHONEMES = new Set<string>(audioInventory.phonemes);
const BUNDLED_WORDS = new Set<string>(audioInventory.words);
const GENERATED: Record<string, string> = generatedAudio;

function nonEmpty(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.length > 0;
}

function bundledClipUrl(clipKey: string): string | undefined {
  if (clipKey.startsWith('phoneme_')) {
    const slug = clipKey.slice('phoneme_'.length);
    return BUNDLED_PHONEMES.has(slug) ? getPhonemeAudioPath(slug) : undefined;
  }
  if (clipKey.startsWith('word_')) {
    const wordId = clipKey.slice('word_'.length);
    return BUNDLED_WORDS.has(wordId) ? getWordAudioPath(wordId) : undefined;
  }
  return undefined;
}

/**
 * Resolves a clip key to a URL: family recording, then Tim's bundled recording,
 * then a generated default. Returns null when nothing exists, so the caller stays silent.
 */
export function resolveClipUrl(clipKey: string, overrides: AudioOverrides = {}): string | null {
  const family = overrides[clipKey];
  if (nonEmpty(family)) {
    return family;
  }
  const bundled = bundledClipUrl(clipKey);
  if (nonEmpty(bundled)) {
    return bundled;
  }
  const generated = GENERATED[clipKey];
  return nonEmpty(generated) ? generated : null;
}

/**
 * Resolves the audio for a word: its own family recording, then a family override
 * for `word_<id>`, then the bundled or generated default. Typed names (not in the
 * starter list) fall back to the voice endpoint. Returns null for silence.
 */
export function resolveWordUrl(word: LearningWord, overrides: AudioOverrides = {}): string | null {
  if (nonEmpty(word.audioUrl)) {
    return word.audioUrl;
  }
  const clipKey = `word_${word.id}`;
  const fromClip = resolveClipUrl(clipKey, overrides);
  if (fromClip) {
    return fromClip;
  }
  if (!STARTER_WORD_IDS.has(word.id) && word.word.trim().length > 0) {
    return `/api/tts?text=${encodeURIComponent(word.word)}`;
  }
  return null;
}

function playUrl(url: string): Promise<void> {
  if (typeof Audio === 'undefined') {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    const audio = new Audio(url);
    const timeout = setTimeout(finish, SEQUENCE_STEP_TIMEOUT_MS);
    function finish() {
      clearTimeout(timeout);
      resolve();
    }
    audio.addEventListener('ended', finish, { once: true });
    audio.addEventListener('error', finish, { once: true });
    const started = audio.play() as Promise<void> | undefined;
    if (started && typeof started.catch === 'function') {
      started.catch(finish);
    }
  });
}

/** Plays one clip. Silent when no family, bundled or generated clip exists. */
export function playClip(clipKey: string, overrides: AudioOverrides = {}): Promise<void> {
  const url = resolveClipUrl(clipKey, overrides);
  return url ? playUrl(url) : Promise.resolve();
}

/** Plays one word's audio. Silent when the word has no audio to play. */
export function playWord(word: LearningWord, overrides: AudioOverrides = {}): Promise<void> {
  const url = resolveWordUrl(word, overrides);
  return url ? playUrl(url) : Promise.resolve();
}

/** Plays URLs one after another, waiting for each to finish, with an optional gap. */
export async function playSequence(urls: string[], gapMs = 0): Promise<void> {
  for (let index = 0; index < urls.length; index += 1) {
    await playUrl(urls[index]);
    if (gapMs > 0 && index < urls.length - 1) {
      await new Promise<void>((resolve) => setTimeout(resolve, gapMs));
    }
  }
}

/**
 * Audio for the child's game. Reads the family overrides from the profile context, so
 * every game gets the same resolution order: family, bundled, generated, typed-name voice.
 */
export function usePlayAudio() {
  const { audioOverrides } = useProfile();

  return useMemo(() => {
    const sequence = (steps: AudioStep[], gapMs = 0) => {
      const urls = steps
        .map((step) =>
          typeof step === 'string'
            ? resolveClipUrl(step, audioOverrides)
            : resolveWordUrl(step, audioOverrides)
        )
        .filter(nonEmpty);
      return playSequence(urls, gapMs);
    };

    return {
      playClip: (clipKey: string) => playClip(clipKey, audioOverrides),
      playWord: (word: LearningWord) => playWord(word, audioOverrides),
      playSequence: sequence,
    };
  }, [audioOverrides]);
}
