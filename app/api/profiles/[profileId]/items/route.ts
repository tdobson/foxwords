import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../lib/db/repositories/users';
import {
  type ValidatedCustomItemInput,
  validateCustomItemInput,
} from '../../../../../lib/profiles/validation';
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

  const items = await profileRepo.listWordsForProfile(profile.id);
  return jsonSuccess(200, { items });
}

export async function POST(
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

  let validatedInput: ValidatedCustomItemInput;
  try {
    validatedInput = validateCustomItemInput(body);
  } catch (err: any) {
    return jsonError(400, 'invalid_request', err.message);
  }

  const itemId = `word_${randomToken(16)}`;
  try {
    const created = await profileRepo.createWord(user.id, {
      id: itemId,
      profileId,
      ...validatedInput,
    });

    if (!created) {
      return jsonError(404, 'not_found', 'Profile not found.');
    }

    return jsonSuccess(201, { item: created });
  } catch (err: any) {
    // If foreign key constraint failed (e.g. invalid asset ID)
    if (err?.message?.includes('FOREIGN KEY') || err?.message?.includes('SQLITE_CONSTRAINT')) {
      return jsonError(400, 'invalid_request', 'Invalid photo or audio asset for this profile.');
    }
    return jsonError(500, 'internal_error', 'Failed to create custom item.');
  }
}
