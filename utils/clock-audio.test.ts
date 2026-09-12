import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { getClockAudioPath, playClockAudio, speakClockPhrase } from './clock-audio';

describe('clock-audio', () => {
  describe('getClockAudioPath', () => {
    it('returns the correct webm path in /audio/clock/', () => {
      expect(getClockAudioPath('clock-it-is-4-oclock')).toBe(
        '/audio/clock/clock-it-is-4-oclock.webm'
      );
      expect(getClockAudioPath('clock-it-is-quarter-to-8')).toBe(
        '/audio/clock/clock-it-is-quarter-to-8.webm'
      );
    });
  });

  describe('speakClockPhrase', () => {
    let mockCancel: jest.Mock;
    let mockSpeak: jest.Mock;
    let mockGetVoices: jest.Mock;

    beforeEach(() => {
      mockCancel = jest.fn();
      mockSpeak = jest.fn();
      mockGetVoices = jest.fn().mockReturnValue([
        { name: 'Alex', lang: 'en-US' },
        { name: 'Daniel (UK)', lang: 'en-GB' },
      ]);

      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          cancel: mockCancel,
          speak: mockSpeak,
          getVoices: mockGetVoices,
        },
        writable: true,
        configurable: true,
      });

      // Mock SpeechSynthesisUtterance if not available
      (global as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = jest
        .fn()
        .mockImplementation((...args: unknown[]) => ({
          text: (args[0] as string) ?? '',
          lang: '',
          rate: 1,
          voice: null,
        }));
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('cancels pending speech and speaks phrase with en-GB voice', () => {
      speakClockPhrase('It is quarter past 3');

      expect(mockCancel).toHaveBeenCalledTimes(1);
      expect(mockSpeak).toHaveBeenCalledTimes(1);
      const spokenUtterance = mockSpeak.mock.calls[0][0] as {
        lang: string;
        rate: number;
        voice: unknown;
      };
      expect(spokenUtterance.lang).toBe('en-GB');
      expect(spokenUtterance.rate).toBe(0.9);
      expect(spokenUtterance.voice).toEqual({ name: 'Daniel (UK)', lang: 'en-GB' });
    });

    it('gracefully handles missing speechSynthesis in window', () => {
      // @ts-expect-error test when speechSynthesis is not present
      delete window.speechSynthesis;

      expect(() => speakClockPhrase('It is 5 o clock')).not.toThrow();
    });
  });

  describe('playClockAudio', () => {
    let mockPlay: jest.Mock;
    let mockAudioInstance: { play: jest.Mock };

    beforeEach(() => {
      mockPlay = jest.fn().mockReturnValue(Promise.resolve());
      mockAudioInstance = { play: mockPlay };

      global.Audio = jest
        .fn()
        .mockImplementation(() => mockAudioInstance) as unknown as typeof Audio;
    });

    it('instantiates Audio with clock audio path and plays', () => {
      playClockAudio({
        audioSlug: 'clock-it-is-1-oclock',
        spokenPhrase: "It is 1 o'clock",
      });

      expect(global.Audio).toHaveBeenCalledWith('/audio/clock/clock-it-is-1-oclock.webm');
      expect(mockPlay).toHaveBeenCalledTimes(1);
    });

    it('falls back to speakClockPhrase when audio.play() rejects', async () => {
      const mockCancel = jest.fn();
      const mockSpeak = jest.fn();
      const mockGetVoices = jest.fn().mockReturnValue([]);

      Object.defineProperty(window, 'speechSynthesis', {
        value: {
          cancel: mockCancel,
          speak: mockSpeak,
          getVoices: mockGetVoices,
        },
        writable: true,
        configurable: true,
      });

      (global as unknown as { SpeechSynthesisUtterance: unknown }).SpeechSynthesisUtterance = jest
        .fn()
        .mockImplementation((...args: unknown[]) => ({
          text: (args[0] as string) ?? '',
          lang: '',
          rate: 1,
          voice: null,
        }));

      mockPlay = jest.fn().mockReturnValue(Promise.reject(new Error('Audio not found')));
      mockAudioInstance = { play: mockPlay };
      global.Audio = jest
        .fn()
        .mockImplementation(() => mockAudioInstance) as unknown as typeof Audio;

      playClockAudio({
        audioSlug: 'clock-it-is-half-past-2',
        spokenPhrase: 'It is half past 2',
      });

      // Wait a tick for catch block
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockSpeak).toHaveBeenCalledTimes(1);
    });
  });
});
