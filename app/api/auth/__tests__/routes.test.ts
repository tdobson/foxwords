import { NextRequest } from 'next/server';
import { type RuntimeEnv, setMockRuntimeEnv } from '../../../../lib/cloudflare-context';
import type { D1DatabaseLike, D1PreparedStatementLike } from '../../../../lib/db/client';
import { defaultLocalMailSink } from '../../../../lib/email/ses';
import { GET as getMe } from '../../me/route';
import { POST as logoutAuth } from '../logout/route';
import { POST as requestAuth } from '../request/route';
import { GET as verifyAuth } from '../verify/route';

class RouteTestD1 implements D1DatabaseLike {
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
            'SELECT id, email, stripe_customer_id, subscription_status, created_at, updated_at FROM users WHERE email = ?'
          )
        ) {
          const [email] = boundArgs as [string];
          const found = this.users.find((u) => u.email === email);
          return found as unknown as T;
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
          norm.startsWith(
            'UPDATE auth_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?'
          )
        ) {
          const [used_at, token_hash, now] = boundArgs as [number, string, number];
          const tok = this.auth_tokens.find(
            (t) => t.token_hash === token_hash && t.used_at === null && t.expires_at > now
          );
          if (tok) {
            tok.used_at = used_at;
            return tok as unknown as T;
          }
          return null;
        }
        if (
          norm.startsWith(
            'SELECT token_hash, user_id, expires_at, used_at, created_at FROM auth_tokens WHERE token_hash = ?'
          )
        ) {
          const [token_hash] = boundArgs as [string];
          const tok = this.auth_tokens.find((t) => t.token_hash === token_hash);
          return tok as unknown as T;
        }
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
        return null;
      },
      all: async <T>() => ({ results: [] as T[], success: true }),
      run: async () => {
        const norm = query.trim().replace(/\s+/g, ' ');
        if (norm.startsWith('INSERT INTO users')) {
          const [id, email, stripe_customer_id, subscription_status, created_at, updated_at] =
            boundArgs;
          this.users.push({
            id,
            email,
            stripe_customer_id,
            subscription_status,
            created_at,
            updated_at,
          });
        } else if (norm.startsWith('INSERT INTO auth_tokens')) {
          const [token_hash, user_id, expires_at, created_at] = boundArgs;
          this.auth_tokens.push({ token_hash, user_id, expires_at, used_at: null, created_at });
        } else if (norm.startsWith('INSERT INTO sessions')) {
          const [session_hash, user_id, expires_at, created_at, last_seen_at] = boundArgs;
          this.sessions.push({ session_hash, user_id, expires_at, created_at, last_seen_at });
        } else if (norm.startsWith('UPDATE sessions SET last_seen_at')) {
          const [last_seen, hash] = boundArgs as [number, string];
          const s = this.sessions.find((sess) => sess.session_hash === hash);
          if (s) s.last_seen_at = last_seen;
        } else if (norm.startsWith('DELETE FROM sessions')) {
          const [session_hash] = boundArgs;
          this.sessions = this.sessions.filter((s) => s.session_hash !== session_hash);
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

function createMockRequest(
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

describe('Auth API Routes', () => {
  let db: RouteTestD1;
  let env: RuntimeEnv;

  beforeEach(() => {
    db = new RouteTestD1();
    env = {
      DB: db,
      APP_ENV: 'local',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };
    setMockRuntimeEnv(env);
    defaultLocalMailSink.clear();
  });

  afterEach(() => {
    setMockRuntimeEnv(null);
  });

  describe('POST /api/auth/request', () => {
    it('returns 403 on cross-origin mutation', async () => {
      const req = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'https://evil.attacker.com' },
        body: { email: 'test@example.com' },
      });
      const res = await requestAuth(req);
      expect(res.status).toBe(403);
      const data: any = await res.json();
      expect(data.error.code).toBe('origin_rejected');
    });

    it('returns 400 on malformed JSON or invalid email', async () => {
      const req1 = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: 'invalid-json{{{',
      });
      const res1 = await requestAuth(req1);
      expect(res1.status).toBe(400);

      const req2 = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: { email: 'not-an-email' },
      });
      const res2 = await requestAuth(req2);
      expect(res2.status).toBe(400);
      const data2: any = await res2.json();
      expect(data2.error.code).toBe('invalid_request');
    });

    it('returns 202 with generic message on valid email and routes to local sink', async () => {
      const req = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: { email: 'parent@example.com' },
      });
      const res = await requestAuth(req);
      expect(res.status).toBe(202);
      const data: any = await res.json();
      expect(data.accepted).toBe(true);
      expect(defaultLocalMailSink.getSent()).toHaveLength(1);
    });

    it('returns 429 when rate limit exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        const req = createMockRequest('http://localhost:8787/api/auth/request', {
          method: 'POST',
          headers: { Origin: 'http://localhost:8787' },
          body: { email: 'parent@example.com' },
        });
        await requestAuth(req);
      }
      const sixthReq = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: { email: 'parent@example.com' },
      });
      const res = await requestAuth(sixthReq);
      expect(res.status).toBe(429);
      const data: any = await res.json();
      expect(data.error.code).toBe('rate_limited');
    });
  });

  describe('GET /api/auth/verify', () => {
    it('redirects to /parent/login?error=invalid-link when token is missing or invalid', async () => {
      const req = createMockRequest('http://localhost:8787/api/auth/verify?token=invalid_token');
      const res = await verifyAuth(req);
      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe(
        'http://localhost:8787/parent/login?error=invalid-link'
      );
    });

    it('verifies valid token, sets session cookie, and redirects to /parent', async () => {
      // Create request first
      const reqAuth = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: { email: 'parent@example.com' },
      });
      await requestAuth(reqAuth);
      const sent = defaultLocalMailSink.getSent();
      const rawToken = sent[0].text.match(/token=([A-Za-z0-9_-]+)/)![1];

      const verifyReq = createMockRequest(
        `http://localhost:8787/api/auth/verify?token=${rawToken}`
      );
      const res = await verifyAuth(verifyReq);

      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('http://localhost:8787/parent');
      expect(res.headers.get('Set-Cookie')).toContain('__Host-foxwords_session=');

      // Replaying token redirects to error
      const replayReq = createMockRequest(
        `http://localhost:8787/api/auth/verify?token=${rawToken}`
      );
      const replayRes = await verifyAuth(replayReq);
      expect(replayRes.status).toBe(302);
      expect(replayRes.headers.get('location')).toBe(
        'http://localhost:8787/parent/login?error=invalid-link'
      );
    });
  });

  describe('GET /api/me & POST /api/auth/logout', () => {
    it('returns 401 when no session cookie is provided', async () => {
      const req = createMockRequest('http://localhost:8787/api/me');
      const res = await getMe(req);
      expect(res.status).toBe(401);
      const data: any = await res.json();
      expect(data.error.code).toBe('unauthorized');
    });

    it('returns 200 with user when valid session is provided, and clears session on logout', async () => {
      // 1. Request and verify to get session cookie
      const reqAuth = createMockRequest('http://localhost:8787/api/auth/request', {
        method: 'POST',
        headers: { Origin: 'http://localhost:8787' },
        body: { email: 'parent@example.com' },
      });
      await requestAuth(reqAuth);
      const sent = defaultLocalMailSink.getSent();
      const rawToken = sent[0].text.match(/token=([A-Za-z0-9_-]+)/)![1];
      const verifyRes = await verifyAuth(
        createMockRequest(`http://localhost:8787/api/auth/verify?token=${rawToken}`)
      );
      const cookieHeader = verifyRes.headers.get('Set-Cookie')!;
      const tokenValue = cookieHeader.split(';')[0]; // e.g. "__Host-foxwords_session=..."

      // 2. Query /api/me with session cookie
      const meReq = createMockRequest('http://localhost:8787/api/me', {
        headers: { Cookie: tokenValue },
      });
      const meRes = await getMe(meReq);
      expect(meRes.status).toBe(200);
      const meData: any = await meRes.json();
      expect(meData.user.email).toBe('parent@example.com');

      // 3. Logout
      const logoutReq = createMockRequest('http://localhost:8787/api/auth/logout', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost:8787',
          Cookie: tokenValue,
        },
      });
      const logoutRes = await logoutAuth(logoutReq);
      expect(logoutRes.status).toBe(200);
      expect(logoutRes.headers.get('Set-Cookie')).toContain('Max-Age=0');

      // 4. Query /api/me again is 401
      const meAfterLogout = await getMe(meReq);
      expect(meAfterLogout.status).toBe(401);
    });
  });
});
