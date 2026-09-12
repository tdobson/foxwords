import { NextRequest } from 'next/server';
import { type RuntimeEnv, setMockRuntimeEnv } from '../../../../lib/cloudflare-context';
import type { D1DatabaseLike, D1PreparedStatementLike } from '../../../../lib/db/client';
import { sha256Hex } from '../../../../lib/security/crypto';
import { GET as streamPlayAsset } from '../../play/[token]/assets/[assetId]/route';
import { POST as uploadAsset } from '../../profiles/[profileId]/assets/route';
import {
  GET as listOverrides,
  PUT as setOverride,
} from '../../profiles/[profileId]/audio-overrides/route';

class MediaTestD1 implements D1DatabaseLike {
  public users: any[] = [];
  public sessions: any[] = [];
  public child_profiles: any[] = [];
  public media_assets: any[] = [];
  public audio_overrides: any[] = [];

  prepare(query: string): D1PreparedStatementLike {
    const boundArgs: unknown[] = [];
    return {
      bind(...values: unknown[]) {
        boundArgs.push(...values);
        return this;
      },
      first: async <T>() => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (
          norm.startsWith(
            'SELECT session_hash, user_id, expires_at, created_at, last_seen_at FROM sessions WHERE session_hash = ? AND expires_at > ?'
          )
        ) {
          const [session_hash, now] = boundArgs as [string, number];
          const s = this.sessions.find(
            (sess) => sess.session_hash === session_hash && sess.expires_at > now
          );
          return s as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE id = ?'
          )
        ) {
          const [id] = boundArgs as [string];
          const found = this.users.find((u) => u.id === id);
          return found as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE id = ? AND user_id = ?'
          )
        ) {
          const [id, user_id] = boundArgs as [string, string];
          const p = this.child_profiles.find((prof) => prof.id === id && prof.user_id === user_id);
          return p as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_token_hash = ?'
          )
        ) {
          const [token_hash] = boundArgs as [string];
          const p = this.child_profiles.find((prof) => prof.play_token_hash === token_hash);
          return p as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_code = ?'
          )
        ) {
          const [code] = boundArgs as [string];
          const p = this.child_profiles.find((prof) => prof.play_code === code);
          return p as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE id = ? AND profile_id = ?'
          )
        ) {
          const [id, profile_id] = boundArgs as [string, string];
          const a = this.media_assets.find((ast) => ast.id === id && ast.profile_id === profile_id);
          return a as unknown as T;
        }
        if (
          norm.startsWith(
            'SELECT id, profile_id, clip_key, asset_id, created_at, updated_at FROM audio_overrides WHERE profile_id = ? AND clip_key = ?'
          )
        ) {
          const [profile_id, clip_key] = boundArgs as [string, string];
          const o = this.audio_overrides.find(
            (ov) => ov.profile_id === profile_id && ov.clip_key === clip_key
          );
          return o as unknown as T;
        }
        return null;
      },
      all: async <T>() => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (
          norm.startsWith(
            'SELECT id, profile_id, clip_key, asset_id, created_at, updated_at FROM audio_overrides WHERE profile_id = ?'
          )
        ) {
          const [profile_id] = boundArgs as [string];
          const res = this.audio_overrides.filter((ov) => ov.profile_id === profile_id);
          return { results: res as unknown as T[], success: true };
        }
        return { results: [] as T[], success: true };
      },
      run: async () => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('INSERT INTO media_assets')) {
          const [id, profile_id, r2_key, kind, content_type, byte_size, created_at] = boundArgs;
          this.media_assets.push({
            id,
            profile_id,
            r2_key,
            kind,
            content_type,
            byte_size,
            created_at,
          });
        } else if (norm.includes('INSERT INTO audio_overrides')) {
          const [id, profile_id, clip_key, asset_id, created_at, updated_at] = boundArgs;
          const existing = this.audio_overrides.find(
            (o) => o.profile_id === profile_id && o.clip_key === clip_key
          );
          if (existing) {
            existing.asset_id = asset_id;
            existing.updated_at = updated_at;
          } else {
            this.audio_overrides.push({
              id,
              profile_id,
              clip_key,
              asset_id,
              created_at,
              updated_at,
            });
          }
        }
        return { success: true };
      },
    };
  }
  async batch() {
    return [];
  }
  async exec() {
    return { count: 0, duration: 0 };
  }
}

