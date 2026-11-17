import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Local D1 only: these commands never target --remote.
export const ROOT = path.resolve(__dirname, '..', '..');
const DB_NAME = 'foxwords-dev';
const WRANGLER_ARGS = ['--local', '--env', 'dev'];

export const SESSION_COOKIE = '__Host-foxwords_session';

export interface SeedParent {
  id: string;
  email: string;
  sessionToken: string;
}

export const NEW_PARENT: SeedParent = {
  id: 'e2e-user-new-parent',
  email: 'new.parent@e2e.foxwords.test',
  sessionToken: 'e2e-new-parent-session-token-0001',
};

export const FAMILY_PARENT: SeedParent = {
  id: 'e2e-user-family-parent',
  email: 'family.parent@e2e.foxwords.test',
  sessionToken: 'e2e-family-parent-session-token-0002',
};

export const JUNIPER = {
  profileId: 'e2e-profile-juniper',
  childName: 'Juniper',
  playCode: '86DJS6',
  playToken: 'e2e-juniper-play-token',
};

const DAY_MS = 24 * 60 * 60 * 1000;

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function sql(value: string | number | null): string {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function insert(table: string, row: Record<string, string | number | null>): string {
  const columns = Object.keys(row);
  const values = columns.map((c) => sql(row[c]));
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

/** SQL that wipes the e2e users (cascading to their profiles) and recreates the fixed fixtures. */
export function seedSql(now = Date.now()): string {
  const expiresAt = now + 30 * DAY_MS;
  const statements: string[] = [
    `DELETE FROM users WHERE id IN (${sql(NEW_PARENT.id)}, ${sql(FAMILY_PARENT.id)});`,
    'DELETE FROM rate_limits;',
    'DELETE FROM auth_tokens;',
  ];

  for (const parent of [NEW_PARENT, FAMILY_PARENT]) {
    statements.push(
      insert('users', {
        id: parent.id,
        email: parent.email,
        subscription_status: 'plus',
        created_at: now,
        updated_at: now,
      }),
      insert('sessions', {
        session_hash: sha256Hex(parent.sessionToken),
        user_id: parent.id,
        expires_at: expiresAt,
        created_at: now,
        last_seen_at: now,
      })
    );
  }

  statements.push(
    insert('child_profiles', {
      id: JUNIPER.profileId,
      user_id: FAMILY_PARENT.id,
      child_name: JUNIPER.childName,
      play_token_hash: sha256Hex(JUNIPER.playToken),
      play_code: JUNIPER.playCode,
      created_at: now,
      updated_at: now,
    }),
    insert('custom_words', {
      id: 'e2e-word-sam',
      profile_id: JUNIPER.profileId,
      word: 'SAM',
      category: 'family',
      prompt_label: 'Sam',
      prompt_emoji: null,
      photo_asset_id: null,
      audio_asset_id: null,
      sort_order: 0,
      created_at: now,
      updated_at: now,
    })
  );

  return statements.join('\n');
}

async function runWrangler(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync(
    path.join(ROOT, 'scripts', 'low-priority.sh'),
    [path.join(ROOT, 'node_modules', '.bin', 'wrangler'), ...args],
    { cwd: ROOT, maxBuffer: 16 * 1024 * 1024 }
  );
  return stdout;
}

export async function applyMigrations(): Promise<void> {
  await runWrangler(['d1', 'migrations', 'apply', DB_NAME, ...WRANGLER_ARGS]);
}

/** Resets the e2e fixtures in local D1. Safe to call before every test. */
export async function seedDatabase(): Promise<void> {
  await runWrangler(['d1', 'execute', DB_NAME, ...WRANGLER_ARGS, '--command', seedSql()]);
}
