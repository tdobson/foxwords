// Prints the list of bundled default voice clips as JSON, derived from the app's constants.
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const nodeRequire = createRequire(import.meta.url);

function loadTs(relPath) {
  const source = readFileSync(join(root, relPath), 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  const shim = (spec) => {
    if (spec.startsWith('.')) return {};
    return nodeRequire(spec);
  };
  new Function('exports', 'require', 'module', outputText)(mod.exports, shim, mod);
  return mod.exports;
}

const { LEARNING_WORDS } = loadTs('constants/learning-words.ts');
const { CLOCK_CURRICULUM } = loadTs('constants/clock-curriculum.ts');
const { getObjectSpokenLabel } = loadTs('constants/count-plurals.ts');
const ttsConfig = loadTs('lib/tts/config.ts');
const inventory = JSON.parse(readFileSync(join(root, 'constants/audio-inventory.json'), 'utf8'));

const SKIP_WORD_IDS = new Set(['james', 'sarah']);
const recordedKeys = new Set([
  ...inventory.words.map((id) => `word_${id}`),
  ...inventory.numbers.map((n) => `number_${n}`),
  ...inventory.plurals.map((id) => `plural_${id}`),
  ...inventory.clock.map((slug) => `clock_${slug}`),
]);

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
];
function numberWords(n) {
  if (n < 20) return ONES[n];
  if (n === 20) return 'twenty';
  throw new Error(`no word form for ${n}`);
}

// Letter names as they are said aloud (British), so the clip sounds like the letter name.
const LETTER_NAMES = {
  a: 'ay',
  b: 'bee',
  c: 'see',
  d: 'dee',
  e: 'ee',
  f: 'eff',
  g: 'jee',
  h: 'aitch',
  i: 'eye',
  j: 'jay',
  k: 'kay',
  l: 'el',
  m: 'em',
  n: 'en',
  o: 'oh',
  p: 'pee',
  q: 'cue',
  r: 'ar',
  s: 'ess',
  t: 'tee',
  u: 'you',
  v: 'vee',
  w: 'double you',
  x: 'ex',
  y: 'why',
  z: 'zed',
};

const clips = [];
const add = (entry) => {
  if (recordedKeys.has(entry.key)) return;
  clips.push(entry);
};

for (const [char, name] of Object.entries(LETTER_NAMES)) {
  add({ key: `letter_${char}`, kind: 'letter', text: name });
}

for (let n = 1; n <= 20; n++) {
  add({ key: `number_${n}`, kind: 'number', text: numberWords(n) });
}

const words = LEARNING_WORDS.filter((w) => !SKIP_WORD_IDS.has(w.id));
for (const word of words) {
  add({ key: `word_${word.id}`, kind: 'word', text: word.promptLabel });
}
// James and Sarah are family names from the old single-family prototype, not plurals.
for (const word of words) {
  add({ key: `plural_${word.id}`, kind: 'plural', text: getObjectSpokenLabel({ word, count: 2 }) });
}

const clockByKey = new Map();
for (const targets of Object.values(CLOCK_CURRICULUM)) {
  for (const target of targets) {
    const key = `clock_${target.audioSlug}`;
    const existing = clockByKey.get(key);
    if (existing && existing !== target.spokenPhrase) {
      throw new Error(`clock slug ${key} has two phrases: ${existing} / ${target.spokenPhrase}`);
    }
    clockByKey.set(key, target.spokenPhrase);
  }
}
for (const [key, text] of clockByKey) {
  add({ key, kind: 'clock', text });
}

const seen = new Set();
for (const clip of clips) {
  if (seen.has(clip.key)) throw new Error(`duplicate clip key ${clip.key}`);
  seen.add(clip.key);
}

const config = {
  model: ttsConfig.TTS_MODEL,
  voice: ttsConfig.TTS_VOICE,
  sampleRate: ttsConfig.TTS_SAMPLE_RATE,
  systemPrompt: ttsConfig.TTS_SYSTEM_PROMPT,
};

process.stdout.write(JSON.stringify({ config, clips }, null, 2) + '\n');
