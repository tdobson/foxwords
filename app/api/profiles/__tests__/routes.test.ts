import { NextRequest } from 'next/server';
import { type RuntimeEnv, setMockRuntimeEnv } from '../../../../lib/cloudflare-context';
import type { D1DatabaseLike, D1PreparedStatementLike } from '../../../../lib/db/client';
import { sha256Hex } from '../../../../lib/security/crypto';
import { GET as getPublicPlay } from '../../play/[token]/route';
import { POST as resolvePlayCode } from '../../play/resolve/route';
import { POST as rotateCredentials } from '../[profileId]/credentials/rotate/route';
import { DELETE as deleteItem } from '../[profileId]/items/[itemId]/route';
import { POST as createItem, GET as listItems } from '../[profileId]/items/route';
import {
  DELETE as deleteProfile,
  GET as getProfile,
  PATCH as updateProfile,
} from '../[profileId]/route';
import { POST as createProfile, GET as listProfiles } from '../route';

class ProfileTestD1 implements D1DatabaseLike {
  public users: any[] = [];
  public auth_tokens: any[] = [];
  public sessions: any[] = [];
  public child_profiles: any[] = [];
  public custom_words: any[] = [];
  public media_assets: any[] = [];
  public audio_overrides: any[] = [];
  public rate_limits: any[] = [];

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
        if (norm.includes('INSERT INTO rate_limits')) {
          const [bucket, now, _now2, windowMs, maxRequests] = boundArgs as [
            string,
            number,
            number,
            number,
            number,
          ];
          const existing = this.rate_limits.find((r) => r.bucket === bucket);
          if (!existing || now - existing.window_started_at > windowMs) {
            if (existing) {
              existing.window_started_at = now;
              existing.request_count = 1;
            } else {
              this.rate_limits.push({ bucket, window_started_at: now, request_count: 1 });
            }
            return { request_count: 1 } as unknown as T;
          }
          if (existing.request_count < maxRequests) {
            existing.request_count += 1;
            return { request_count: existing.request_count } as unknown as T;
          }
          return null;
        }
        if (
          norm.startsWith('DELETE FROM custom_words WHERE id = ? AND profile_id = ? RETURNING id')
        ) {
          const [id, profile_id] = boundArgs as [string, string];
          const idx = this.custom_words.findIndex(
            (w) => w.id === id && w.profile_id === profile_id
          );
          if (idx !== -1) {
            this.custom_words.splice(idx, 1);
            return { id } as unknown as T;
          }
          return null;
        }
        return null;
      },
      all: async <T>() => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (
          norm.startsWith(
            'SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE user_id = ?'
          )
        ) {
          const [user_id] = boundArgs as [string];
          const res = this.child_profiles.filter((p) => p.user_id === user_id);
          return { results: res as unknown as T[], success: true };
        }
        if (
          norm.startsWith(
            'SELECT id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at FROM custom_words WHERE profile_id = ?'
          )
        ) {
          const [profile_id] = boundArgs as [string];
          const res = this.custom_words.filter((w) => w.profile_id === profile_id);
          return { results: res as unknown as T[], success: true };
        }
        if (
          norm.startsWith(
            'SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE profile_id = ?'
          )
        ) {
          const [profile_id] = boundArgs as [string];
          const res = this.media_assets.filter((a) => a.profile_id === profile_id);
          return { results: res as unknown as T[], success: true };
        }
        return { results: [] as T[], success: true };
      },
      run: async () => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('INSERT INTO child_profiles')) {
          const [id, user_id, child_name, play_token_hash, play_code, created_at, updated_at] =
            boundArgs;
          this.child_profiles.push({
            id,
            user_id,
            child_name,
            play_token_hash,
            play_code,
            created_at,
            updated_at,
          });
        } else if (
          norm.startsWith(
            'UPDATE child_profiles SET child_name = ?, play_token_hash = ?, play_code = ?, updated_at = ? WHERE id = ? AND user_id = ?'
          )
        ) {
          const [child_name, play_token_hash, play_code, updated_at, id, user_id] = boundArgs;
          const prof = this.child_profiles.find((p) => p.id === id && p.user_id === user_id);
          if (prof) {
            prof.child_name = child_name;
            prof.play_token_hash = play_token_hash;
            prof.play_code = play_code;
            prof.updated_at = updated_at;
          }
        } else if (norm.startsWith('DELETE FROM child_profiles WHERE id = ? AND user_id = ?')) {
          const [id, user_id] = boundArgs;
          this.child_profiles = this.child_profiles.filter(
            (p) => !(p.id === id && p.user_id === user_id)
          );
        } else if (norm.startsWith('INSERT INTO custom_words')) {
          const [
            id,
            profile_id,
            word,
            category,
            prompt_label,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            sort_order,
            created_at,
            updated_at,
          ] = boundArgs;
          this.custom_words.push({
            id,
            profile_id,
            word,
            category,
            prompt_label,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            sort_order,
            created_at,
            updated_at,
          });
        } else if (norm.startsWith('UPDATE sessions SET last_seen_at')) {
          const [last_seen, hash] = boundArgs as [number, string];
          const s = this.sessions.find((sess) => sess.session_hash === hash);
          if (s) s.last_seen_at = last_seen;
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

function createReq(
  url: string,
  init: { method?: string; headers?: Record<string, string>; body?: any } = {}
): NextRequest {
  const headers = new Headers(init.headers);
  const method = init.method ?? 'GET';
  let bodyStr: string | undefined;
  if (init.body !== undefined) {
    bodyStr = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  return new NextRequest(new URL(url, 'http://localhost:8787'), {
    method,
    headers,
    body: bodyStr,
  });
}

describe('Profile and Child-Play API Routes', () => {
  let db: ProfileTestD1;
  let env: RuntimeEnv;
  let parentSessionCookie: string;
  const parentId = 'usr_parent_1';
  const strangerId = 'usr_stranger_2';

  beforeEach(async () => {
    db = new ProfileTestD1();
    env = {
      DB: db,
      APP_ENV: 'local',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };
    setMockRuntimeEnv(env);

    // Seed users
    db.users.push({
      id: parentId,
      email: 'parent@example.com',
      stripe_customer_id: null,
      subscription_status: 'plus',
      created_at: 1000,
      updated_at: 1000,
    });
    db.users.push({
      id: strangerId,
      email: 'stranger@example.com',
      stripe_customer_id: null,
      subscription_status: 'plus',
      created_at: 1000,
      updated_at: 1000,
    });

    // Create session for parent
    const rawSessionToken = 'valid_parent_session_token_123';
    const sessionHash = await sha256Hex(rawSessionToken);
    db.sessions.push({
      session_hash: sessionHash,
      user_id: parentId,
      expires_at: Date.now() + 86400000,
      created_at: 1000,
      last_seen_at: 1000,
    });
    parentSessionCookie = `__Host-foxwords_session=${rawSessionToken}`;
  });

  afterEach(() => {
    setMockRuntimeEnv(null);
  });

  describe('Unauthenticated and Cross-Origin Protection', () => {
    it('returns 401 for profile operations without session cookie', async () => {
      const getRes = await listProfiles(createReq('http://localhost:8787/api/profiles'));
      expect(getRes.status).toBe(401);

      const postRes = await createProfile(
        createReq('http://localhost:8787/api/profiles', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787' },
          body: { childName: 'Leo' },
        })
      );
      expect(postRes.status).toBe(401);
    });

    it('returns 403 for mutations with cross-origin header', async () => {
      const postRes = await createProfile(
        createReq('http://localhost:8787/api/profiles', {
          method: 'POST',
          headers: { Origin: 'https://evil.site', Cookie: parentSessionCookie },
          body: { childName: 'Leo' },
        })
      );
      expect(postRes.status).toBe(403);
    });
  });

  describe('Profile CRUD', () => {
    it('creates child profile, assigns playCode and opaque token, and lists it', async () => {
      const createRes = await createProfile(
        createReq('http://localhost:8787/api/profiles', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { childName: 'Leo' },
        })
      );
      expect(createRes.status).toBe(201);
      const data: any = await createRes.json();
      expect(data.profile.childName).toBe('Leo');
      expect(data.profile.playCode).toHaveLength(6);
      expect(data.profile.rawPlayToken).toBeDefined();

      const listRes = await listProfiles(
        createReq('http://localhost:8787/api/profiles', {
          headers: { Cookie: parentSessionCookie },
        })
      );
      expect(listRes.status).toBe(200);
      const listData: any = await listRes.json();
      expect(listData.profiles).toHaveLength(1);
      expect(listData.profiles[0].childName).toBe('Leo');
      // Lists do not expose raw play token
      expect(listData.profiles[0].rawPlayToken).toBeUndefined();
    });

    it('returns 400 when child name is empty or too long', async () => {
      const res1 = await createProfile(
        createReq('http://localhost:8787/api/profiles', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { childName: '' },
        })
      );
      expect(res1.status).toBe(400);

      const res2 = await createProfile(
        createReq('http://localhost:8787/api/profiles', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { childName: 'A'.repeat(33) },
        })
      );
      expect(res2.status).toBe(400);
    });

    it('returns 404 when addressing a profile belonging to another user', async () => {
      // Seed a profile owned by stranger
      db.child_profiles.push({
        id: 'prof_stranger',
        user_id: strangerId,
        child_name: 'Stranger Child',
        play_token_hash: 'stranger_hash',
        play_code: 'STRNG1',
        created_at: 1000,
        updated_at: 1000,
      });

      const getRes = await getProfile(
        createReq('http://localhost:8787/api/profiles/prof_stranger', {
          headers: { Cookie: parentSessionCookie },
        }),
        { params: Promise.resolve({ profileId: 'prof_stranger' }) }
      );
      expect(getRes.status).toBe(404);

      const patchRes = await updateProfile(
        createReq('http://localhost:8787/api/profiles/prof_stranger', {
          method: 'PATCH',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { childName: 'Hacked' },
        }),
        { params: Promise.resolve({ profileId: 'prof_stranger' }) }
      );
      expect(patchRes.status).toBe(404);

      const deleteRes = await deleteProfile(
        createReq('http://localhost:8787/api/profiles/prof_stranger', {
          method: 'DELETE',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
        }),
        { params: Promise.resolve({ profileId: 'prof_stranger' }) }
      );
      expect(deleteRes.status).toBe(404);
    });

    it('updates and deletes owned profile', async () => {
      db.child_profiles.push({
        id: 'prof_owned',
        user_id: parentId,
        child_name: 'Alice',
        play_token_hash: 'alice_hash',
        play_code: 'ALICE1',
        created_at: 1000,
        updated_at: 1000,
      });

      const patchRes = await updateProfile(
        createReq('http://localhost:8787/api/profiles/prof_owned', {
          method: 'PATCH',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { childName: 'Alice Updated' },
        }),
        { params: Promise.resolve({ profileId: 'prof_owned' }) }
      );
      expect(patchRes.status).toBe(200);
      const patchData: any = await patchRes.json();
      expect(patchData.profile.childName).toBe('Alice Updated');

      const delRes = await deleteProfile(
        createReq('http://localhost:8787/api/profiles/prof_owned', {
          method: 'DELETE',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
        }),
        { params: Promise.resolve({ profileId: 'prof_owned' }) }
      );
      expect(delRes.status).toBe(200);
      expect(db.child_profiles).toHaveLength(0);
    });

    it('rotates credentials and invalidates old token', async () => {
      db.child_profiles.push({
        id: 'prof_rot',
        user_id: parentId,
        child_name: 'Bob',
        play_token_hash: 'old_hash',
        play_code: 'OLDCOD',
        created_at: 1000,
        updated_at: 1000,
      });

      const rotRes = await rotateCredentials(
        createReq('http://localhost:8787/api/profiles/prof_rot/credentials/rotate', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
        }),
        { params: Promise.resolve({ profileId: 'prof_rot' }) }
      );
      expect(rotRes.status).toBe(200);
      const data: any = await rotRes.json();
      expect(data.profile.playCode).not.toBe('OLDCOD');
      expect(data.profile.rawPlayToken).toBeDefined();

      const profileRow = db.child_profiles.find((p) => p.id === 'prof_rot');
      expect(profileRow.play_code).toBe(data.profile.playCode);
      expect(profileRow.play_token_hash).not.toBe('old_hash');
    });
  });

  describe('Custom Items API', () => {
    beforeEach(() => {
      db.child_profiles.push({
        id: 'prof_items',
        user_id: parentId,
        child_name: 'Charlie',
        play_token_hash: 'charlie_hash',
        play_code: 'CHARL1',
        created_at: 1000,
        updated_at: 1000,
      });
    });

    it('creates and deletes custom item for owned profile', async () => {
      const createRes = await createItem(
        createReq('http://localhost:8787/api/profiles/prof_items/items', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: {
            word: 'TRAIN',
            category: 'toy',
            promptLabel: 'Blue Train',
            promptEmoji: '🚂',
          },
        }),
        { params: Promise.resolve({ profileId: 'prof_items' }) }
      );
      expect(createRes.status).toBe(201);
      const data: any = await createRes.json();
      expect(data.item.word).toBe('TRAIN');
      expect(data.item.category).toBe('toy');

      const itemId = data.item.id;
      const delRes = await deleteItem(
        createReq(`http://localhost:8787/api/profiles/prof_items/items/${itemId}`, {
          method: 'DELETE',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
        }),
        { params: Promise.resolve({ profileId: 'prof_items', itemId }) }
      );
      expect(delRes.status).toBe(200);
      expect(db.custom_words).toHaveLength(0);
    });

    it('rejects invalid category or invalid word characters', async () => {
      const badCatRes = await createItem(
        createReq('http://localhost:8787/api/profiles/prof_items/items', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { word: 'DOG', category: 'invalid_cat', promptLabel: 'Dog' },
        }),
        { params: Promise.resolve({ profileId: 'prof_items' }) }
      );
      expect(badCatRes.status).toBe(400);

      const badWordRes = await createItem(
        createReq('http://localhost:8787/api/profiles/prof_items/items', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787', Cookie: parentSessionCookie },
          body: { word: 'DOG 123', category: 'pet', promptLabel: 'Dog' },
        }),
        { params: Promise.resolve({ profileId: 'prof_items' }) }
      );
      expect(badWordRes.status).toBe(400);
    });
  });

  describe('Public Play & Code Resolution', () => {
    beforeEach(async () => {
      const tokenHash = await sha256Hex('raw_child_play_token_xyz');
      db.child_profiles.push({
        id: 'prof_play',
        user_id: parentId,
        child_name: 'Emma',
        play_token_hash: tokenHash,
        play_code: 'EMMA99',
        created_at: 1000,
        updated_at: 1000,
      });

      db.custom_words.push({
        id: 'cw_1',
        profile_id: 'prof_play',
        word: 'KITTEN',
        category: 'pet',
        prompt_label: 'Little Kitten',
        prompt_emoji: '🐱',
        photo_asset_id: null,
        audio_asset_id: null,
        sort_order: 1,
        created_at: 1000,
        updated_at: 1000,
      });
    });

    it('resolves valid code and returns 404 on bad code', async () => {
      const goodRes = await resolvePlayCode(
        createReq('http://localhost:8787/api/play/resolve', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787' },
          body: { code: 'emma-99' }, // tests hyphen normalization
        })
      );
      expect(goodRes.status).toBe(200);
      const data: any = await goodRes.json();
      expect(data.play.childName).toBe('Emma');
      expect(data.play.playCode).toBe('EMMA99');

      const badRes = await resolvePlayCode(
        createReq('http://localhost:8787/api/play/resolve', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787' },
          body: { code: 'BAD999' },
        })
      );
      expect(badRes.status).toBe(404);
    });

    it('serves public play payload by token and excludes sensitive internal fields', async () => {
      const playRes = await getPublicPlay(
        createReq('http://localhost:8787/api/play/raw_child_play_token_xyz'),
        { params: Promise.resolve({ token: 'raw_child_play_token_xyz' }) }
      );
      expect(playRes.status).toBe(200);
      const payload: any = await playRes.json();
      expect(payload.childName).toBe('Emma');
      expect(payload.words[0].word).toBe('KITTEN');

      const serialized = JSON.stringify(payload);
      expect(serialized).not.toContain('parent@example.com');
      expect(serialized).not.toContain('user_id');
      expect(serialized).not.toContain('subscription');
      expect(serialized).not.toContain('play_token_hash');
    });

    it('returns 404 for unknown play token', async () => {
      const notFoundRes = await getPublicPlay(
        createReq('http://localhost:8787/api/play/nonexistent_token'),
        { params: Promise.resolve({ token: 'nonexistent_token' }) }
      );
      expect(notFoundRes.status).toBe(404);
    });
  });
});
