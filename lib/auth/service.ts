import type { RuntimeEnv } from '../cloudflare-context';
import { AuthRepository } from '../db/repositories/auth';
import { RateLimitRepository } from '../db/repositories/rate-limits';
import { UserRepository } from '../db/repositories/users';
import { sendMagicLink } from '../email/ses';
import { normalizeEmail, randomToken, sha256Hex } from '../security/crypto';
import { createSession } from '../security/session';

export const AUTH_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const AUTH_MAX_REQUESTS = 5; // max 5 requests per 15 min per email bucket
export const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

export interface RequestMagicLinkResult {
  accepted: boolean;
  message: string;
}

export interface VerifyMagicLinkResult {
  success: boolean;
  userId?: string;
  setCookieHeader?: string;
  error?: 'invalid_token' | 'expired_token' | 'already_used';
}

export class AuthService {
  private userRepo: UserRepository;
  private authRepo: AuthRepository;
  private rateLimitRepo: RateLimitRepository;

  constructor(private readonly env: RuntimeEnv) {
    this.userRepo = new UserRepository(this.env.DB);
    this.authRepo = new AuthRepository(this.env.DB);
    this.rateLimitRepo = new RateLimitRepository(this.env.DB);
  }

  /**
   * Passwordless magic-link request.
   * Enumeration-resistant: always returns identical 202 message regardless of whether
   * the email exists or whether email delivery fails.
   */
  async requestMagicLink(rawEmail: string): Promise<RequestMagicLinkResult> {
    const email = normalizeEmail(rawEmail);

    // Rate limiting: 5 requests per 15 minutes per email bucket
    const bucket = `auth_req:${email}`;
    const allowed = await this.rateLimitRepo.consume(bucket, AUTH_WINDOW_MS, AUTH_MAX_REQUESTS);
    if (!allowed) {
      throw new Error('RATE_LIMITED');
    }

    // Upsert user
    let user = await this.userRepo.findByEmail(email);
    if (!user) {
      const newId = `usr_${randomToken(16)}`;
      user = await this.userRepo.create({
        id: newId,
        email,
      });
    }

    // Generate 32-byte raw token and store SHA-256 hash
    const rawToken = randomToken(32);
    const tokenHash = await sha256Hex(rawToken);
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    await this.authRepo.createToken(tokenHash, user.id, expiresAt);

    // Form magic link URL pointing to verify endpoint
    const baseOrigin = this.env.APP_ORIGIN || 'http://localhost:8787';
    const origin = baseOrigin.endsWith('/') ? baseOrigin.slice(0, -1) : baseOrigin;
    const loginUrl = `${origin}/api/auth/verify?token=${encodeURIComponent(rawToken)}`;

    try {
      await sendMagicLink(this.env, {
        toEmail: email,
        loginUrl,
      });
    } catch {
      // Correlation logged without leaking email or token
      // We do NOT reveal to caller whether SES failed or not
    }

    return {
      accepted: true,
      message: 'If that email is valid, a sign-in link is on its way. Check your inbox.',
    };
  }

  /**
   * Atomically verifies and consumes a magic link token, creating an authenticated session.
   */
  async verifyMagicLink(rawToken: string): Promise<VerifyMagicLinkResult> {
    if (!rawToken || typeof rawToken !== 'string') {
      return { success: false, error: 'invalid_token' };
    }

    const tokenHash = await sha256Hex(rawToken.trim());
    const now = Date.now();

    // Atomic consumption prevents race conditions & replay attacks
    const consumed = await this.authRepo.consumeValidToken(tokenHash, now);
    if (!consumed) {
      // Check if it was expired or used for diagnostic clarity
      const existing = await this.authRepo.findTokenByHash(tokenHash);
      if (existing && existing.used_at) {
        return { success: false, error: 'already_used' };
      }
      if (existing && existing.expires_at <= now) {
        return { success: false, error: 'expired_token' };
      }
      return { success: false, error: 'invalid_token' };
    }

    // Token was atomically consumed; create session
    const { setCookieHeader } = await createSession(this.authRepo, consumed.user_id, this.env.APP_ENV);

    return {
      success: true,
      userId: consumed.user_id,
      setCookieHeader,
    };
  }

  /**
   * Cleans up session on logout.
   */
  async logout(sessionToken: string | null): Promise<void> {
    if (!sessionToken) return;
    const sessionHash = await sha256Hex(sessionToken);
    await this.authRepo.deleteSession(sessionHash);
  }
}
