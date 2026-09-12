import type { D1DatabaseLike, D1PreparedStatementLike } from '../client';
import { UserRepository } from '../repositories/users';
import { AuthRepository } from '../repositories/auth';
import { ProfileRepository } from '../repositories/profiles';
import { MediaRepository } from '../repositories/media';
import { RateLimitRepository } from '../repositories/rate-limits';

class FakeD1Database implements D1DatabaseLike {
  private tables = new Map<string, Array<Record<string, unknown>>>();

  constructor() {
    this.tables.set('users', []);
    this.tables.set('auth_tokens', []);
    this.tables.set('sessions', []);
    this.tables.set('child_profiles', []);
    this.tables.set('custom_words', []);
    this.tables.set('media_assets', []);
    this.tables.set('audio_overrides', []);
    this.tables.set('rate_limits', []);
  }

  prepare(query: string): D1PreparedStatementLike {
    const boundArgs: unknown[] = [];
    return {
      bind(...values: unknown[]) {
        boundArgs.push(...values);
        return this;
      },
      first: async <T>() => {
        const results = this.executeSql<T>(query, boundArgs);
        return results[0] ?? null;
      },
      all: async <T>() => {
        const results = this.executeSql<T>(query, boundArgs);
        return { results, success: true };
      },
      run: async () => {
        this.executeSql(query, boundArgs);
        return { success: true };
      },
    };
  }

  async batch<T>(statements: D1PreparedStatementLike[]): Promise<Array<{ results: T[]; success: boolean }>> {
    const out: Array<{ results: T[]; success: boolean }> = [];
    for (const stmt of statements) {
      const res = await stmt.all<T>();
      out.push(res);
    }
    return out;
  }

  async exec(_query: string) {
    return { count: 0, duration: 0 };
  }

