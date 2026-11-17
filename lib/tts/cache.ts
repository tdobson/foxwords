import { sha256Hex } from '../security/crypto';
import { TTS_CACHE_PREFIX, TTS_PROMPT_VERSION, TTS_VOICE } from './config';

export async function ttsCacheKey(text: string): Promise<string> {
  const digest = await sha256Hex(`${TTS_VOICE}|${TTS_PROMPT_VERSION}|${text.toLowerCase()}`);
  return `${TTS_CACHE_PREFIX}/${digest}.wav`;
}
