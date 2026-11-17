import { renderHook, waitFor } from '@testing-library/react';
import type React from 'react';
import type { CustomWordRow } from '../../db/types';
import { buildPublicPlayPayload } from '../../profiles/public-payload';
import { profileFromPlayPayload } from '../profile';
import { ProfileProvider, useProfile } from '../profile-context';

const STORAGE_KEY = 'foxwords_play_profile';

function mayaRow(): CustomWordRow {
  return {
    id: 'w_maya',
    profile_id: 'prof_1',
    word: 'MAYA',
    category: 'family',
    prompt_label: 'Maya',
    prompt_emoji: '👧',
    photo_asset_id: null,
    audio_asset_id: null,
    sort_order: 1,
    created_at: 1000,
    updated_at: 1000,
  };
}

/** What GET /api/play/LEO123 returns, after the browser's JSON round trip. */
function receivedPayload() {
  const payload = buildPublicPlayPayload({
    childName: 'Leo',
    playToken: 'LEO123',
    customWords: [mayaRow()],
    assets: [],
  });
  return JSON.parse(JSON.stringify(payload));
}

describe('play payload drives the child game list', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('starts the game list with LEO then MAYA and never JAMES', () => {
    const profile = profileFromPlayPayload('LEO123', receivedPayload());
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider initialProfile={profile}>{children}</ProfileProvider>
    );

    const { result } = renderHook(() => useProfile(), { wrapper });

    expect(result.current.childName).toBe('Leo');
    expect(result.current.words.slice(0, 2).map((word) => word.word)).toEqual(['LEO', 'MAYA']);
    expect(result.current.words[0].promptImage).toBe('🧒');
    expect(result.current.words.map((word) => word.word)).not.toContain('JAMES');
    expect(result.current.words.map((word) => word.id)).not.toContain('james');
    expect(result.current.words.map((word) => word.word)).not.toContain('SARAH');
  });

  it('restores the same list from sessionStorage when the page reloads', async () => {
    const profile = profileFromPlayPayload('LEO123', receivedPayload());
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));

    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ProfileProvider>{children}</ProfileProvider>
      ),
    });

    await waitFor(() => {
      expect(result.current.childName).toBe('Leo');
    });
    expect(result.current.words.slice(0, 2).map((word) => word.word)).toEqual(['LEO', 'MAYA']);
    expect(result.current.words.map((word) => word.word)).not.toContain('JAMES');
  });

  it('falls back to starter words without a profile, minus james and sarah', () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <ProfileProvider>{children}</ProfileProvider>
      ),
    });

    const words = result.current.words.map((word) => word.word);
    expect(words).not.toContain('JAMES');
    expect(words).not.toContain('SARAH');
    expect(words.length).toBeGreaterThan(0);
  });
});
