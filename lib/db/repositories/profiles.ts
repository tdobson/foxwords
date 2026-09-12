import type { D1DatabaseLike } from '../client';
import type { ChildProfileRow, CustomWordCategory, CustomWordRow } from '../types';

export interface CreateProfileInput {
  id: string;
  userId: string;
  childName: string;
  playTokenHash: string;
  playCode: string;
}

export interface CreateCustomWordInput {
  id: string;
  profileId: string;
  word: string;
  category: CustomWordCategory;
  promptLabel: string;
  promptEmoji?: string | null;
  photoAssetId?: string | null;
  audioAssetId?: string | null;
  sortOrder?: number;
}

export class ProfileRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async listForUser(userId: string): Promise<ChildProfileRow[]> {
    const stmt = this.db
      .prepare('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE user_id = ? ORDER BY created_at ASC')
      .bind(userId);
    const result = await stmt.all<ChildProfileRow>();
    return result.results;
  }

  async findOwnedById(userId: string, profileId: string): Promise<ChildProfileRow | null> {
    const stmt = this.db
      .prepare('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE id = ? AND user_id = ?')
      .bind(profileId, userId);
    return stmt.first<ChildProfileRow>();
  }

  async findByPlayTokenHash(tokenHash: string): Promise<ChildProfileRow | null> {
    const stmt = this.db
      .prepare('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_token_hash = ?')
      .bind(tokenHash);
    return stmt.first<ChildProfileRow>();
  }

  async findByPlayCode(playCode: string): Promise<ChildProfileRow | null> {
    const stmt = this.db
      .prepare('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_code = ?')
      .bind(playCode.toUpperCase().trim());
    return stmt.first<ChildProfileRow>();
  }

  async create(input: CreateProfileInput): Promise<ChildProfileRow> {
    const now = Date.now();
    await this.db
      .prepare('INSERT INTO child_profiles (id, user_id, child_name, play_token_hash, play_code, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(input.id, input.userId, input.childName.trim(), input.playTokenHash, input.playCode.toUpperCase().trim(), now, now)
      .run();
    return {
      id: input.id,
      user_id: input.userId,
      child_name: input.childName.trim(),
      play_token_hash: input.playTokenHash,
      play_code: input.playCode.toUpperCase().trim(),
      created_at: now,
      updated_at: now,
    };
  }

  async updateOwned(
    userId: string,
    profileId: string,
    patch: { childName?: string; playTokenHash?: string; playCode?: string }
  ): Promise<ChildProfileRow | null> {
    const existing = await this.findOwnedById(userId, profileId);
    if (!existing) return null;

    const childName = patch.childName?.trim() ?? existing.child_name;
    const playTokenHash = patch.playTokenHash ?? existing.play_token_hash;
    const playCode = patch.playCode?.toUpperCase().trim() ?? existing.play_code;
    const now = Date.now();

    await this.db
      .prepare('UPDATE child_profiles SET child_name = ?, play_token_hash = ?, play_code = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .bind(childName, playTokenHash, playCode, now, profileId, userId)
      .run();

    return {
      ...existing,
      child_name: childName,
      play_token_hash: playTokenHash,
      play_code: playCode,
      updated_at: now,
    };
  }

  async deleteOwned(userId: string, profileId: string): Promise<boolean> {
    const existing = await this.findOwnedById(userId, profileId);
    if (!existing) return false;
    await this.db
      .prepare('DELETE FROM child_profiles WHERE id = ? AND user_id = ?')
      .bind(profileId, userId)
      .run();
    return true;
  }

  // Custom words belonging to a profile
  async listWordsForProfile(profileId: string): Promise<CustomWordRow[]> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at FROM custom_words WHERE profile_id = ? ORDER BY sort_order ASC, created_at ASC')
      .bind(profileId);
    const result = await stmt.all<CustomWordRow>();
    return result.results;
  }

  async createWord(userId: string, input: CreateCustomWordInput): Promise<CustomWordRow | null> {
    const profile = await this.findOwnedById(userId, input.profileId);
    if (!profile) return null;

    const now = Date.now();
    await this.db
      .prepare('INSERT INTO custom_words (id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(
        input.id,
        input.profileId,
        input.word.toUpperCase().trim(),
        input.category,
        input.promptLabel.trim(),
        input.promptEmoji ?? null,
        input.photoAssetId ?? null,
        input.audioAssetId ?? null,
        input.sortOrder ?? 0,
        now,
        now
      )
      .run();

    return {
      id: input.id,
      profile_id: input.profileId,
      word: input.word.toUpperCase().trim(),
      category: input.category,
      prompt_label: input.promptLabel.trim(),
      prompt_emoji: input.promptEmoji ?? null,
      photo_asset_id: input.photoAssetId ?? null,
      audio_asset_id: input.audioAssetId ?? null,
      sort_order: input.sortOrder ?? 0,
      created_at: now,
      updated_at: now,
    };
  }

  async deleteWordOwned(userId: string, profileId: string, wordId: string): Promise<boolean> {
    const profile = await this.findOwnedById(userId, profileId);
    if (!profile) return false;
    await this.db
      .prepare('DELETE FROM custom_words WHERE id = ? AND profile_id = ?')
      .bind(wordId, profileId)
      .run();
    return true;
  }
}
