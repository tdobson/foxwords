import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import ParentVoiceStudioPage from '../page';

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useParams: () => ({ profileId: 'prof_test' }),
  useRouter: () => ({ push: mockPush }),
}));

describe('ParentVoiceStudioPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/profiles/prof_test/audio-overrides')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ overrides: [] }),
        });
      }
      if (url.includes('/api/profiles/prof_test/items')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [] }),
        });
      }
      if (url.includes('/api/profiles/prof_test')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profile: {
                id: 'prof_test',
                childName: 'Leo',
                playCode: 'LEO482',
                words: [],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;
  });

  it('renders pre-flight family form with pre-filled child name and sibling input', async () => {
    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('LEO')).toBeInTheDocument();
    });
    expect(screen.getByText(/Does Leo have any brothers or sisters\?/i)).toBeInTheDocument();
  });

  it('allows adding and removing siblings in pre-flight form', async () => {
    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('LEO')).toBeInTheDocument();
    });

    const addInput = screen.getByPlaceholderText(/sibling's name/i);
    fireEvent.change(addInput, { target: { value: 'MAYA' } });

    const addBtn = screen.getByRole('button', { name: /^add$/i });
    fireEvent.click(addBtn);

    expect(screen.getByText('👧 MAYA')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /remove maya/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('👧 MAYA')).not.toBeInTheDocument();
  });

  it('transitions to recording studio view on submitting pre-flight', async () => {
    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('LEO')).toBeInTheDocument();
    });

    const enterBtn = screen.getByRole('button', { name: /enter studio/i });
    fireEvent.click(enterBtn);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument();
      expect(screen.getByText('LEO')).toBeInTheDocument();
      expect(screen.getByText(/Chapter 1 of 4: Family & VIPs/i)).toBeInTheDocument();
    });
  });

  it('supports spacebar shortcut for recording toggle and Enter for next', async () => {
    const mockGetUserMedia = jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: { getUserMedia: mockGetUserMedia },
      configurable: true,
    });

    // Mock MediaRecorder
    class MockMediaRecorder {
      state = 'inactive';
      ondataavailable: any = null;
      onstop: any = null;
      mimeType = 'audio/webm';
      start() {
        this.state = 'recording';
      }
      stop() {
        this.state = 'inactive';
        if (this.onstop) this.onstop();
      }
    }
    (global as any).MediaRecorder = MockMediaRecorder;

    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('LEO')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /enter studio/i }));

    await waitFor(() => {
      expect(screen.getByText('LEO')).toBeInTheDocument();
    });

    // Press Space to start recording
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Stop Recording' })).toBeInTheDocument();
    });

    // Press Space again to stop recording
    fireEvent.keyDown(window, { code: 'Space', key: ' ' });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Record' })).toBeInTheDocument();
    });
  });

  it('unlocks tablet play code when Chapter 1 items are completed', async () => {
    // Provide all chapter 1 overrides so isChapter1Complete becomes true
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/profiles/prof_test/audio-overrides')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              overrides: [
                { clip_key: 'word_leo', asset_id: 'ast_1' },
                { clip_key: 'word_mum', asset_id: 'ast_2' },
                { clip_key: 'word_dad', asset_id: 'ast_3' },
                { clip_key: 'word_grandad', asset_id: 'ast_4' },
              ],
            }),
        });
      }
      if (url.includes('/api/profiles/prof_test')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profile: {
                id: 'prof_test',
                childName: 'Leo',
                playCode: 'LEO482',
                words: [],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;

    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('LEO')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /enter studio/i }));

    await waitFor(() => {
      expect(screen.getByText(/Chapter 1 Complete! Play Code Unlocked/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /connect tablet/i })).toBeInTheDocument();
    });
  });
});
