export type SubscriptionStatus = 'free' | 'plus';

export interface UserRow {
  id: string;
  email: string;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  created_at: number;
  updated_at: number;
}

export interface AuthTokenRow {
  token_hash: string;
  user_id: string;
  expires_at: number;
  used_at: number | null;
  created_at: number;
}

export interface SessionRow {
  session_hash: string;
  user_id: string;
  expires_at: number;
  created_at: number;
  last_seen_at: number;
}

export interface ChildProfileRow {
  id: string;
  user_id: string;
  child_name: string;
  play_token_hash: string;
  play_code: string;
  created_at: number;
  updated_at: number;
}

export type CustomWordCategory = 'vip' | 'family' | 'pet' | 'toy' | 'custom';

export interface CustomWordRow {
  id: string;
  profile_id: string;
  word: string;
  category: CustomWordCategory;
  prompt_label: string;
  prompt_emoji: string | null;
  photo_asset_id: string | null;
  audio_asset_id: string | null;
  sort_order: number;
  created_at: number;
  updated_at: number;
}

export type MediaKind = 'photo' | 'word-audio' | 'system-audio';

export interface MediaAssetRow {
  id: string;
  profile_id: string;
  r2_key: string;
  kind: MediaKind;
  content_type: string;
  byte_size: number;
  created_at: number;
}

export interface AudioOverrideRow {
  id: string;
  profile_id: string;
  clip_key: string;
  asset_id: string;
  created_at: number;
  updated_at: number;
}

export interface RateLimitRow {
  bucket: string;
  window_started_at: number;
  request_count: number;
}
