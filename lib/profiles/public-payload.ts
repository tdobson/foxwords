import { LEARNING_WORDS } from '../../constants/learning-words';
import type { LearningWord } from '../../types/learning-word.types';
import type { AudioOverrideRow, CustomWordRow, MediaAssetRow } from '../db/types';

export interface PublicPlayPayload {
  childName: string;
  words: LearningWord[];
  audioOverrides?: Record<string, string>;
}

const CATEGORY_COLORS: Record<string, string> = {
  vip: '#e03131',
  family: '#2f9e44',
  pet: '#f08c00',
  toy: '#1971c2',
  custom: '#7048e8',
};

const CATEGORY_DEFAULT_EMOJI: Record<string, string> = {
  vip: '⭐',
  family: '💛',
  pet: '🐾',
  toy: '🧸',
  custom: '✨',
};

export function buildPublicPlayPayload(params: {
  childName: string;
  playToken: string;
  customWords: CustomWordRow[];
  assets: MediaAssetRow[];
  audioOverrides?: AudioOverrideRow[];
}): PublicPlayPayload {
  const assetMap = new Map<string, MediaAssetRow>();
  for (const a of params.assets) {
    assetMap.set(a.id, a);
  }

  // Map audio overrides
  const audioOverridesMap: Record<string, string> = {};
  if (params.audioOverrides) {
    for (const ov of params.audioOverrides) {
      if (assetMap.has(ov.asset_id)) {
        audioOverridesMap[ov.clip_key] =
          `/api/play/${encodeURIComponent(params.playToken)}/assets/${encodeURIComponent(ov.asset_id)}`;
      }
    }
  }

  // 1. Convert custom words to LearningWord shape
  const customLearningWords: LearningWord[] = params.customWords.map((cw) => {
    const accentColor = CATEGORY_COLORS[cw.category] || '#2b8a3e';
    const promptImage = cw.prompt_emoji || CATEGORY_DEFAULT_EMOJI[cw.category] || '✨';

    let photoUrl: string | undefined;
    if (cw.photo_asset_id && assetMap.has(cw.photo_asset_id)) {
      photoUrl = `/api/play/${encodeURIComponent(params.playToken)}/assets/${encodeURIComponent(cw.photo_asset_id)}`;
    }

    let audioUrl: string | undefined;
    let audioSource: 'family' | 'tim' | 'speech' = 'speech';
    if (cw.audio_asset_id && assetMap.has(cw.audio_asset_id)) {
      audioUrl = `/api/play/${encodeURIComponent(params.playToken)}/assets/${encodeURIComponent(cw.audio_asset_id)}`;
      audioSource = 'family';
    }

    return {
      id: `custom_${cw.id}`,
      word: cw.word,
      promptLabel: cw.prompt_label,
      accentColor,
      promptImage,
      photoUrl,
      audioUrl,
      audioSource,
      ipa: Array.from(cw.word).map(() => ''), // Custom words use speech/recorded audio without IPA
    };
  });

  // 2. Combine custom learning words at the top, followed by standard LEARNING_WORDS
  const words: LearningWord[] = [...customLearningWords, ...LEARNING_WORDS];

  return {
    childName: params.childName,
    words,
    audioOverrides: Object.keys(audioOverridesMap).length > 0 ? audioOverridesMap : undefined,
  };
}
