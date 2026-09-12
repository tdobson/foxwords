import type { D1DatabaseLike } from '../client';
import type { AudioOverrideRow, MediaAssetRow, MediaKind } from '../types';

export interface CreateMediaAssetInput {
  id: string;
  profileId: string;
  r2Key: string;
  kind: MediaKind;
  contentType: string;
  byteSize: number;
}

export class MediaRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async findById(id: string): Promise<MediaAssetRow | null> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE id = ?')
      .bind(id);
    return stmt.first<MediaAssetRow>();
  }

  async findOwnedById(profileId: string, assetId: string): Promise<MediaAssetRow | null> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE id = ? AND profile_id = ?')
      .bind(assetId, profileId);
    return stmt.first<MediaAssetRow>();
  }

  async listForProfile(profileId: string): Promise<MediaAssetRow[]> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE profile_id = ? ORDER BY created_at ASC')
      .bind(profileId);
    const result = await stmt.all<MediaAssetRow>();
    return result.results;
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAssetRow> {
    const now = Date.now();
    await this.db
      .prepare('INSERT INTO media_assets (id, profile_id, r2_key, kind, content_type, byte_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(input.id, input.profileId, input.r2Key, input.kind, input.contentType, input.byteSize, now)
      .run();
    return {
      id: input.id,
      profile_id: input.profileId,
      r2_key: input.r2Key,
      kind: input.kind,
      content_type: input.contentType,
      byte_size: input.byteSize,
      created_at: now,
    };
  }

  async delete(profileId: string, assetId: string): Promise<boolean> {
    const existing = await this.findOwnedById(profileId, assetId);
    if (!existing) return false;
    await this.db
      .prepare('DELETE FROM media_assets WHERE id = ? AND profile_id = ?')
      .bind(assetId, profileId)
      .run();
    return true;
  }

  // Audio Overrides
  async getAudioOverride(profileId: string, clipKey: string): Promise<AudioOverrideRow | null> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, clip_key, asset_id, created_at, updated_at FROM audio_overrides WHERE profile_id = ? AND clip_key = ?')
      .bind(profileId, clipKey);
    return stmt.first<AudioOverrideRow>();
  }

  async listAudioOverrides(profileId: string): Promise<AudioOverrideRow[]> {
    const stmt = this.db
      .prepare('SELECT id, profile_id, clip_key, asset_id, created_at, updated_at FROM audio_overrides WHERE profile_id = ?')
      .bind(profileId);
    const result = await stmt.all<AudioOverrideRow>();
    return result.results;
  }

  async setAudioOverride(id: string, profileId: string, clipKey: string, assetId: string): Promise<void> {
    const asset = await this.findOwnedById(profileId, assetId);
    if (!asset) {
      throw new Error(`Media asset ${assetId} does not belong to profile ${profileId}`);
    }
    if (asset.kind !== 'system-audio') {
      throw new Error(`Media asset ${assetId} must be system-audio to set as audio override (got ${asset.kind})`);
    }

    const now = Date.now();
    await this.db
      .prepare(
        `INSERT INTO audio_overrides (id, profile_id, clip_key, asset_id, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(profile_id, clip_key) DO UPDATE SET asset_id = excluded.asset_id, updated_at = excluded.updated_at`
      )
      .bind(id, profileId, clipKey, assetId, now, now)
      .run();
  }

  async deleteAudioOverride(profileId: string, clipKey: string): Promise<boolean> {
    const existing = await this.getAudioOverride(profileId, clipKey);
    if (!existing) return false;
    await this.db
      .prepare('DELETE FROM audio_overrides WHERE profile_id = ? AND clip_key = ?')
      .bind(profileId, clipKey)
      .run();
    return true;
  }
}
