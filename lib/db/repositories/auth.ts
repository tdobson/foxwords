import type { D1DatabaseLike } from '../client';
import type { AuthTokenRow, SessionRow } from '../types';

export class AuthRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  async createToken(tokenHash: string, userId: string, expiresAt: number): Promise<AuthTokenRow> {
    const now = Date.now();
    await this.db
      .prepare(
        'INSERT INTO auth_tokens (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)'
      )
      .bind(tokenHash, userId, expiresAt, now)
      .run();
    return {
      token_hash: tokenHash,
      user_id: userId,
      expires_at: expiresAt,
      used_at: null,
      created_at: now,
    };
  }

  /**
   * Atomically consumes a valid unused and unexpired auth token.
   * If two simultaneous requests arrive with the same token, only one succeeds;
   * the other returns null (defeating token replay attacks).
   */
  async consumeValidToken(tokenHash: string, now = Date.now()): Promise<AuthTokenRow | null> {
    const stmt = this.db
      .prepare(
        `UPDATE auth_tokens
         SET used_at = ?
         WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?
         RETURNING token_hash, user_id, expires_at, used_at, created_at`
      )
      .bind(now, tokenHash, now);
    return stmt.first<AuthTokenRow>();
  }

  async findTokenByHash(tokenHash: string): Promise<AuthTokenRow | null> {
    const stmt = this.db
      .prepare(
        'SELECT token_hash, user_id, expires_at, used_at, created_at FROM auth_tokens WHERE token_hash = ?'
      )
      .bind(tokenHash);
    return stmt.first<AuthTokenRow>();
  }

  async findValidToken(tokenHash: string, now = Date.now()): Promise<AuthTokenRow | null> {
    const stmt = this.db
      .prepare(
        'SELECT token_hash, user_id, expires_at, used_at, created_at FROM auth_tokens WHERE token_hash = ? AND used_at IS NULL AND expires_at > ?'
      )
      .bind(tokenHash, now);
    return stmt.first<AuthTokenRow>();
  }

  async markTokenUsed(tokenHash: string, now = Date.now()): Promise<void> {
    await this.db
      .prepare('UPDATE auth_tokens SET used_at = ? WHERE token_hash = ?')
      .bind(now, tokenHash)
      .run();
  }

  async createSession(sessionHash: string, userId: string, expiresAt: number): Promise<SessionRow> {
    const now = Date.now();
    await this.db
      .prepare(
        'INSERT INTO sessions (session_hash, user_id, expires_at, created_at, last_seen_at) VALUES (?, ?, ?, ?, ?)'
      )
      .bind(sessionHash, userId, expiresAt, now, now)
      .run();
    return {
      session_hash: sessionHash,
      user_id: userId,
      expires_at: expiresAt,
      created_at: now,
      last_seen_at: now,
    };
  }

  async findValidSession(sessionHash: string, now = Date.now()): Promise<SessionRow | null> {
    const stmt = this.db
      .prepare(
        'SELECT session_hash, user_id, expires_at, created_at, last_seen_at FROM sessions WHERE session_hash = ? AND expires_at > ?'
      )
      .bind(sessionHash, now);
    const row = await stmt.first<SessionRow>();
    if (!row) return null;

    // Update last_seen_at asynchronously/best-effort
    await this.db
      .prepare('UPDATE sessions SET last_seen_at = ? WHERE session_hash = ?')
      .bind(now, sessionHash)
      .run();

    return { ...row, last_seen_at: now };
  }

  async deleteSession(sessionHash: string): Promise<void> {
    await this.db.prepare('DELETE FROM sessions WHERE session_hash = ?').bind(sessionHash).run();
  }
}
