import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { MediaRepository } from '../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../lib/db/repositories/profiles';
import { RateLimitRepository } from '../../../../lib/db/repositories/rate-limits';
import { normalizePlayCode } from '../../../../lib/security/crypto';
import { assertSameOrigin } from '../../../../lib/security/request';

export const dynamic = 'force-dynamic';

export const RESOLVE_WINDOW_MS = 15 * 60 * 1000;
export const RESOLVE_MAX_REQUESTS = 10;

export async function POST(request: NextRequest) {
  const env = await getRuntimeEnv();

  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch {
    return jsonError(403, 'origin_rejected', 'Cross-origin request rejected.');
  }

  // IP/client rate limiting
  const rateLimitRepo = new RateLimitRepository(env.DB);
  const clientIp =
    request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'anon';
  const allowed = await rateLimitRepo.consume(
    `resolve_code:${clientIp}`,
    RESOLVE_WINDOW_MS,
    RESOLVE_MAX_REQUESTS
  );
  if (!allowed) {
    return jsonError(
      429,
      'rate_limited',
      'Too many attempts to resolve play code. Please wait a few minutes.'
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Invalid JSON payload.');
  }

  if (!body || typeof body.code !== 'string') {
    return jsonError(400, 'invalid_request', 'Play code is required.');
  }

  let cleanCode: string;
  try {
    cleanCode = normalizePlayCode(body.code);
  } catch {
    return jsonError(404, 'not_found', 'Invalid or unrecognised family play code.');
  }

  const profileRepo = new ProfileRepository(env.DB);
  const profile = await profileRepo.findByPlayCode(cleanCode);
  if (!profile) {
    return jsonError(404, 'not_found', 'Invalid or unrecognised family play code.');
  }

  return jsonSuccess(200, {
    play: {
      profileId: profile.id,
      childName: profile.child_name,
      playCode: profile.play_code,
      playUrl: `/play/${profile.play_code}`,
    },
  });
}
