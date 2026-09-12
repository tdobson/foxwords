import type { D1DatabaseLike } from '../client';
import type { RateLimitRow } from '../types';

export class RateLimitRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  /**
   * Checks if an action is rate limited and increments the counter atomically.
   * Returns true if request is allowed, false if limit exceeded.
   */
  async consume(bucket: string, windowMs: number, maxRequests: number, now = Date.now()): Promise<boolean> {
    const existing = await this.db
      .prepare('SELECT bucket, window_started_at, request_count FROM rate_limits WHERE bucket = ?')
      .bind(bucket)
      .first<RateLimitRow>();

    if (!existing || now - existing.window_started_at > windowMs) {
      await this.db
        .prepare(
          `INSERT INTO rate_limits (bucket, window_started_at, request_count)
           VALUES (?, ?, 1)
           ON CONFLICT(bucket) DO UPDATE SET window_started_at = excluded.window_started_at, request_count = 1`
        )
        .bind(bucket, now)
        .run();
      return true;
    }

    if (existing.request_count >= maxRequests) {
      return false;
    }

    await this.db
      .prepare('UPDATE rate_limits SET request_count = request_count + 1 WHERE bucket = ?')
      .bind(bucket)
      .run();

    return true;
  }
}
