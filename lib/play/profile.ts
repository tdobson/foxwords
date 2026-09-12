import { LEARNING_WORDS } from '../../constants/learning-words';
import type { LearningWord } from '../../types/learning-word.types';

export interface PlayProfileItem {
  id: string;
  word: string;
  promptLabel: string;
  category: 'vip' | 'family' | 'pet' | 'toy' | 'custom';
  promptEmoji?: string | null;
  photoUrl?: string;
  audioUrl?: string;
  ipa?: string[];
}

export interface PlayProfile {
  profileId: string;
  childName: string;
  items: PlayProfileItem[];
  audioOverrides: Record<string, string>;
}

export function mergeProfileWithCurriculum(
  profile: PlayProfile | null,
  starterWords: LearningWord[] = LEARNING_WORDS
): { childName: string; words: LearningWord[]; audioOverrides: Record<string, string> } {
  if (!profile) {
    return {
      childName: 'Little Fox',
      words: starterWords,
      audioOverrides: {},
    };
  }

  const customLearningWords: LearningWord[] = profile.items.map((item) => {
    return {
      id: `custom_${item.id}`,
      word: item.word.toUpperCase().trim(),
      promptLabel: item.promptLabel,
      accentColor: item.category === 'vip' ? '#e03131' : '#2f9e44',
      promptImage: item.promptEmoji || '✨',
      photoUrl: item.photoUrl,
      audioUrl: item.audioUrl,
      audioSource: item.audioUrl ? 'family' : 'speech',
      ipa: item.ipa || Array.from(item.word).map(() => ''),
    };
  });

  return {
    childName: profile.childName,
    words: [...customLearningWords, ...starterWords],
    audioOverrides: profile.audioOverrides || {},
  };
}
