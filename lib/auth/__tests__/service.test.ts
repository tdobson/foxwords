import type { D1DatabaseLike, D1PreparedStatementLike } from '../../db/client';
import type { RuntimeEnv } from '../../cloudflare-context';
import { AuthService } from '../service';
import { defaultLocalMailSink } from '../../email/ses';

class FakeD1 implements D1DatabaseLike {
  public users: any[] = [];
  public auth_tokens: any[] = [];
  public sessions: any[] = [];
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
        if (norm.startsWith('SELECT id, email')) {
          const [email] = boundArgs as [string];
          const found = this.users.find((u) => u.email === email);
          return (found as unknown) as T;
        }
        if (norm.includes('INSERT INTO rate_limits')) {
          const [bucket, now, _now2, windowMs, maxRequests] = boundArgs as [string, number, number, number, number];
          const existing = this.rate_limits.find((r) => r.bucket === bucket);
          if (!existing || now - existing.window_started_at > windowMs) {
            if (existing) {
              existing.window_started_at = now;
              existing.request_count = 1;
            } else {
              this.rate_limits.push({ bucket, window_started_at: now, request_count: 1 });
            }
            return ({ request_count: 1 } as unknown) as T;
          }
          if (existing.request_count < maxRequests) {
            existing.request_count += 1;
            return ({ request_count: existing.request_count } as unknown) as T;
          }
          return null;
        }
        if (norm.startsWith('UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?')) {
          const [used_at, token_hash, now] = boundArgs as [number, string, number];
          const tok = this.auth_tokens.find((t) => t.token_hash === token_hash && t.used_at === null && t.expires_at > now);
          if (tok) {
            tok.used_at = used_at;
            return (tok as unknown) as T;
          }
          return null;
        }
        if (norm.startsWith('SELECT token_hash, user_id, expires_at, used_at, created_at FROM auth_tokens WHERE token_hash = ?')) {
          const [token_hash] = boundArgs as [string];
          const tok = this.auth_tokens.find((t) => t.token_hash === token_hash);
          return (tok as unknown) as T;
        }
        return null;
      },
      all: async <T>() => ({ results: [] as T[], success: true }),
      run: async () => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('INSERT INTO users')) {
          const [id, email, stripe, sub, cat, uat] = boundArgs;
          this.users.push({ id, email, stripe, sub, cat, uat });
        } else if (norm.startsWith('INSERT INTO auth_tokens')) {
          const [token_hash, user_id, expires_at, created_at] = boundArgs;
          this.auth_tokens.push({ token_hash, user_id, expires_at, used_at: null, created_at });
        } else if (norm.startsWith('INSERT INTO sessions')) {
          const [session_hash, user_id, expires_at, created_at, last_seen_at] = boundArgs;
          this.sessions.push({ session_hash, user_id, expires_at, created_at, last_seen_at });
        } else if (norm.startsWith('DELETE FROM sessions')) {
          const [session_hash] = boundArgs;
          this.sessions = this.sessions.filter((s) => s.session_hash !== session_hash);
        }
        return { success: true };
      },
    };
  }
  async batch() { return []; }
  async exec() { return { count: 0, duration: 0 }; }
}

describe('AuthService', () => {
  let fakeDb: FakeD1;
  let mockEnv: RuntimeEnv;
  let service: AuthService;

  beforeEach(() => {
    fakeDb = new FakeD1();
    mockEnv = {
      DB: fakeDb,
      APP_ENV: 'local',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };
    service = new AuthService(mockEnv);
    defaultLocalMailSink.clear();
  });

  it('requests magic link for new user, creates token hash, and routes to local sink', async () => {
    const res = await service.requestMagicLink('parent@example.com');
    expect(res.accepted).toBe(true);
    expect(res.message).toContain('sign-in link is on its way');

    expect(fakeDb.users).toHaveLength(1);
    expect(fakeDb.users[0].email).toBe('parent@example.com');
    expect(fakeDb.auth_tokens).toHaveLength(1);

    const sent = defaultLocalMailSink.getSent();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('parent@example.com');
    expect(sent[0].text).toContain('/api/auth/verify?token=');
  });

  it('rate limits after 5 requests per bucket within window', async () => {
    for (let i = 0; i < 5; i++) {
      await service.requestMagicLink('parent@example.com');
    }
    await expect(service.requestMagicLink('parent@example.com')).rejects.toThrow('RATE_LIMITED');
  });

  it('atomically verifies valid token and rejects replayed token', async () => {
    await service.requestMagicLink('parent@example.com');
    const sent = defaultLocalMailSink.getSent();
    const tokenMatch = sent[0].text.match(/token=([A-Za-z0-9_-]+)/);
    expect(tokenMatch).not.toBeNull();
    const rawToken = tokenMatch![1];

    // First verify succeeds and returns session
    const res1 = await service.verifyMagicLink(rawToken);
    expect(res1.success).toBe(true);
    expect(res1.setCookieHeader).toContain('__Host-foxwords_session=');
    expect(fakeDb.sessions).toHaveLength(1);

    // Replay attack with same token is rejected
    const res2 = await service.verifyMagicLink(rawToken);
    expect(res2.success).toBe(false);
    expect(res2.error).toBe('already_used');
  });
});
