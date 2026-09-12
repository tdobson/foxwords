import type { MediaAssetRow } from '../db/types';
import type { RuntimeEnv } from '../cloudflare-context';
import type { ValidatedUpload } from './validation';

export function makeR2Key(envPrefix: string, profileId: string, assetId: string, extension: string): string {
  const safeEnv = envPrefix === 'production' ? 'prod' : 'dev';
  return `${safeEnv}/${profileId}/${assetId}.${extension}`;
}

export async function putProfileAsset(
  env: RuntimeEnv,
  profileId: string,
  assetId: string,
  upload: ValidatedUpload,
  body: ArrayBuffer
): Promise<string> {
  const r2Key = makeR2Key(env.APP_ENV, profileId, assetId, upload.extension);
  if (env.MEDIA && typeof env.MEDIA.put === 'function') {
    await env.MEDIA.put(r2Key, body, {
      httpMetadata: {
        contentType: upload.contentType,
      },
    });
  }
  return r2Key;
}

export async function getProfileAssetResponse(
  env: RuntimeEnv,
  asset: MediaAssetRow
): Promise<Response> {
  if (!env.MEDIA || typeof env.MEDIA.get !== 'function') {
    return new Response('R2 Media binding not available', { status: 503 });
  }

  const object = await env.MEDIA.get(asset.r2_key);
  if (!object) {
    return new Response('Not Found', { status: 404 });
  }

  const headers = new Headers();
  headers.set('Content-Type', asset.content_type);
  headers.set('Content-Length', String(asset.byte_size));
  headers.set('Cache-Control', 'private, max-age=3600');
  headers.set('X-Content-Type-Options', 'nosniff');

  return new Response(object.body, {
    status: 200,
    headers,
  });
}

export async function deleteProfileAssetObject(
  env: RuntimeEnv,
  asset: MediaAssetRow
): Promise<void> {
  if (env.MEDIA && typeof env.MEDIA.delete === 'function') {
    await env.MEDIA.delete(asset.r2_key);
  }
}
