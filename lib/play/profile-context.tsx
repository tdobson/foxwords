'use client';

import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { LearningWord } from '../../types/learning-word.types';
import {
  DEFAULT_CHILD_NAME,
  type PlayProfile,
  parseStoredProfile,
  wordsForProfile,
} from './profile';

const STORAGE_KEY = 'foxwords_play_profile';

interface ProfileContextValue {
  profile: PlayProfile | null;
  childName: string;
  words: LearningWord[];
  audioOverrides: Record<string, string>;
  setProfile: (profile: PlayProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  childName: DEFAULT_CHILD_NAME,
  words: wordsForProfile(null),
  audioOverrides: {},
  setProfile: () => {},
});

export function ProfileProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: PlayProfile | null;
}) {
  const [profile, setProfileState] = useState<PlayProfile | null>(initialProfile);

  const setProfile = useCallback((next: PlayProfile | null) => {
    setProfileState(next);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      if (next) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage can be unavailable (private mode); the in-memory profile still works.
    }
  }, []);

  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (!cached) {
        return;
      }
      const restored = parseStoredProfile(JSON.parse(cached));
      // Keep a profile that was loaded while this effect was pending.
      setProfileState((current) => current ?? restored);
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      childName: profile?.childName ?? DEFAULT_CHILD_NAME,
      words: wordsForProfile(profile),
      audioOverrides: profile?.audioOverrides ?? {},
      setProfile,
    }),
    [profile, setProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  return useContext(ProfileContext);
}