  private executeSql<T>(query: string, args: unknown[]): T[] {
    const normalized = query.trim().replace(/\s+/g, ' ');

    // users
    if (normalized.startsWith('SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE id = ?')) {
      const id = args[0];
      return (this.tables.get('users')!.filter((u) => u.id === id) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE email = ?')) {
      const email = args[0];
      return (this.tables.get('users')!.filter((u) => u.email === email) as unknown[]) as T[];
    }
    if (normalized.startsWith('INSERT INTO users')) {
      const [id, email, stripe_customer_id, subscription_status, created_at, updated_at] = args;
      if (this.tables.get('users')!.some((u) => u.email === email)) {
        throw new Error('UNIQUE constraint failed: users.email');
      }
      this.tables.get('users')!.push({ id, email, stripe_customer_id, subscription_status, created_at, updated_at });
      return [];
    }
    if (normalized.startsWith('UPDATE users SET stripe_customer_id = ?, subscription_status = ?, updated_at = ? WHERE id = ?')) {
      const [stripe_customer_id, subscription_status, updated_at, id] = args;
      const user = this.tables.get('users')!.find((u) => u.id === id);
      if (user) {
        user.stripe_customer_id = stripe_customer_id;
        user.subscription_status = subscription_status;
        user.updated_at = updated_at;
      }
      return [];
    }

    // auth_tokens
    if (normalized.startsWith('INSERT INTO auth_tokens')) {
      const [token_hash, user_id, expires_at, created_at] = args;
      this.tables.get('auth_tokens')!.push({ token_hash, user_id, expires_at, used_at: null, created_at });
      return [];
    }
    if (normalized.startsWith('SELECT token_hash, user_id, expires_at, used_at, created_at FROM auth_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')) {
      const [token_hash, now] = args as [string, number];
      return (this.tables.get('auth_tokens')!.filter(
        (t) => t.token_hash === token_hash && t.used_at === null && (t.expires_at as number) > now
      ) as unknown[]) as T[];
    }
    if (normalized.startsWith('UPDATE auth_tokens SET used_at = ? WHERE token_hash = ?')) {
      const [used_at, token_hash] = args;
      const tok = this.tables.get('auth_tokens')!.find((t) => t.token_hash === token_hash);
      if (tok) tok.used_at = used_at;
      return [];
    }

    // sessions
    if (normalized.startsWith('INSERT INTO sessions')) {
      const [session_hash, user_id, expires_at, created_at, last_seen_at] = args;
      this.tables.get('sessions')!.push({ session_hash, user_id, expires_at, created_at, last_seen_at });
      return [];
    }
    if (normalized.startsWith('SELECT session_hash, user_id, expires_at, created_at, last_seen_at FROM sessions WHERE session_hash = ? AND expires_at > ?')) {
      const [session_hash, now] = args as [string, number];
      return (this.tables.get('sessions')!.filter(
        (s) => s.session_hash === session_hash && (s.expires_at as number) > now
      ) as unknown[]) as T[];
    }
    if (normalized.startsWith('UPDATE sessions SET last_seen_at = ? WHERE session_hash = ?')) {
      const [last_seen_at, session_hash] = args;
      const sess = this.tables.get('sessions')!.find((s) => s.session_hash === session_hash);
      if (sess) sess.last_seen_at = last_seen_at;
      return [];
    }
    if (normalized.startsWith('DELETE FROM sessions WHERE session_hash = ?')) {
      const [session_hash] = args;
      const filtered = this.tables.get('sessions')!.filter((s) => s.session_hash !== session_hash);
      this.tables.set('sessions', filtered);
      return [];
    }

    // child_profiles
    if (normalized.startsWith('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE user_id = ?')) {
      const [user_id] = args;
      return (this.tables.get('child_profiles')!.filter((p) => p.user_id === user_id) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE id = ? AND user_id = ?')) {
      const [id, user_id] = args;
      return (this.tables.get('child_profiles')!.filter((p) => p.id === id && p.user_id === user_id) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_token_hash = ?')) {
      const [hash] = args;
      return (this.tables.get('child_profiles')!.filter((p) => p.play_token_hash === hash) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, user_id, child_name, play_token_hash, play_code, created_at, updated_at FROM child_profiles WHERE play_code = ?')) {
      const [code] = args;
      return (this.tables.get('child_profiles')!.filter((p) => p.play_code === code) as unknown[]) as T[];
    }
    if (normalized.startsWith('INSERT INTO child_profiles')) {
      const [id, user_id, child_name, play_token_hash, play_code, created_at, updated_at] = args;
      this.tables.get('child_profiles')!.push({ id, user_id, child_name, play_token_hash, play_code, created_at, updated_at });
      return [];
    }
    if (normalized.startsWith('UPDATE child_profiles SET child_name = ?, play_token_hash = ?, play_code = ?, updated_at = ? WHERE id = ? AND user_id = ?')) {
      const [child_name, play_token_hash, play_code, updated_at, id, user_id] = args;
      const prof = this.tables.get('child_profiles')!.find((p) => p.id === id && p.user_id === user_id);
      if (prof) {
        prof.child_name = child_name;
        prof.play_token_hash = play_token_hash;
        prof.play_code = play_code;
        prof.updated_at = updated_at;
      }
      return [];
    }
    if (normalized.startsWith('DELETE FROM child_profiles WHERE id = ? AND user_id = ?')) {
      const [id, user_id] = args;
      const filtered = this.tables.get('child_profiles')!.filter((p) => !(p.id === id && p.user_id === user_id));
      this.tables.set('child_profiles', filtered);
      return [];
    }

    // custom_words
    if (normalized.startsWith('SELECT id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at FROM custom_words WHERE profile_id = ?')) {
      const [profile_id] = args;
      return (this.tables.get('custom_words')!.filter((w) => w.profile_id === profile_id) as unknown[]) as T[];
    }
    if (normalized.startsWith('INSERT INTO custom_words')) {
      const [id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at] = args;
      this.tables.get('custom_words')!.push({
        id, profile_id, word, category, prompt_label, prompt_emoji, photo_asset_id, audio_asset_id, sort_order, created_at, updated_at
      });
      return [];
    }
    if (normalized.startsWith('DELETE FROM custom_words WHERE id = ? AND profile_id = ?')) {
      const [id, profile_id] = args;
      const filtered = this.tables.get('custom_words')!.filter((w) => !(w.id === id && w.profile_id === profile_id));
      this.tables.set('custom_words', filtered);
      return [];
    }

    // media_assets
    if (normalized.startsWith('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE id = ? AND profile_id = ?')) {
      const [id, profile_id] = args;
      return (this.tables.get('media_assets')!.filter((m) => m.id === id && m.profile_id === profile_id) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE id = ?')) {
      const [id] = args;
      return (this.tables.get('media_assets')!.filter((m) => m.id === id) as unknown[]) as T[];
    }
    if (normalized.startsWith('SELECT id, profile_id, r2_key, kind, content_type, byte_size, created_at FROM media_assets WHERE profile_id = ?')) {
      const [profile_id] = args;
      return (this.tables.get('media_assets')!.filter((m) => m.profile_id === profile_id) as unknown[]) as T[];
    }
    if (normalized.startsWith('INSERT INTO media_assets')) {
      const [id, profile_id, r2_key, kind, content_type, byte_size, created_at] = args;
      this.tables.get('media_assets')!.push({ id, profile_id, r2_key, kind, content_type, byte_size, created_at });
      return [];
    }
    if (normalized.startsWith('DELETE FROM media_assets WHERE id = ? AND profile_id = ?')) {
      const [id, profile_id] = args;
      const filtered = this.tables.get('media_assets')!.filter((m) => !(m.id === id && m.profile_id === profile_id));
      this.tables.set('media_assets', filtered);
      return [];
    }

    // audio_overrides
    if (normalized.startsWith('SELECT id, profile_id, clip_key, asset_id, created_at, updated_at FROM audio_overrides WHERE profile_id = ? AND clip_key = ?')) {
      const [profile_id, clip_key] = args;
      return (this.tables.get('audio_overrides')!.filter((a) => a.profile_id === profile_id && a.clip_key === clip_key) as unknown[]) as T[];
    }
    if (normalized.includes('INSERT INTO audio_overrides')) {
      const [id, profile_id, clip_key, asset_id, created_at, updated_at] = args;
      const existing = this.tables.get('audio_overrides')!.find((a) => a.profile_id === profile_id && a.clip_key === clip_key);
      if (existing) {
        existing.asset_id = asset_id;
        existing.updated_at = updated_at;
      } else {
        this.tables.get('audio_overrides')!.push({ id, profile_id, clip_key, asset_id, created_at, updated_at });
      }
      return [];
    }

    // rate_limits
    if (normalized.startsWith('SELECT bucket, window_started_at, request_count FROM rate_limits WHERE bucket = ?')) {
      const [bucket] = args;
      return (this.tables.get('rate_limits')!.filter((r) => r.bucket === bucket) as unknown[]) as T[];
    }
    if (normalized.includes('INSERT INTO rate_limits')) {
      const [bucket, window_started_at] = args;
      const existing = this.tables.get('rate_limits')!.find((r) => r.bucket === bucket);
      if (existing) {
        existing.window_started_at = window_started_at;
        existing.request_count = 1;
      } else {
        this.tables.get('rate_limits')!.push({ bucket, window_started_at, request_count: 1 });
      }
      return [];
    }
    if (normalized.startsWith('UPDATE rate_limits SET request_count = request_count + 1 WHERE bucket = ?')) {
      const [bucket] = args;
      const existing = this.tables.get('rate_limits')!.find((r) => r.bucket === bucket);
      if (existing) existing.request_count = (existing.request_count as number) + 1;
      return [];
    }

    throw new Error(`Unhandled SQL query in fake D1: ${normalized}`);
  }
}

describe('Foxwords D1 Repositories', () => {
  let db: FakeD1Database;
  let userRepo: UserRepository;
  let authRepo: AuthRepository;
  let profileRepo: ProfileRepository;
  let mediaRepo: MediaRepository;
  let rateLimitRepo: RateLimitRepository;

  beforeEach(() => {
    db = new FakeD1Database();
    userRepo = new UserRepository(db);
    authRepo = new AuthRepository(db);
    profileRepo = new ProfileRepository(db);
    mediaRepo = new MediaRepository(db);
    rateLimitRepo = new RateLimitRepository(db);
  });

  describe('UserRepository', () => {
    it('creates and finds users by email with normalized case', async () => {
      const user = await userRepo.create({
        id: 'usr_123',
        email: 'Parent@Example.COM',
      });
      expect(user.email).toBe('parent@example.com');
      expect(user.subscription_status).toBe('plus');

      const found = await userRepo.findByEmail('parent@example.com');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('usr_123');
    });

    it('rejects duplicate emails with constraint failure', async () => {
      await userRepo.create({ id: 'usr_1', email: 'test@example.com' });
      await expect(userRepo.create({ id: 'usr_2', email: 'test@example.com' })).rejects.toThrow(
        /UNIQUE constraint/
      );
    });

    it('supports free status and optional stripe_customer_id', async () => {
      const user = await userRepo.create({
        id: 'usr_free',
        email: 'free@example.com',
        subscriptionStatus: 'free',
        stripeCustomerId: null,
      });
      expect(user.subscription_status).toBe('free');
      expect(user.stripe_customer_id).toBeNull();
    });
  });

  describe('AuthRepository', () => {
    it('creates, verifies and consumes single-use auth tokens', async () => {
      const now = Date.now();
      const expiresAt = now + 15 * 60 * 1000;
      await authRepo.createToken('hash_token_abc', 'usr_123', expiresAt);

      const valid = await authRepo.findValidToken('hash_token_abc', now);
      expect(valid).not.toBeNull();
      expect(valid?.user_id).toBe('usr_123');

      await authRepo.markTokenUsed('hash_token_abc', now);

      const used = await authRepo.findValidToken('hash_token_abc', now);
      expect(used).toBeNull();
    });

    it('returns null for expired auth tokens', async () => {
      const now = Date.now();
      await authRepo.createToken('hash_token_exp', 'usr_123', now - 1000);
      const res = await authRepo.findValidToken('hash_token_exp', now);
      expect(res).toBeNull();
    });

    it('creates, looks up, and deletes sessions', async () => {
      const now = Date.now();
      await authRepo.createSession('sess_hash_1', 'usr_123', now + 86400000);

      const session = await authRepo.findValidSession('sess_hash_1', now);
      expect(session).not.toBeNull();
      expect(session?.user_id).toBe('usr_123');

      await authRepo.deleteSession('sess_hash_1');
      const deleted = await authRepo.findValidSession('sess_hash_1', now);
      expect(deleted).toBeNull();
    });
  });

  describe('ProfileRepository', () => {
    it('enforces profile ownership between users', async () => {
      await profileRepo.create({
        id: 'prof_1',
        userId: 'usr_owner',
        childName: 'James',
        playTokenHash: 'play_hash_1',
        playCode: 'FOX123',
      });

      // Owner can find it
      const owned = await profileRepo.findOwnedById('usr_owner', 'prof_1');
      expect(owned).not.toBeNull();
      expect(owned?.child_name).toBe('James');

      // Another user cannot find or mutate it
      const stranger = await profileRepo.findOwnedById('usr_stranger', 'prof_1');
      expect(stranger).toBeNull();

      const patchResult = await profileRepo.updateOwned('usr_stranger', 'prof_1', { childName: 'Hacked' });
      expect(patchResult).toBeNull();

      const deleted = await profileRepo.deleteOwned('usr_stranger', 'prof_1');
      expect(deleted).toBe(false);
    });

    it('can find profiles by public play token hash or play code', async () => {
      await profileRepo.create({
        id: 'prof_public',
        userId: 'usr_1',
        childName: 'Sarah',
        playTokenHash: 'hash_abc',
        playCode: 'SARAH1',
      });

      const byHash = await profileRepo.findByPlayTokenHash('hash_abc');
      expect(byHash?.id).toBe('prof_public');

      const byCode = await profileRepo.findByPlayCode('sarah1'); // Case-insensitive normalized
      expect(byCode?.id).toBe('prof_public');
    });

    it('creates and lists custom words for a profile', async () => {
      await profileRepo.create({
        id: 'prof_words',
        userId: 'usr_1',
        childName: 'Leo',
        playTokenHash: 'hash_leo',
        playCode: 'LEO123',
      });

      const word = await profileRepo.createWord('usr_1', {
        id: 'w_1',
        profileId: 'prof_words',
        word: 'TRACTOR',
        category: 'toy',
        promptLabel: 'Green Tractor',
      });
      expect(word).not.toBeNull();
      expect(word?.word).toBe('TRACTOR');

      const words = await profileRepo.listWordsForProfile('prof_words');
      expect(words).toHaveLength(1);

      // Non-owner cannot create words for Leo
      const unauthorized = await profileRepo.createWord('usr_2', {
        id: 'w_2',
        profileId: 'prof_words',
        word: 'TRAIN',
        category: 'toy',
        promptLabel: 'Red Train',
      });
      expect(unauthorized).toBeNull();
    });
  });

  describe('MediaRepository', () => {
    it('creates, isolates, and fetches profile media assets', async () => {
      const asset = await mediaRepo.create({
        id: 'asset_1',
        profileId: 'prof_1',
        r2Key: 'dev/prof_1/asset_1',
        kind: 'photo',
        contentType: 'image/jpeg',
        byteSize: 1024,
      });
      expect(asset.r2_key).toBe('dev/prof_1/asset_1');

      const found = await mediaRepo.findOwnedById('prof_1', 'asset_1');
      expect(found).not.toBeNull();

      // Isolated from other profiles
      const foreign = await mediaRepo.findOwnedById('prof_2', 'asset_1');
      expect(foreign).toBeNull();
    });

    it('manages audio overrides with upsert semantics', async () => {
      await mediaRepo.setAudioOverride('ov_1', 'prof_1', 'word:cat', 'asset_audio_1');
      const initial = await mediaRepo.getAudioOverride('prof_1', 'word:cat');
      expect(initial?.asset_id).toBe('asset_audio_1');

      await mediaRepo.setAudioOverride('ov_2', 'prof_1', 'word:cat', 'asset_audio_2');
      const updated = await mediaRepo.getAudioOverride('prof_1', 'word:cat');
      expect(updated?.asset_id).toBe('asset_audio_2');
    });
  });

  describe('RateLimitRepository', () => {
    it('allows requests within window and limits beyond capacity', async () => {
      const now = 1000000;
      const windowMs = 60000;
      const maxRequests = 3;

      expect(await rateLimitRepo.consume('ip_1', windowMs, maxRequests, now)).toBe(true);
      expect(await rateLimitRepo.consume('ip_1', windowMs, maxRequests, now + 1000)).toBe(true);
      expect(await rateLimitRepo.consume('ip_1', windowMs, maxRequests, now + 2000)).toBe(true);
      // 4th request in same window fails
      expect(await rateLimitRepo.consume('ip_1', windowMs, maxRequests, now + 3000)).toBe(false);

      // After window passes, bucket resets
      expect(await rateLimitRepo.consume('ip_1', windowMs, maxRequests, now + 65000)).toBe(true);
    });
  });
});
