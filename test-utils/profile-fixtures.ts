import type { ChildProfileRow, CustomWordRow, MediaAssetRow } from '../lib/db/types';

export const MOCK_PROFILE: ChildProfileRow = {
  id: 'prof_test_123',
  user_id: 'usr_parent_123',
  child_name: 'Maya',
  play_token_hash: 'hash_test_token_123',
  play_code: 'LION-9',
  created_at: 1726000000000,
  updated_at: 1726000000000,
};

export const MOCK_WORDS: CustomWordRow[] = [
  {
    id: 'word_mum_1',
    profile_id: 'prof_test_123',
    word: 'MUM',
    category: 'vip',
    prompt_label: 'Mum',
    prompt_emoji: '👩',
    photo_asset_id: 'ast_photo_mum',
    audio_asset_id: 'ast_audio_mum',
    sort_order: 1,
    created_at: 1726000000000,
    updated_at: 1726000000000,
  },
  {
    id: 'word_rover_2',
    profile_id: 'prof_test_123',
    word: 'ROVER',
    category: 'pet',
    prompt_label: 'Rover',
    prompt_emoji: '🐕',
    photo_asset_id: null,
    audio_asset_id: null,
    sort_order: 2,
    created_at: 1726000000000,
    updated_at: 1726000000000,
  },
];

export const MOCK_ASSETS: MediaAssetRow[] = [
  {
    id: 'ast_photo_mum',
    profile_id: 'prof_test_123',
    r2_key: 'dev/prof_test_123/ast_photo_mum.jpg',
    kind: 'photo',
    content_type: 'image/jpeg',
    byte_size: 15420,
    created_at: 1726000000000,
  },
  {
    id: 'ast_audio_mum',
    profile_id: 'prof_test_123',
    r2_key: 'dev/prof_test_123/ast_audio_mum.webm',
    kind: 'word-audio',
    content_type: 'audio/webm',
    byte_size: 42100,
    created_at: 1726000000000,
  },
];
