import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';

const AUDIO_ROOT = path.join(process.cwd(), 'public', 'audio');

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
  const [phonemes, letterNames, words, numbers, plurals, clocks] = await Promise.all([
    listExisting('phonemes'),
    listExisting('letter-names'),
    listExisting('words'),
    listExisting('numbers'),
    listExisting('plurals'),
    listExisting('clock'),
  ]);
  return NextResponse.json({ phonemes, letterNames, words, numbers, plurals, clocks });
}

export async function POST() {
  return NextResponse.json(
    {
      error:
        'The legacy filesystem audio recording endpoint is retired on Cloudflare Workers. Family audio is recorded to authenticated profile R2 storage.',
    },
    { status: 410 }
  );
}
