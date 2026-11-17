export const TTS_MODEL = 'openai/gpt-audio';
export const TTS_VOICE = 'ballad';
export const TTS_PROMPT_VERSION = 'v1';
export const TTS_CACHE_PREFIX = 'tts/v1';
export const TTS_SAMPLE_RATE = 24000;
export const TTS_MAX_CHARS = 40;
export const TTS_RATE_WINDOW_MS = 60 * 60 * 1000;
export const TTS_RATE_MAX_GENERATIONS = 60;
export const TTS_GLOBAL_WINDOW_MS = 24 * 60 * 60 * 1000;
export const TTS_GLOBAL_MAX_GENERATIONS = 2000;
export const TTS_UPSTREAM_TIMEOUT_MS = 20000;

export const TTS_SYSTEM_PROMPT =
  'You are the voice of a gentle, cheerful phonics game for children aged three to six. ' +
  'Speak in a clear, warm, friendly British English accent (standard Southern British, Received Pronunciation), ' +
  'slightly slow and very clearly articulated. Read the text the user gives you exactly, word for word. ' +
  'Do not add, remove or change any words, do not greet, and do not say anything else.';
