import type { NextRequest } from 'next/server';
import { jsonError, jsonSuccess } from '../../../../../lib/api-response';
import { getRuntimeEnv } from '../../../../../lib/cloudflare-context';
import { AuthRepository } from '../../../../../lib/db/repositories/auth';
import { MediaRepository } from '../../../../../lib/db/repositories/media';
import { ProfileRepository } from '../../../../../lib/db/repositories/profiles';
import { UserRepository } from '../../../../../lib/db/repositories/users';
import { putProfileAsset } from '../../../../../lib/media/r2';
import { type ValidatedUpload, validateUpload } from '../../../../../lib/media/validation';
import { randomToken } from '../../../../../lib/security/crypto';
import { assertSameOrigin } from '../../../../../lib/security/request';
import { getSessionUser } from '../../../../../lib/security/session';

export const dynamic = 'force-dynamic';

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

  // Content-Length / 413 check before buffering
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 5 * 1024 * 1024 + 4096) {
    return jsonError(413, 'payload_too_large', 'File size exceeds the 5 MiB maximum limit.');
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, 'invalid_request', 'Invalid multipart form data.');
  }

  const file = formData.get('file');
  const declaredKind = formData.get('kind');

  if (!file || typeof file !== 'object' || typeof (file as any).arrayBuffer !== 'function') {
    return jsonError(400, 'invalid_request', 'File field is required.');
  }

  if (
    typeof declaredKind !== 'string' ||
    !['photo', 'word-audio', 'system-audio'].includes(declaredKind)
  ) {
    return jsonError(400, 'invalid_request', 'Kind must be photo, word-audio, or system-audio.');
  }

  const arrayBuffer = await file.arrayBuffer();
  let validated: ValidatedUpload;
  try {
    const contentType = file.type || 'application/octet-stream';
    validated = validateUpload(contentType, arrayBuffer);
    if (declaredKind === 'system-audio' && validated.kind === 'word-audio') {
      validated.kind = 'system-audio';
    } else if (declaredKind !== validated.kind) {
      return jsonError(
        400,
        'invalid_request',
        `Declared kind '${declaredKind}' does not match uploaded file type (${validated.kind}).`
      );
    }
  } catch (err: any) {
    return jsonError(400, 'invalid_request', err.message);
  }

  const assetId = `ast_${randomToken(16)}`;
  try {
    const r2Key = await putProfileAsset(env, profileId, assetId, validated, arrayBuffer);

    const assetRow = await mediaRepo.create({
      id: assetId,
      profileId,
      r2Key,
      kind: validated.kind,
      contentType: validated.contentType,
      byteSize: validated.byteSize,
    });

    return jsonSuccess(201, {
      asset: {
        id: assetRow.id,
        kind: assetRow.kind,
        contentType: assetRow.content_type,
        byteSize: assetRow.byte_size,
        url: `/api/profiles/${profileId}/assets/${assetRow.id}`,
      },
    });
  } catch (err: any) {
    return jsonError(500, 'internal_error', 'Failed to store media asset.');
  }
}
