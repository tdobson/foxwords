import React from 'react';
import { act, render, screen, waitFor } from '@/test-utils';
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
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^1 of 106$/);
  });

  it('shows the completion state when everything is already recorded', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        phonemes: [
          'ae',
          'e',
          'i',
          'o',
          'u',
          'oo',
          'ah',
          'ee',
          'or',
          'oo2',
          'er',
          'uh',
          'ai',
          'ie',
          'oi',
          'oh',
          'ow',
          'air',
          'ear',
          'b',
          'd',
          'f',
          'g',
          'h',
          'j',
          'k',
          'l',
          'm',
          'n',
          'ng',
          'p',
          'r',
          's',
          'sh',
          't',
          'ch',
          'th',
          'th2',
          'v',
          'w',
          'y',
          'z',
          'ks',
          'qu',
        ],
        letterNames: [
          'ae',
          'e',
          'i',
          'o',
          'u',
          'b',
          'd',
          'f',
          'g',
          'h',
          'j',
          'k',
          'l',
          'm',
          'n',
          'ng',
          'p',
          'r',
          's',
          'sh',
          't',
          'ch',
          'th',
          'th2',
          'v',
          'w',
          'y',
          'z',
          'ks',
          'qu',
        ],
        words: [
          'james',
          'grandma',
          'grandad',
          'mummy',
          'daddy',
          'sarah',
          'baby',
          'grandpa',
          'granny',
          'meg',
          'fox',
          'bed',
          'milk',
          'orange',
          'banana',
          'dog',
          'cat',
          'bike',
          'book',
          'tractor',
          'crane',
          'apple',
          'jam',
          'big',
          'splash',
          'rain',
          'games',
          'jigsaw',
          'tram',
          'train',
          'rail',
          'track',
        ],
      }),
    } as Response);

    render(<RecordPage />);

    await waitFor(() => {
      expect(screen.getByTestId('guide')).toHaveTextContent(/all sounds recorded/i);
    });
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^106 of 106$/);
  });

  it('falls back to the start when the server cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    render(<RecordPage />);

    await act(async () => {});
    expect(screen.getByTestId('guide')).toHaveTextContent(/a as in cat/);
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^0 of 106$/);
  });
});
