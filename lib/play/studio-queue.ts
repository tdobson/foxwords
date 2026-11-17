import { COUNT_NUMBERS } from '../../constants/count-numbers';
import { getObjectSpokenLabel } from '../../constants/count-plurals';
import { LEARNING_WORDS } from '../../constants/learning-words';

export type StudioPromptKind =
  | 'child'
  | 'sibling'
  | 'caregiver'
  | 'pet'
  | 'phoneme'
  | 'letter-name'
  | 'number'
  | 'plural'
  | 'word'
  | 'praise';

export interface StudioPromptItem {
  key: string;
  chapter: 1 | 2 | 3 | 4;
  /** Upper-case word stored for custom words, e.g. JUNIPER. */
  targetWord: string;
  /** Big text on screen, in natural case: "Juniper", "cats", "7". */
  displayWord: string;
  /** What the parent says, in plain words: "cats", "twelve", "bee". */
  promptLabel: string;
  /** One plain instruction line: "Say: cats", "Say the letter name: bee". */
  instruction: string;
  hint: string;
  kind: StudioPromptKind;
  clipKey: string;
  /** word-audio: saved as a family word. system-audio: saved as an audio override for a clip key. */
  assetKind: 'word-audio' | 'system-audio';
}

export interface StudioChapter {
  id: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  mandatory: boolean;
}

export const STUDIO_CHAPTERS: StudioChapter[] = [
  {
    id: 1,
    title: 'Family',
    description: 'Your child, family members and pets',
    mandatory: true,
  },
  {
    id: 2,
    title: 'Letter sounds and names',
    description: 'The sound each letter makes, and what it is called',
    mandatory: false,
  },
  {
    id: 3,
    title: 'Numbers',
    description: 'Counting from 1 to 20, and some plurals',
    mandatory: false,
  },
  {
    id: 4,
    title: 'Words',
    description: 'Starter words in your voice',
    mandatory: false,
  },
];

export interface BuildStudioQueueOptions {
  childName: string;
  siblings?: string[];
  /** Family chips the parent picked, e.g. Mummy, Grandma, or a name typed in. */
  familyMembers?: string[];
  /** Older name for familyMembers, still accepted for existing callers. */
  caregivers?: string[];
  pets?: string[];
  starterWords?: string[];
}

export const DEFAULT_FAMILY_MEMBERS = ['Mummy', 'Daddy'];

interface AlphabetEntry {
  letter: string;
  phonemeSlug: string;
  letterSlug: string;
  /** A word that starts with the sound, e.g. "bat" for b. */
  soundExample: string;
  /** The spoken letter name, e.g. "bee" for B. */
  letterName: string;
}

export const ALPHABET: AlphabetEntry[] = [
  { letter: 'A', phonemeSlug: 'ae', letterSlug: 'a', soundExample: 'cat', letterName: 'ay' },
  { letter: 'B', phonemeSlug: 'b', letterSlug: 'b', soundExample: 'bat', letterName: 'bee' },
  { letter: 'C', phonemeSlug: 'k', letterSlug: 'c', soundExample: 'cat', letterName: 'see' },
  { letter: 'D', phonemeSlug: 'd', letterSlug: 'd', soundExample: 'dog', letterName: 'dee' },
  { letter: 'E', phonemeSlug: 'e', letterSlug: 'e', soundExample: 'egg', letterName: 'ee' },
  { letter: 'F', phonemeSlug: 'f', letterSlug: 'f', soundExample: 'fox', letterName: 'eff' },
  { letter: 'G', phonemeSlug: 'g', letterSlug: 'g', soundExample: 'goat', letterName: 'jee' },
  { letter: 'H', phonemeSlug: 'h', letterSlug: 'h', soundExample: 'hat', letterName: 'aitch' },
  { letter: 'I', phonemeSlug: 'i', letterSlug: 'i', soundExample: 'igloo', letterName: 'eye' },
  { letter: 'J', phonemeSlug: 'j', letterSlug: 'j', soundExample: 'jam', letterName: 'jay' },
  { letter: 'K', phonemeSlug: 'k', letterSlug: 'k', soundExample: 'kite', letterName: 'kay' },
  { letter: 'L', phonemeSlug: 'l', letterSlug: 'l', soundExample: 'lion', letterName: 'el' },
  { letter: 'M', phonemeSlug: 'm', letterSlug: 'm', soundExample: 'moon', letterName: 'em' },
  { letter: 'N', phonemeSlug: 'n', letterSlug: 'n', soundExample: 'nest', letterName: 'en' },
  { letter: 'O', phonemeSlug: 'o', letterSlug: 'o', soundExample: 'octopus', letterName: 'oh' },
  { letter: 'P', phonemeSlug: 'p', letterSlug: 'p', soundExample: 'pig', letterName: 'pee' },
  { letter: 'Q', phonemeSlug: 'qu', letterSlug: 'q', soundExample: 'queen', letterName: 'cue' },
  { letter: 'R', phonemeSlug: 'r', letterSlug: 'r', soundExample: 'rain', letterName: 'ar' },
  { letter: 'S', phonemeSlug: 's', letterSlug: 's', soundExample: 'sun', letterName: 'ess' },
  { letter: 'T', phonemeSlug: 't', letterSlug: 't', soundExample: 'train', letterName: 'tee' },
  { letter: 'U', phonemeSlug: 'u', letterSlug: 'u', soundExample: 'umbrella', letterName: 'you' },
  { letter: 'V', phonemeSlug: 'v', letterSlug: 'v', soundExample: 'van', letterName: 'vee' },
  {
    letter: 'W',
    phonemeSlug: 'w',
    letterSlug: 'w',
    soundExample: 'water',
    letterName: 'double you',
  },
  { letter: 'X', phonemeSlug: 'ks', letterSlug: 'x', soundExample: 'box', letterName: 'ex' },
  { letter: 'Y', phonemeSlug: 'y', letterSlug: 'y', soundExample: 'yellow', letterName: 'why' },
  { letter: 'Z', phonemeSlug: 'z', letterSlug: 'z', soundExample: 'zebra', letterName: 'zed' },
];

