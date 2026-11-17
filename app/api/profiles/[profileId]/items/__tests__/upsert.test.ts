import { NextRequest } from 'next/server';
import { setMockRuntimeEnv } from '../../../../../../lib/cloudflare-context';
import type { D1DatabaseLike, D1PreparedStatementLike } from '../../../../../../lib/db/client';
import { POST } from '../route';

jest.mock('../../../../../../lib/security/request', () => ({
  assertSameOrigin: jest.fn(),
}));
jest.mock('../../../../../../lib/security/session', () => ({
  getSessionUser: jest.fn(async () => ({ id: 'usr_1' })),
}));

class FakeWordsDb implements D1DatabaseLike {
  profiles = [{ id: 'prof_1', user_id: 'usr_1' }];
  words: any[] = [];

  async batch<T = unknown>(
    statements: D1PreparedStatementLike[]
  ): Promise<Array<{ results: T[]; success: boolean }>> {
    const out = [];
    for (const stmt of statements) {
      out.push({ results: (await stmt.all<T>()).results, success: true });
    }
    return out;
  }

  async exec(): Promise<{ count: number; duration: number }> {
    return { count: 0, duration: 0 };
  }

  prepare(query: string): D1PreparedStatementLike {
    const q = query.replace(/\s+/g, ' ').trim();
    const db = this;
    let args: unknown[] = [];
    const stmt = {
      bind(...values: unknown[]) {
        args = values;
        return stmt;
      },
      async first<T>(): Promise<T | null> {
        if (q.startsWith('SELECT id, user_id, child_name')) {
          const [id, userId] = args as string[];
          return (db.profiles.find((p) => p.id === id && p.user_id === userId) ?? null) as T;
        }
        if (q.includes('FROM custom_words WHERE profile_id = ? AND word = ?')) {
          const [profileId, word] = args as string[];
          return (db.words.find((w) => w.profile_id === profileId && w.word === word) ?? null) as T;
        }
        throw new Error(`Unexpected first(): ${q}`);
      },
      async all<T>() {
        return { results: [] as T[] };
      },
      async run() {
        if (q.startsWith('INSERT INTO custom_words')) {
          const [
            id,
            profile_id,
            word,
            category,
            prompt_label,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            sort_order,
            created_at,
            updated_at,
          ] = args;
          db.words.push({
            id,
            profile_id,
            word,
            category,
            prompt_label,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            sort_order,
            created_at,
            updated_at,
          });
        } else if (q.startsWith('UPDATE custom_words SET prompt_label')) {
          const [
            prompt_label,
            category,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            updated_at,
            id,
            profile_id,
          ] = args;
          const row = db.words.find((w) => w.id === id && w.profile_id === profile_id);
          Object.assign(row, {
            prompt_label,
            category,
            prompt_emoji,
            photo_asset_id,
            audio_asset_id,
            updated_at,
          });
        } else {
          throw new Error(`Unexpected run(): ${q}`);
        }
        return { success: true };
      },
    };
    return stmt as unknown as D1PreparedStatementLike;
  }
}

function postItem(body: unknown) {
  return new NextRequest('http://localhost/api/profiles/prof_1/items', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/profiles/[profileId]/items (upsert by word)', () => {
  let db: FakeWordsDb;

  beforeEach(() => {
    db = new FakeWordsDb();
    setMockRuntimeEnv({ DB: db, APP_ORIGIN: 'http://localhost' } as any);
  });

  const call = (body: unknown) =>
    POST(postItem(body) as any, { params: Promise.resolve({ profileId: 'prof_1' }) });

  it('creates a word the first time and returns 201', async () => {
    const res = await call({ word: 'mummy', promptLabel: 'Mummy', category: 'vip' });
    expect(res.status).toBe(201);
    expect(db.words).toHaveLength(1);
    expect(db.words[0].word).toBe('MUMMY');
  });

  it('returns the existing row instead of duplicating the same word', async () => {
    await call({ word: 'Mummy', promptLabel: 'Mummy', category: 'vip' });
    const res = await call({ word: 'MUMMY', promptLabel: 'Mummy', category: 'vip' });
    expect(res.status).toBe(200);
    expect(db.words).toHaveLength(1);
  });

  it('replaces the audio on re-record without creating a second word', async () => {
    await call({ word: 'Juniper', promptLabel: 'Juniper', category: 'family' });
    const res = await call({
      word: 'Juniper',
      promptLabel: 'Juniper',
      category: 'family',
      audioAssetId: 'ast_new',
    });
    const body: any = await res.json();
    expect(db.words).toHaveLength(1);
    expect(db.words[0].audio_asset_id).toBe('ast_new');
    expect(body.item.audio_asset_id).toBe('ast_new');
  });

  it('keeps an existing recording when a name is saved again without audio', async () => {
    await call({ word: 'Rover', promptLabel: 'Rover', category: 'pet', audioAssetId: 'ast_1' });
    await call({ word: 'Rover', promptLabel: 'Rover', category: 'pet' });
    expect(db.words).toHaveLength(1);
    expect(db.words[0].audio_asset_id).toBe('ast_1');
  });
});