class FakeR2Bucket {
  public store = new Map<string, { body: ArrayBuffer; httpMetadata: any }>();

  async put(key: string, value: ArrayBuffer, opts: any) {
    this.store.set(key, { body: value, httpMetadata: opts?.httpMetadata });
  }

  async get(key: string) {
    const item = this.store.get(key);
    if (!item) return null;
    return {
      body: item.body,
    };
  }

  async delete(key: string) {
    this.store.delete(key);
  }
}

describe('Media and Upload API Routes', () => {
  let db: MediaTestD1;
  let fakeR2: FakeR2Bucket;
  let env: RuntimeEnv;
  let parentSessionCookie: string;
  const parentId = 'usr_media_parent';
  const profileId = 'prof_media_child';

  beforeEach(async () => {
    db = new MediaTestD1();
    fakeR2 = new FakeR2Bucket();
    env = {
      DB: db,
      MEDIA: fakeR2,
      APP_ENV: 'dev',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };
    setMockRuntimeEnv(env);

    // Seed parent user and session
    db.users.push({
      id: parentId,
      email: 'parent@example.com',
      stripe_customer_id: null,
      subscription_status: 'plus',
      created_at: 1000,
      updated_at: 1000,
    });
    const sessionHash = await sha256Hex('parent_tok_xyz');
    db.sessions.push({
      session_hash: sessionHash,
      user_id: parentId,
      expires_at: Date.now() + 86400000,
      created_at: 1000,
      last_seen_at: 1000,
    });
    parentSessionCookie = '__Host-foxwords_session=parent_tok_xyz';

    // Seed child profile with play code and token
    const tokenHash = await sha256Hex('play_token_emma');
    db.child_profiles.push({
      id: profileId,
      user_id: parentId,
      child_name: 'Emma',
      play_token_hash: tokenHash,
      play_code: 'EMMA12',
      created_at: 1000,
      updated_at: 1000,
    });
  });

  afterEach(() => {
    setMockRuntimeEnv(null);
  });

  it('uploads valid JPEG photo via multipart form data and saves to R2', async () => {
    // Valid JPEG magic bytes: FF D8 FF
    const jpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    const fileObj = {
      name: 'tractor.jpg',
      size: jpegBytes.length,
      type: 'image/jpeg',
      arrayBuffer: async () => jpegBytes.buffer,
    };

    const mockFormData = {
      get(key: string) {
        if (key === 'kind') return 'photo';
        if (key === 'file') return fileObj;
        return null;
      },
    };

    const req = new NextRequest(new URL(`http://localhost:8787/api/profiles/${profileId}/assets`), {
      method: 'POST',
      headers: new Headers({
        Origin: 'http://localhost:8787',
        Cookie: parentSessionCookie,
      }),
    });
    (req as any).formData = async () => mockFormData;

    const res = await uploadAsset(req, { params: Promise.resolve({ profileId }) });
    const data: any = await res.json();
    if (res.status !== 201) {
      throw new Error(`Upload failed: ${JSON.stringify(data)}`);
    }
    expect(res.status).toBe(201);
    expect(data.asset.kind).toBe('photo');
    expect(data.asset.contentType).toBe('image/jpeg');
    expect(db.media_assets).toHaveLength(1);
  });

  it('rejects upload with spoofed magic bytes or invalid kind', async () => {
    // Declares image/jpeg but contents are plain text
    const textBytes = new TextEncoder().encode('this is plain text not jpeg');
    const fileObj = {
      name: 'fake.jpg',
      size: textBytes.length,
      type: 'image/jpeg',
      arrayBuffer: async () => textBytes.buffer,
    };

    const mockFormData = {
      get(key: string) {
        if (key === 'kind') return 'photo';
        if (key === 'file') return fileObj;
        return null;
      },
    };

    const req = new NextRequest(new URL(`http://localhost:8787/api/profiles/${profileId}/assets`), {
      method: 'POST',
      headers: new Headers({
        Origin: 'http://localhost:8787',
        Cookie: parentSessionCookie,
      }),
    });
    (req as any).formData = async () => mockFormData;

    const res = await uploadAsset(req, { params: Promise.resolve({ profileId }) });
    expect(res.status).toBe(400);
    const data: any = await res.json();
    expect(data.error.code).toBe('invalid_request');
  });

  it('streams private play-token media asset and enforces profile ownership', async () => {
    // Seed media asset in DB and R2
    const assetId = 'ast_tractor_1';
    const r2Key = 'dev/prof_media_child/ast_tractor_1.jpg';
    const imgData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer;
    await fakeR2.put(r2Key, imgData, { httpMetadata: { contentType: 'image/jpeg' } });

    db.media_assets.push({
      id: assetId,
      profile_id: profileId,
      r2_key: r2Key,
      kind: 'photo',
      content_type: 'image/jpeg',
      byte_size: 4,
      created_at: 1000,
    });

    // Valid play token streams asset
    const validReq = new NextRequest(
      new URL(`http://localhost:8787/api/play/play_token_emma/assets/${assetId}`)
    );
    const validRes = await streamPlayAsset(validReq, {
      params: Promise.resolve({ token: 'play_token_emma', assetId }),
    });
    expect(validRes.status).toBe(200);
    expect(validRes.headers.get('Content-Type')).toBe('image/jpeg');
    expect(validRes.headers.get('X-Content-Type-Options')).toBe('nosniff');

    // Invalid play token returns 404 (does not disclose asset existence)
    const badTokenReq = new NextRequest(
      new URL(`http://localhost:8787/api/play/wrong_token/assets/${assetId}`)
    );
    const badTokenRes = await streamPlayAsset(badTokenReq, {
      params: Promise.resolve({ token: 'wrong_token', assetId }),
    });
    expect(badTokenRes.status).toBe(404);

    // Cross-tenant asset query (asking for non-owned asset) returns 404
    const foreignAssetReq = new NextRequest(
      new URL('http://localhost:8787/api/play/play_token_emma/assets/foreign_asset')
    );
    const foreignAssetRes = await streamPlayAsset(foreignAssetReq, {
      params: Promise.resolve({ token: 'play_token_emma', assetId: 'foreign_asset' }),
    });
    expect(foreignAssetRes.status).toBe(404);
  });

  it('manages audio overrides and enforces system-audio asset kind', async () => {
    // Create system-audio asset
    db.media_assets.push({
      id: 'ast_sys_audio',
      profile_id: profileId,
      r2_key: 'dev/prof_media_child/ast_sys_audio.webm',
      kind: 'system-audio',
      content_type: 'audio/webm',
      byte_size: 100,
      created_at: 1000,
    });

    // Create photo asset (wrong kind for audio override)
    db.media_assets.push({
      id: 'ast_photo_only',
      profile_id: profileId,
      r2_key: 'dev/prof_media_child/ast_photo_only.jpg',
      kind: 'photo',
      content_type: 'image/jpeg',
      byte_size: 100,
      created_at: 1000,
    });

    // Successfully set override with system-audio
    const putReq = new NextRequest(
      new URL(`http://localhost:8787/api/profiles/${profileId}/audio-overrides`),
      {
        method: 'PUT',
        headers: new Headers({
          Origin: 'http://localhost:8787',
          Cookie: parentSessionCookie,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          clipKey: 'clock:one-oclock',
          assetId: 'ast_sys_audio',
        }),
      }
    );
    const putRes = await setOverride(putReq, { params: Promise.resolve({ profileId }) });
    expect(putRes.status).toBe(200);

    // Reject override with photo asset
    const badKindReq = new NextRequest(
      new URL(`http://localhost:8787/api/profiles/${profileId}/audio-overrides`),
      {
        method: 'PUT',
        headers: new Headers({
          Origin: 'http://localhost:8787',
          Cookie: parentSessionCookie,
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          clipKey: 'clock:two-oclock',
          assetId: 'ast_photo_only',
        }),
      }
    );
    const badKindRes = await setOverride(badKindReq, { params: Promise.resolve({ profileId }) });
    expect(badKindRes.status).toBe(400);
  });
});