const PLURAL_WORD_IDS = [
  'cat',
  'dog',
  'fox',
  'apple',
  'car',
  'book',
  'bus',
  'boat',
  'train',
  'tractor',
];

const STARTER_WORD_IDS = [
  'fox',
  'milk',
  'orange',
  'banana',
  'dog',
  'cat',
  'bike',
  'book',
  'tractor',
  'crane',
  'apple',
  'jam',
  'big',
  'bus',
  'van',
  'boat',
  'car',
];

function sanitizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function naturalCase(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/** Builds the ordered recording prompts. Names keep their natural case; clip keys follow the shared audio contract. */
export function buildStudioQueue(options: BuildStudioQueueOptions): StudioPromptItem[] {
  const items: StudioPromptItem[] = [];
  const seenNames = new Set<string>();

  const pushName = (
    name: string,
    kind: 'child' | 'sibling' | 'caregiver' | 'pet',
    hint: string
  ): void => {
    const natural = naturalCase(name);
    if (!natural || seenNames.has(natural.toLowerCase())) return;
    seenNames.add(natural.toLowerCase());
    items.push({
      key: `ch1_${kind}_${sanitizeKey(natural)}`,
      chapter: 1,
      targetWord: natural.toUpperCase(),
      displayWord: natural,
      promptLabel: natural,
      instruction: `Say: ${natural}`,
      hint,
      kind,
      clipKey: `word_${sanitizeKey(natural)}`,
      assetKind: 'word-audio',
    });
  };

  // Chapter 1: family
  pushName(options.childName, 'child', "Your child's name");
  for (const sibling of options.siblings ?? []) {
    pushName(sibling, 'sibling', 'Brother or sister');
  }
  for (const member of options.familyMembers ?? options.caregivers ?? DEFAULT_FAMILY_MEMBERS) {
    pushName(member, 'caregiver', 'Family');
  }
  for (const pet of options.pets ?? []) {
    pushName(pet, 'pet', 'Family pet');
  }

  // Chapter 2: letter sounds, then letter names
  for (const entry of ALPHABET) {
    items.push({
      key: `ch2_phoneme_${entry.letter.toLowerCase()}`,
      chapter: 2,
      targetWord: entry.letter,
      displayWord: entry.letter,
      promptLabel: entry.letter.toLowerCase(),
      instruction: `Say the sound ${entry.letter.toLowerCase()} makes, as in ${entry.soundExample}`,
      hint: `Sound for ${entry.letter}`,
      kind: 'phoneme',
      clipKey: `phoneme_${entry.phonemeSlug}`,
      assetKind: 'system-audio',
    });
  }
  for (const entry of ALPHABET) {
    items.push({
      key: `ch2_letter_${entry.letter.toLowerCase()}`,
      chapter: 2,
      targetWord: entry.letter,
      displayWord: entry.letter,
      promptLabel: entry.letterName,
      instruction: `Say the letter name: ${entry.letterName}`,
      hint: `Name of ${entry.letter}`,
      kind: 'letter-name',
      clipKey: `letter_${entry.letterSlug}`,
      assetKind: 'system-audio',
    });
  }

  // Chapter 3: numbers 1-20 (matches the counting game), then plurals
  for (const num of COUNT_NUMBERS.slice(0, 20)) {
    const spoken = num.name.toLowerCase();
    items.push({
      key: `ch3_number_${num.value}`,
      chapter: 3,
      targetWord: String(num.value),
      displayWord: String(num.value),
      promptLabel: spoken,
      instruction: `Say: ${spoken}`,
      hint: `Number ${num.value}`,
      kind: 'number',
      clipKey: `number_${num.value}`,
      assetKind: 'system-audio',
    });
  }
  for (const pluralId of PLURAL_WORD_IDS) {
    const word = LEARNING_WORDS.find((w) => w.id === pluralId);
    if (!word) continue;
    const plural = getObjectSpokenLabel({ word, count: 2 }).toLowerCase();
    items.push({
      key: `ch3_plural_${pluralId}`,
      chapter: 3,
      targetWord: plural.toUpperCase(),
      displayWord: plural,
      promptLabel: plural,
      instruction: `Say: ${plural}`,
      hint: 'Plural',
      kind: 'plural',
      clipKey: `plural_${pluralId}`,
      assetKind: 'system-audio',
    });
  }

  // Chapter 4: starter words (kept as family overrides)
  for (const wordId of options.starterWords ?? STARTER_WORD_IDS) {
    const word = LEARNING_WORDS.find((w) => w.id === wordId);
    if (!word) continue;
    const spoken = word.promptLabel.toLowerCase();
    items.push({
      key: `ch4_word_${wordId}`,
      chapter: 4,
      targetWord: word.word,
      displayWord: spoken,
      promptLabel: spoken,
      instruction: `Say: ${spoken}`,
      hint: 'Word',
      kind: 'word',
      clipKey: `word_${wordId}`,
      assetKind: 'system-audio',
    });
  }

  return items;
}

/** Default letter sound for a letter, used when a word has no phonics data (e.g. family names). */
export function defaultPhonemeSlugForLetter(letter: string): string | undefined {
  const upper = letter.toUpperCase();
  return ALPHABET.find((entry) => entry.letter === upper)?.phonemeSlug;
}
