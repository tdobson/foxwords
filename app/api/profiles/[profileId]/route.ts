import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../lib/db/repositories/users';
import { validateChildName } from '../../../../lib/profiles/validation';
import { assertSameOrigin } from '../../../../lib/security/request';
import { getSessionUser } from '../../../../lib/security/session';

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

  const words = await profileRepo.listWordsForProfile(profile.id);

  return jsonSuccess(200, {
    profile: {
      id: profile.id,
      childName: profile.child_name,
      playCode: profile.play_code,
      playUrl: `/play/${profile.play_code}`,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
      words,
    },
  });
}

export async function PATCH(
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

  const user = await getSessionUser(
    authRepo,
    userRepo,
    request.headers.get('cookie') || request.headers.get('Cookie')
  );
  if (!user) {
    return jsonError(401, 'unauthorized', 'Authentication required.');
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, 'invalid_request', 'Invalid JSON payload.');
  }

  const patch: { childName?: string } = {};
  if (body?.childName !== undefined) {
    try {
      patch.childName = validateChildName(body.childName);
    } catch (err: any) {
      return jsonError(400, 'invalid_request', err.message);
    }
  }

  const updated = await profileRepo.updateOwned(user.id, profileId, patch);
  if (!updated) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  return jsonSuccess(200, {
    profile: {
      id: updated.id,
      childName: updated.child_name,
      playCode: updated.play_code,
      playUrl: `/play/${updated.play_code}`,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    },
  });
}

export async function DELETE(
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
  const mediaRepo = new (await import('../../../../lib/db/repositories/media')).MediaRepository(
    env.DB
  );
  const { deleteProfileAssetObject } = await import('../../../../lib/media/r2');

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

  // Find assets to clean up R2 objects
  const assets = await mediaRepo.listForProfile(profile.id);
  for (const asset of assets) {
    try {
      await deleteProfileAssetObject(env, asset);
    } catch {
      // Ignore individual R2 delete failures on profile wipe
    }
  }

  const success = await profileRepo.deleteOwned(user.id, profileId);
  if (!success) {
    return jsonError(404, 'not_found', 'Profile not found.');
  }

  return jsonSuccess(200, { ok: true });
}
