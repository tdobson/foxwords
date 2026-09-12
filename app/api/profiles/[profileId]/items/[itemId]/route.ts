import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../../lib/db/repositories/users';
import { assertSameOrigin } from '../../../../../../lib/security/request';
import { getSessionUser } from '../../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; itemId: string }> }
) {
  const { profileId, itemId } = await context.params;
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

  const deleted = await profileRepo.deleteWordOwned(user.id, profileId, itemId);
  if (!deleted) {
    return jsonError(404, 'not_found', 'Item not found.');
  }

  return jsonSuccess(200, { ok: true });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ profileId: string; itemId: string }> }
) {
  const { profileId, itemId } = await context.params;
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

  const patch: any = {};
  if (body?.word !== undefined) {
    if (typeof body.word !== 'string' || !body.word.trim()) {
      return jsonError(400, 'invalid_request', 'Word must be non-empty string.');
    }
    patch.word = body.word.trim().toUpperCase();
  }
  if (body?.category !== undefined) {
    if (!['vip', 'family', 'pet', 'toy', 'custom'].includes(body.category)) {
      return jsonError(400, 'invalid_request', 'Invalid category.');
    }
    patch.category = body.category;
  }
  if (body?.promptLabel !== undefined) {
    if (typeof body.promptLabel !== 'string' || !body.promptLabel.trim()) {
      return jsonError(400, 'invalid_request', 'Prompt label must be non-empty.');
    }
    patch.promptLabel = body.promptLabel.trim();
  }
  if (body?.promptEmoji !== undefined) {
    patch.promptEmoji = body.promptEmoji ? String(body.promptEmoji) : null;
  }
  if (body?.photoAssetId !== undefined) {
    patch.photoAssetId = body.photoAssetId ? String(body.photoAssetId) : null;
  }
  if (body?.audioAssetId !== undefined) {
    patch.audioAssetId = body.audioAssetId ? String(body.audioAssetId) : null;
  }

  try {
    const updated = await profileRepo.updateWordOwned(user.id, profileId, itemId, patch);
    if (!updated) {
      return jsonError(404, 'not_found', 'Item not found.');
    }
    return jsonSuccess(200, { item: updated });
  } catch (err: any) {
    if (err?.message?.includes('FOREIGN KEY') || err?.message?.includes('SQLITE_CONSTRAINT')) {
      return jsonError(400, 'invalid_request', 'Invalid photo or audio asset for this profile.');
    }
    return jsonError(500, 'internal_error', 'Failed to update custom item.');
  }
}
