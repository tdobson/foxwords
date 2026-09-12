PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'plus',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_tokens (
  token_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  session_hash TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS child_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_name TEXT NOT NULL,
  play_token_hash TEXT NOT NULL UNIQUE,
  play_code TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('photo', 'word-audio', 'system-audio')),
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(id, profile_id)
);

CREATE TABLE IF NOT EXISTS custom_words (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('vip', 'family', 'pet', 'toy', 'custom')),
  prompt_label TEXT NOT NULL,
  prompt_emoji TEXT,
  photo_asset_id TEXT,
  audio_asset_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (photo_asset_id, profile_id) REFERENCES media_assets(id, profile_id) ON DELETE SET NULL,
  FOREIGN KEY (audio_asset_id, profile_id) REFERENCES media_assets(id, profile_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audio_overrides (
  id TEXT PRIMARY KEY NOT NULL,
  profile_id TEXT NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  clip_key TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(profile_id, clip_key),
  FOREIGN KEY (asset_id, profile_id) REFERENCES media_assets(id, profile_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY NOT NULL,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_words_profile ON custom_words(profile_id);
CREATE INDEX IF NOT EXISTS idx_assets_profile ON media_assets(profile_id);
