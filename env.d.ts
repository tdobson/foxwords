interface CloudflareEnv {
  DB: D1Database;
  MEDIA: R2Bucket;
  ASSETS: Fetcher;
  APP_ENV: string;
  SES_REGION: string;
  APP_ORIGIN: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  SES_SENDER_EMAIL?: string;
  SESSION_SECRET?: string;
}
