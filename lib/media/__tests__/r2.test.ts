import type { MediaAssetRow } from '../../db/types';
import type { RuntimeEnv } from '../../cloudflare-context';
import { deleteProfileAssetObject, getProfileAssetResponse, makeR2Key, putProfileAsset } from '../r2';
import type { ValidatedUpload } from '../validation';

describe('R2 Media Storage', () => {
  let fakeBucket: Map<string, { body: ArrayBuffer; contentType: string }>;
  let mockEnv: RuntimeEnv;

  beforeEach(() => {
    fakeBucket = new Map();
    mockEnv = {
      DB: {} as any,
      MEDIA: {
        put: async (key: string, body: ArrayBuffer, options?: any) => {
          fakeBucket.set(key, { body, contentType: options?.httpMetadata?.contentType });
        },
        get: async (key: string) => {
          const item = fakeBucket.get(key);
          if (!item) return null;
          return {
            body: item.body,
            httpMetadata: { contentType: item.contentType },
          };
        },
        delete: async (key: string) => {
          fakeBucket.delete(key);
        },
      },
      APP_ENV: 'dev',
      SES_REGION: 'eu-west-2',
      APP_ORIGIN: 'http://localhost:8787',
    };
  });

  it('generates isolated server-side keys based on environment prefix', () => {
    expect(makeR2Key('production', 'prof_1', 'asset_abc', 'jpg')).toBe('prod/prof_1/asset_abc.jpg');
    expect(makeR2Key('dev', 'prof_2', 'asset_xyz', 'webm')).toBe('dev/prof_2/asset_xyz.webm');
  });

  it('puts asset into R2 and retrieves it with safe security headers', async () => {
    const upload: ValidatedUpload = {
      kind: 'photo',
      contentType: 'image/jpeg',
      extension: 'jpg',
      byteSize: 1024,
    };
    const body = new Uint8Array(1024).buffer;

    const r2Key = await putProfileAsset(mockEnv, 'prof_1', 'asset_1', upload, body);
    expect(r2Key).toBe('dev/prof_1/asset_1.jpg');
    expect(fakeBucket.has('dev/prof_1/asset_1.jpg')).toBe(true);

    const assetRow: MediaAssetRow = {
      id: 'asset_1',
      profile_id: 'prof_1',
      r2_key: r2Key,
      kind: 'photo',
      content_type: 'image/jpeg',
      byte_size: 1024,
      created_at: Date.now(),
    };

    const response = await getProfileAssetResponse(mockEnv, assetRow);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(response.headers.get('Content-Length')).toBe('1024');
    expect(response.headers.get('Cache-Control')).toBe('private, max-age=3600');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');

    await deleteProfileAssetObject(mockEnv, assetRow);
    expect(fakeBucket.has(r2Key)).toBe(false);
  });

  it('rejects unvalidated profileId, assetId, or unknown env in makeR2Key', () => {
    expect(() => makeR2Key('invalid_env', 'prof_1', 'asset_1', 'jpg')).toThrow(/Unsupported environment/);
    expect(() => makeR2Key('dev', 'bad/profile', 'asset_1', 'jpg')).toThrow(/Invalid profileId/);
    expect(() => makeR2Key('dev', 'prof_1', '../bad', 'jpg')).toThrow(/Invalid assetId/);
    expect(makeR2Key('production', 'prof_1', 'asset_1', 'jpg')).toBe('prod/prof_1/asset_1.jpg');
    expect(makeR2Key('local', 'prof_1', 'asset_1', 'jpg')).toBe('local/prof_1/asset_1.jpg');
  });
});
