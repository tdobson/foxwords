-- Rollback for migration 0001_initial.sql
-- Note: Reverse foreign key order for clean dropping.
PRAGMA foreign_keys = OFF;

DROP INDEX IF EXISTS idx_assets_profile;
DROP INDEX IF EXISTS idx_words_profile;
DROP INDEX IF EXISTS idx_profiles_user;
DROP INDEX IF EXISTS idx_sessions_user;
DROP INDEX IF EXISTS idx_auth_tokens_user;

DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS audio_overrides;
DROP TABLE IF EXISTS custom_words;
DROP TABLE IF EXISTS media_assets;
DROP TABLE IF EXISTS child_profiles;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS auth_tokens;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;
