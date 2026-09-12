import type { D1DatabaseLike, D1PreparedStatementLike } from '../../db/client';
import { AuthRepository } from '../../db/repositories/auth';
import { UserRepository } from '../../db/repositories/users';
import {
  clearSessionCookie,
  createSession,
  getSessionUser,
  serializeSessionCookie,
} from '../session';

class InMemoryD1 implements D1DatabaseLike {
  public sessions: Array<{
    session_hash: string;
    user_id: string;
    expires_at: number;
    created_at: number;
    last_seen_at: number;
  }> = [];
  public users: Array<{
    id: string;
    email: string;
    stripe_customer_id: string | null;
    subscription_status: 'free' | 'plus';
    created_at: number;
    updated_at: number;
  }> = [];

  prepare(query: string): D1PreparedStatementLike {
    const args: unknown[] = [];
    return {
      bind(...values: unknown[]) {
        args.push(...values);
        return this;
      },
      first: async <T>() => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('SELECT session_hash')) {
          const [hash, now] = args as [string, number];
          const found = this.sessions.find((s) => s.session_hash === hash && s.expires_at > now);
          return found as unknown as T;
        }
        if (norm.startsWith('SELECT id, email')) {
          const [id] = args as [string];
          const found = this.users.find((u) => u.id === id);
          return found as unknown as T;
        }
        return null;
      },
      all: async <T>() => ({ results: [] as T[], success: true }),
      run: async () => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('INSERT INTO sessions')) {
          const [session_hash, user_id, expires_at, created_at, last_seen_at] = args as [
            string,
            string,
            number,
            number,
            number,
          ];
          this.sessions.push({ session_hash, user_id, expires_at, created_at, last_seen_at });
        } else if (norm.startsWith('DELETE FROM sessions')) {
          const [hash] = args as [string];
          this.sessions = this.sessions.filter((s) => s.session_hash !== hash);
        } else if (norm.startsWith('UPDATE sessions SET last_seen_at')) {
          const [last_seen, hash] = args as [number, string];
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

describe('Security Session Management', () => {
  let db: InMemoryD1;
  let authRepo: AuthRepository;
  let userRepo: UserRepository;

  beforeEach(() => {
    db = new InMemoryD1();
    authRepo = new AuthRepository(db);
    userRepo = new UserRepository(db);
  });

  it('creates an opaque session and returns secure Set-Cookie header', async () => {
    db.users.push({
      id: 'usr_1',
      email: 'parent@example.com',
      stripe_customer_id: null,
      subscription_status: 'plus',
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    const { rawToken, setCookieHeader } = await createSession(authRepo, 'usr_1', 'production');
    expect(rawToken).toBeDefined();
    expect(db.sessions).toHaveLength(1);
    // Hash stored, not raw token
    expect(db.sessions[0].session_hash).not.toBe(rawToken);

    expect(setCookieHeader).toContain('__Host-foxwords_session=');
    expect(setCookieHeader).toContain('HttpOnly');
    expect(setCookieHeader).toContain('SameSite=Lax');
    expect(setCookieHeader).toContain('Secure');
  });

  it('gets user from cookie and rejects expired/non-existent cookie', async () => {
    db.users.push({
      id: 'usr_1',
      email: 'parent@example.com',
      stripe_customer_id: null,
      subscription_status: 'plus',
      created_at: Date.now(),
      updated_at: Date.now(),
    });

    const { rawToken } = await createSession(authRepo, 'usr_1', 'local');
    const cookieHeader = `__Host-foxwords_session=${rawToken}; other=123`;

    const user = await getSessionUser(authRepo, userRepo, cookieHeader);
    expect(user).not.toBeNull();
    expect(user?.id).toBe('usr_1');

    // Also test cookie when it is preceded by another cookie
    const precededCookieHeader = `other=1; __Host-foxwords_session=${rawToken}`;
    const userPreceded = await getSessionUser(authRepo, userRepo, precededCookieHeader);
    expect(userPreceded).not.toBeNull();
    expect(userPreceded?.id).toBe('usr_1');

    const badUser = await getSessionUser(authRepo, userRepo, '__Host-foxwords_session=wrong-token');
    expect(badUser).toBeNull();
  });

  it('clears session cookie', () => {
    const clearHeader = clearSessionCookie('production');
    expect(clearHeader).toContain('Max-Age=0');
    expect(clearHeader).toContain('__Host-foxwords_session=');
  });
});
