import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../lib/api-response';
import { getRuntimeEnv } from '../../../lib/cloudflare-context';
import { AuthRepository } from '../../../lib/db/repositories/auth';
import { ProfileRepository } from '../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../lib/db/repositories/users';
import { validateChildName } from '../../../lib/profiles/validation';
import { randomToken, sha256Hex } from '../../../lib/security/crypto';
import { assertSameOrigin } from '../../../lib/security/request';
import { getSessionUser } from '../../../lib/security/session';

export const dynamic = 'force-dynamic';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateFriendlyCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  }
  return code;
}

export async function GET(request: NextRequest) {
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

  const profiles = await profileRepo.listForUser(user.id);
  const safeProfiles = profiles.map((p) => ({
    id: p.id,
    childName: p.child_name,
    playCode: p.play_code,
    playUrl: `/play/${p.play_code}`,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  return jsonSuccess(200, { profiles: safeProfiles });
}

export async function POST(request: NextRequest) {
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

  let childName: string;
  try {
    childName = validateChildName(body?.childName);
  } catch (err: any) {
    return jsonError(400, 'invalid_request', err.message);
  }

  // Generate opaque play token and family play code
  const rawPlayToken = randomToken(32);
  const playTokenHash = await sha256Hex(rawPlayToken);
  const playCode = generateFriendlyCode();
  const profileId = `prof_${randomToken(16)}`;

  const created = await profileRepo.create({
    id: profileId,
    userId: user.id,
    childName,
    playTokenHash,
    playCode,
  });

  return jsonSuccess(201, {
    profile: {
      id: created.id,
      childName: created.child_name,
      playCode: created.play_code,
      playUrl: `/play/${created.play_code}`,
      rawPlayToken, // Returned only on initial creation/rotation for direct one-time URL construction
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    },
  });
}
