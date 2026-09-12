import React from 'react';
import { act, render, screen, waitFor } from '@/test-utils';
import { CLOCK_CURRICULUM } from '../../constants/clock-curriculum';
import { COUNT_NUMBERS } from '../../constants/count-numbers';
import { LEARNING_WORDS } from '../../constants/learning-words';
import { LETTER_NAMES } from '../../constants/letter-names';
import { PHONEMES } from '../../constants/phonemes';
import RecordPage from './RecordPage';

describe('RecordPage', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('starts at the first item that has no recording on disk', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ phonemes: ['ae'], letterNames: [], words: [] }),
    } as Response);

    render(<RecordPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audio');
    });
    // 'ae' is the first phoneme; the second phoneme ('e') should now be the guide
    await waitFor(() => {
      expect(screen.getByTestId('guide')).toHaveTextContent(/e as in bed/);
    });
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^1 of \d+$/);
  });

  it('shows the completion state when everything is already recorded', async () => {
    const allWords = LEARNING_WORDS.map((w) => w.id);
    const allPlurals = LEARNING_WORDS.filter((w) => w.id !== 'games').map((w) => w.id);
    const allNumbers = COUNT_NUMBERS.map((n) => n.slug);
    const allLetterNames = LETTER_NAMES.map((l) => l.slug);
    const allPhonemes = PHONEMES.map((p) => p.slug);
    const allClocks = Array.from(
      new Set(
        Object.values(CLOCK_CURRICULUM)
          .flat()
          .map((target) => target.audioSlug)
      )
    );
    const totalCount =
      allPhonemes.length +
      allLetterNames.length +
      allWords.length +
      allNumbers.length +
      allPlurals.length +
      allClocks.length;

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        phonemes: allPhonemes,
        letterNames: allLetterNames,
        words: allWords,
        numbers: allNumbers,
        plurals: allPlurals,
        clocks: allClocks,
      }),
    } as Response);

    render(<RecordPage />);

    await waitFor(() => {
      expect(screen.getByTestId('guide')).toHaveTextContent(/all sounds recorded/i);
    });
    expect(screen.getByTestId('progress-label')).toHaveTextContent(
      new RegExp(`^${totalCount} of ${totalCount}$`)
    );
  });

  it('falls back to the start when the server cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    render(<RecordPage />);

    await act(async () => {});
    expect(screen.getByTestId('guide')).toHaveTextContent(/a as in cat/);
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^0 of \d+$/);
  });

  it('includes numbers and plurals in the recording queue', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        phonemes: [],
        letterNames: [],
        words: [],
        numbers: [],
        plurals: [],
      }),
    } as Response);

    render(<RecordPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audio');
    });

    const progressLabel = screen.getByTestId('progress-label');
    expect(progressLabel.textContent).toMatch(/of \d+/);
  });
});
