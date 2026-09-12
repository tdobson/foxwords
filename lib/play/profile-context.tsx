'use client';

import type React from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { LEARNING_WORDS } from '../../constants/learning-words';
import type { LearningWord } from '../../types/learning-word.types';
import { mergeProfileWithCurriculum, type PlayProfile } from './profile';

interface ProfileContextValue {
  profile: PlayProfile | null;
  childName: string;
  words: LearningWord[];
  audioOverrides: Record<string, string>;
  loading: boolean;
  error: string | null;
  setProfile: (profile: PlayProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  childName: 'Little Fox',
  words: LEARNING_WORDS,
  audioOverrides: {},
  loading: false,
  error: null,
  setProfile: () => {},
});

export function ProfileProvider({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode;
  initialProfile?: PlayProfile | null;
}) {
  const [profile, setProfile] = useState<PlayProfile | null>(initialProfile);
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Check if client has local cached profile in sessionStorage
    if (!profile && typeof window !== 'undefined') {
      try {
        const cached = sessionStorage.getItem('foxwords_play_profile');
        if (cached) {
          const parsed = JSON.parse(cached);
          setProfile(parsed);
        }
      } catch {
        // Ignore JSON parse errors from local cache
      }
    }
  }, [profile]);

  const { childName, words, audioOverrides } = mergeProfileWithCurriculum(profile);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        childName,
        words,
        audioOverrides,
        loading,
        error,
        setProfile: (newProf) => {
          setProfile(newProf);
          if (typeof window !== 'undefined') {
            try {
              if (newProf) {
                sessionStorage.setItem('foxwords_play_profile', JSON.stringify(newProf));
              } else {
                sessionStorage.removeItem('foxwords_play_profile');
              }
            } catch {
              // Ignore session storage write errors
            }
          }
        },
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
