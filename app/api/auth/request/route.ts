import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../lib/api-response';
import { AuthService } from '../../../../lib/auth/service';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { assertSameOrigin } from '../../../../lib/security/request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const env = await getRuntimeEnv();

  // CSRF Origin verification
  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch (err: any) {
    return jsonError(403, 'origin_rejected', 'Cross-origin request rejected.');
  }

  // Parse JSON body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Invalid JSON body.');
  }

  if (!body || typeof body.email !== 'string' || !body.email.trim()) {
    return jsonError(400, 'invalid_request', 'Enter a valid email address.');
  }

  const authService = new AuthService(env);
  try {
    const result = await authService.requestMagicLink(body.email);
    return jsonSuccess(202, result);
  } catch (err: any) {
    if (err.message === 'RATE_LIMITED') {
      return jsonError(
        429,
        'rate_limited',
        'Too many sign-in attempts. Please wait a few minutes before trying again.'
      );
    }
    if (err.message?.includes('Invalid email address format')) {
      return jsonError(400, 'invalid_request', 'Enter a valid email address.');
    }
    // Generic enumeration-safe error
    return jsonError(
      500,
      'internal_error',
      'An unexpected error occurred. Please try again later.'
    );
  }
}
