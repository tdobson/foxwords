import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { PHONEMES } from '../../../constants/phonemes';
import { LETTER_NAMES } from '../../../constants/letter-names';
import { LEARNING_WORDS } from '../../../constants/learning-words';

const AUDIO_ROOT = path.join(process.cwd(), 'public', 'audio');
const ALLOWED_PHONEMES = new Set(PHONEMES.map((phoneme) => phoneme.slug));
const ALLOWED_LETTER_NAMES = new Set(LETTER_NAMES.map((letterName) => letterName.slug));
const ALLOWED_WORDS = new Set(LEARNING_WORDS.map((word) => word.id));
const MAX_BYTES = 5_000_000;

async function listExisting(dirName: string): Promise<string[]> {
  try {
    const files = await fs.readdir(path.join(AUDIO_ROOT, dirName));
    return files
      .filter((file) => file.endsWith('.webm'))
      .map((file) => file.replace(/\.webm$/, ''));
  } catch {
    return [];
  }
}

export const dynamic = 'force-static';

export async function GET() {
  const [phonemes, letterNames, words] = await Promise.all([
    listExisting('phonemes'),
    listExisting('letter-names'),
    listExisting('words'),
  ]);
  return NextResponse.json({ phonemes, letterNames, words });
}

export async function POST(request: NextRequest) {
  let body: { kind?: string; id?: string; audioBase64?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { kind, id, audioBase64 } = body;

  if (typeof id !== 'string' || !/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let dirName: string | null = null;
  if (kind === 'phoneme' && ALLOWED_PHONEMES.has(id)) {
    dirName = 'phonemes';
  } else if (kind === 'letter-name' && ALLOWED_LETTER_NAMES.has(id)) {
    dirName = 'letter-names';
  } else if (kind === 'word' && ALLOWED_WORDS.has(id)) {
    dirName = 'words';
  }
  if (!dirName) {
    return NextResponse.json({ error: 'Invalid kind or id' }, { status: 400 });
  }

  if (typeof audioBase64 !== 'string' || audioBase64.length === 0) {
    return NextResponse.json({ error: 'Missing audio data' }, { status: 400 });
  }

  const buffer = Buffer.from(audioBase64, 'base64');
  if (buffer.length === 0 || buffer.length > MAX_BYTES) {
    return NextResponse.json({ error: 'Audio data too large or empty' }, { status: 400 });
  }

  const dirPath = path.join(AUDIO_ROOT, dirName);
  await fs.mkdir(dirPath, { recursive: true });
  await fs.writeFile(path.join(dirPath, `${id}.webm`), buffer);

  return NextResponse.json({ ok: true });
}
