import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../lib/db/repositories/auth';
import { MediaRepository } from '../../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../lib/db/repositories/users';
import { randomToken } from '../../../../../lib/security/crypto';
import { assertSameOrigin } from '../../../../../lib/security/request';
import { getSessionUser } from '../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params;
  const env = await getRuntimeEnv();

  const authRepo = new AuthRepository(env.DB);
  const userRepo = new UserRepository(env.DB);
  const profileRepo = new ProfileRepository(env.DB);
  const mediaRepo = new MediaRepository(env.DB);

  const user = await getSessionUser(
    authRepo,
    userRepo,
    request.headers.get('cookie') || request.headers.get('Cookie')
  );
  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  const profile = await profileRepo.findOwnedById(user.id, profileId);
  if (!profile) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  const overrides = await mediaRepo.listAudioOverrides(profile.id);
  return jsonSuccess(200, { overrides });
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ profileId: string }> }
) {
  const { profileId } = await context.params;
  const env = await getRuntimeEnv();

  try {
    assertSameOrigin(request, env.APP_ORIGIN);
  } catch {
    return jsonError(403, 'origin_rejected', 'Cross-origin request rejected.');
  }

  const authRepo = new AuthRepository(env.DB);
  const userRepo = new UserRepository(env.DB);
  const profileRepo = new ProfileRepository(env.DB);
  const mediaRepo = new MediaRepository(env.DB);

  const user = await getSessionUser(
    authRepo,
    userRepo,
    request.headers.get('cookie') || request.headers.get('Cookie')
  );
  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  const profile = await profileRepo.findOwnedById(user.id, profileId);
  if (!profile) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Invalid JSON payload.');
  }

  if (!body || typeof body.clipKey !== 'string' || !body.clipKey.trim()) {
    return jsonError(400, 'invalid_request', 'clipKey is required.');
  }
  if (typeof body.assetId !== 'string' || !body.assetId.trim()) {
    return jsonError(400, 'invalid_request', 'assetId is required.');
  }

  const clipKey = body.clipKey.trim();
  const assetId = body.assetId.trim();

  // Enforce same-profile ownership and system-audio kind via mediaRepo
  try {
    const overrideId = `ov_${randomToken(16)}`;
    await mediaRepo.setAudioOverride(overrideId, profile.id, clipKey, assetId);
    const updated = await mediaRepo.getAudioOverride(profile.id, clipKey);
    return jsonSuccess(200, { override: updated });
  } catch (err: any) {
    return jsonError(400, 'invalid_request', err.message);
  }
}
