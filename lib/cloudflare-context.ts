import type { D1DatabaseLike } from './db/client';

export interface RuntimeEnv {
  DB: D1DatabaseLike;
  MEDIA?: any;
  ASSETS?: any;
  APP_ENV: 'local' | 'dev' | 'production' | string;
  SES_REGION: string;
  APP_ORIGIN: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  SES_SENDER_EMAIL?: string;
  SESSION_SECRET?: string;
}

let mockRuntimeEnv: RuntimeEnv | null = null;

export function setMockRuntimeEnv(env: RuntimeEnv | null) {
  mockRuntimeEnv = env;
}

export async function getRuntimeEnv(): Promise<RuntimeEnv> {
  if (mockRuntimeEnv) {
    return mockRuntimeEnv;
  }

  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = await getCloudflareContext();
    if (ctx?.env) {
      return ctx.env as unknown as RuntimeEnv;
    }
  } catch {
    // Falling through to process.env fallback for node/local tooling
  }

  return {
    DB: (process.env as any).DB,
    MEDIA: (process.env as any).MEDIA,
    ASSETS: (process.env as any).ASSETS,
    APP_ENV: process.env.APP_ENV || 'local',
    SES_REGION: process.env.SES_REGION || 'eu-west-2',
    APP_ORIGIN: process.env.APP_ORIGIN || 'http://localhost:8787',
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    SES_SENDER_EMAIL: process.env.SES_SENDER_EMAIL || 'noreply@foxwords.net',
    SESSION_SECRET: process.env.SESSION_SECRET,
  };
}
