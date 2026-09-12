import type { D1DatabaseLike } from '../client';
import type { RateLimitRow } from '../types';

export class RateLimitRepository {
  constructor(private readonly db: D1DatabaseLike) {}

  /**
   * Checks if an action is rate limited and increments the counter atomically.
   * Returns true if request is allowed, false if limit exceeded.
   */
  async consume(
    bucket: string,
    windowMs: number,
    maxRequests: number,
    now = Date.now()
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO rate_limits (bucket, window_started_at, request_count)
         VALUES (?, ?, 1)
         ON CONFLICT(bucket) DO UPDATE SET
           request_count = CASE
             WHEN (? - window_started_at) > ? THEN 1
             WHEN request_count < ? THEN request_count + 1
             ELSE request_count
           END,
           window_started_at = CASE
             WHEN (? - window_started_at) > ? THEN ?
             ELSE window_started_at
           END
         WHERE (? - window_started_at) > ? OR request_count < ?
         RETURNING request_count`
      )
      .bind(bucket, now, now, windowMs, maxRequests, now, windowMs, now, now, windowMs, maxRequests)
      .first<RateLimitRow>();

    return result !== null;
  }
}
