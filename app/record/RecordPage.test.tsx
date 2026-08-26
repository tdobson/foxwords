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
      json: async () => ({ phonemes: ['ae'], words: [] }),
    } as Response);

    render(<RecordPage />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/audio');
    });
    // 'ae' is the first phoneme; the second ('ah') should now be the guide
    await waitFor(() => {
      expect(screen.getByTestId('guide')).toHaveTextContent(/ar as in far/);
    });
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^1 of 61$/);
  });

  it('shows the completion state when everything is already recorded', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        phonemes: [
          'ae',
          'ah',
          'uh',
          'ee',
          'ai',
          'ie',
          'o',
          'oo',
          'or',
          'air',
          'e',
          'i',
          'u',
          'b',
          'd',
          'f',
          'g',
          'j',
          'k',
          'l',
          'm',
          'n',
          'p',
          'r',
          's',
          'sh',
          't',
          'z',
          'ks',
        ],
        words: [
          'james',
          'grandma',
          'granddad',
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
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^61 of 61$/);
  });

  it('falls back to the start when the server cannot be reached', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline'));

    render(<RecordPage />);

    await act(async () => {});
    expect(screen.getByTestId('guide')).toHaveTextContent(/a as in cat/);
    expect(screen.getByTestId('progress-label')).toHaveTextContent(/^0 of 61$/);
  });
});
