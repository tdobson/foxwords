import { NextResponse } from 'next/server';
import audioInventory from '../../../constants/audio-inventory.json';

export const dynamic = 'force-static';

export async function GET() {
  return NextResponse.json({
    phonemes: audioInventory.phonemes ?? [],
    letterNames: audioInventory['letter-names'] ?? [],
    words: audioInventory.words ?? [],
    numbers: audioInventory.numbers ?? [],
    plurals: audioInventory.plurals ?? [],
    clocks: audioInventory.clock ?? [],
  });
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
