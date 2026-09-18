import { COUNT_NUMBERS } from '../../constants/count-numbers';
import { getObjectSpokenLabel } from '../../constants/count-plurals';
import { LEARNING_WORDS } from '../../constants/learning-words';

export interface StudioPromptItem {
  key: string;
  chapter: 1 | 2 | 3 | 4;
  targetWord: string;
  promptLabel: string;
  hint: string;
  kind:
    | 'child'
    | 'sibling'
    | 'caregiver'
    | 'vip'
    | 'pet'
    | 'phoneme'
    | 'letter-name'
    | 'number'
    | 'plural'
    | 'word'
    | 'praise';
  clipKey: string;
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
    title: 'Family & VIPs',
    description: 'Record your child, family members, and VIP words',
    mandatory: true,
  },
  {
    id: 2,
    title: 'Phonics & Letters',
    description: '26 alphabet phonemes and letter names',
    mandatory: false,
  },
  {
    id: 3,
    title: 'Numbers & Counting',
    description: 'Numbers 1 to 10 and common plurals',
    mandatory: false,
  },
  {
    id: 4,
    title: 'Starter Words & Praise',
    description: 'Starter curriculum words and celebratory praise phrases',
    mandatory: false,
  },
];

export interface BuildStudioQueueOptions {
  childName: string;
  siblings?: string[];
  caregivers?: string[];
  pets?: string[];
  starterWords?: string[];
}

const DEFAULT_CAREGIVERS = ['Mum', 'Dad', 'Grandad'];

const ALPHABET_ITEMS: Array<{
  letter: string;
  phonemeSlug: string;
  letterSlug: string;
  phonemeLabel: string;
  letterLabel: string;
}> = [
  {
    letter: 'A',
    phonemeSlug: 'ae',
    letterSlug: 'a',
    phonemeLabel: 'a as in cat',
    letterLabel: 'A as in apple',
  },
  {
    letter: 'B',
    phonemeSlug: 'b',
    letterSlug: 'b',
    phonemeLabel: 'b as in bed',
    letterLabel: 'B as in bee',
  },
  {
    letter: 'C',
    phonemeSlug: 'k',
    letterSlug: 'c',
    phonemeLabel: 'c as in cat',
    letterLabel: 'C as in cat',
  },
  {
    letter: 'D',
    phonemeSlug: 'd',
    letterSlug: 'd',
    phonemeLabel: 'd as in dog',
    letterLabel: 'D as in dog',
  },
  {
    letter: 'E',
    phonemeSlug: 'e',
    letterSlug: 'e',
    phonemeLabel: 'e as in bed',
    letterLabel: 'E as in egg',
  },
  {
    letter: 'F',
    phonemeSlug: 'f',
    letterSlug: 'f',
    phonemeLabel: 'f as in fox',
    letterLabel: 'F as in fox',
  },
  {
    letter: 'G',
    phonemeSlug: 'g',
    letterSlug: 'g',
    phonemeLabel: 'g as in goat',
    letterLabel: 'G as in goat',
  },
  {
    letter: 'H',
    phonemeSlug: 'h',
    letterSlug: 'h',
    phonemeLabel: 'h as in hat',
    letterLabel: 'H as in hat',
  },
  {
    letter: 'I',
    phonemeSlug: 'i',
    letterSlug: 'i',
    phonemeLabel: 'i as in milk',
    letterLabel: 'I as in igloo',
  },
  {
    letter: 'J',
    phonemeSlug: 'j',
    letterSlug: 'j',
    phonemeLabel: 'j as in jam',
    letterLabel: 'J as in jam',
  },
  {
    letter: 'K',
    phonemeSlug: 'k',
    letterSlug: 'k',
    phonemeLabel: 'k as in kite',
    letterLabel: 'K as in kite',
  },
  {
    letter: 'L',
    phonemeSlug: 'l',
    letterSlug: 'l',
    phonemeLabel: 'l as in lion',
    letterLabel: 'L as in lion',
  },
  {
    letter: 'M',
    phonemeSlug: 'm',
    letterSlug: 'm',
    phonemeLabel: 'm as in meg',
    letterLabel: 'M as in meg',
  },
  {
    letter: 'N',
    phonemeSlug: 'n',
    letterSlug: 'n',
    phonemeLabel: 'n as in nose',
    letterLabel: 'N as in nose',
  },
  {
    letter: 'O',
    phonemeSlug: 'o',
    letterSlug: 'o',
    phonemeLabel: 'o as in dog',
    letterLabel: 'O as in octopus',
  },
  {
    letter: 'P',
    phonemeSlug: 'p',
    letterSlug: 'p',
    phonemeLabel: 'p as in pig',
    letterLabel: 'P as in pig',
  },
  {
    letter: 'Q',
    phonemeSlug: 'qu',
    letterSlug: 'q',
    phonemeLabel: 'qu as in queen',
    letterLabel: 'Q as in queen',
  },
  {
    letter: 'R',
    phonemeSlug: 'r',
    letterSlug: 'r',
    phonemeLabel: 'r as in rain',
    letterLabel: 'R as in rain',
  },
  {
    letter: 'S',
    phonemeSlug: 's',
    letterSlug: 's',
    phonemeLabel: 's as in sun',
    letterLabel: 'S as in sun',
  },
  {
    letter: 'T',
    phonemeSlug: 't',
    letterSlug: 't',
    phonemeLabel: 't as in train',
    letterLabel: 'T as in train',
  },
  {
    letter: 'U',
    phonemeSlug: 'u',
    letterSlug: 'u',
    phonemeLabel: 'u as in cup',
    letterLabel: 'U as in umbrella',
  },
  {
    letter: 'V',
    phonemeSlug: 'v',
    letterSlug: 'v',
    phonemeLabel: 'v as in van',
    letterLabel: 'V as in van',
  },
  {
    letter: 'W',
    phonemeSlug: 'w',
    letterSlug: 'w',
    phonemeLabel: 'w as in water',
    letterLabel: 'W as in water',
  },
  {
    letter: 'X',
    phonemeSlug: 'ks',
    letterSlug: 'x',
    phonemeLabel: 'ks as in box',
    letterLabel: 'X as in box',
  },
  {
    letter: 'Y',
    phonemeSlug: 'y',
    letterSlug: 'y',
    phonemeLabel: 'y as in yellow',
    letterLabel: 'Y as in yellow',
  },
  {
    letter: 'Z',
    phonemeSlug: 'z',
    letterSlug: 'z',
    phonemeLabel: 'z as in zebra',
    letterLabel: 'Z as in zebra',
  },
];

const DEFAULT_PLURAL_IDS = [
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

const DEFAULT_STARTER_WORD_IDS = [
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

const PRAISE_ITEMS: Array<{ clipKey: string; phrase: string; hint: string }> = [
  { clipKey: 'praise_great_job', phrase: 'Great job!', hint: 'Praise: Great job!' },
  {
    clipKey: 'praise_brilliant',
    phrase: 'Brilliant spelling!',
    hint: 'Praise: Brilliant spelling!',
  },
  { clipKey: 'praise_well_done', phrase: 'Well done!', hint: 'Praise: Well done!' },
  { clipKey: 'praise_super_star', phrase: 'Super star!', hint: 'Praise: Super star!' },
  { clipKey: 'praise_fantastic', phrase: 'Fantastic!', hint: 'Praise: Fantastic!' },
];

function sanitizeKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

export function buildStudioQueue(options: BuildStudioQueueOptions): StudioPromptItem[] {
  const items: StudioPromptItem[] = [];

  // -------------------------------------------------------------
  // CHAPTER 1: Family & VIPs (Child name, Siblings, Caregivers, Pets)
  // -------------------------------------------------------------
  const normalizedChild = options.childName.trim();
  const childWord = normalizedChild.toUpperCase();
  const childKey = sanitizeKey(normalizedChild);

  items.push({
    key: `ch1_child_${childKey}`,
    chapter: 1,
    targetWord: childWord,
    promptLabel: normalizedChild,
    hint: "Child's Name",
    kind: 'child',
    clipKey: `word_${childKey}`,
    assetKind: 'word-audio',
  });

  if (options.siblings) {
    for (const sib of options.siblings) {
      const trimmed = sib.trim();
      if (!trimmed) {
        continue;
      }
      const sibKey = sanitizeKey(trimmed);
      items.push({
        key: `ch1_sibling_${sibKey}`,
        chapter: 1,
        targetWord: trimmed.toUpperCase(),
        promptLabel: trimmed,
        hint: 'Brother / Sister',
        kind: 'sibling',
        clipKey: `word_${sibKey}`,
        assetKind: 'word-audio',
      });
    }
  }

  const caregivers = options.caregivers ?? DEFAULT_CAREGIVERS;
  for (const cg of caregivers) {
    const trimmed = cg.trim();
    if (!trimmed) {
      continue;
    }
    const cgKey = sanitizeKey(trimmed);
    items.push({
      key: `ch1_caregiver_${cgKey}`,
      chapter: 1,
      targetWord: trimmed.toUpperCase(),
      promptLabel: trimmed,
      hint: 'Caregiver / VIP',
      kind: 'vip',
      clipKey: `word_${cgKey}`,
      assetKind: 'word-audio',
    });
  }

  if (options.pets) {
    for (const pet of options.pets) {
      const trimmed = pet.trim();
      if (!trimmed) {
        continue;
      }
      const petKey = sanitizeKey(trimmed);
      items.push({
        key: `ch1_pet_${petKey}`,
        chapter: 1,
        targetWord: trimmed.toUpperCase(),
        promptLabel: trimmed,
        hint: 'Family Pet',
        kind: 'pet',
        clipKey: `word_${petKey}`,
        assetKind: 'word-audio',
      });
    }
  }

  // -------------------------------------------------------------
  // CHAPTER 2: Phonics & Letters (26 phonemes + 26 letter names)
  // -------------------------------------------------------------
  for (const alpha of ALPHABET_ITEMS) {
    items.push({
      key: `ch2_phoneme_${alpha.letter.toLowerCase()}`,
      chapter: 2,
      targetWord: alpha.letter,
      promptLabel: alpha.phonemeLabel,
      hint: `Sound for letter ${alpha.letter}`,
      kind: 'phoneme',
      clipKey: `phoneme_${alpha.phonemeSlug}`,
      assetKind: 'system-audio',
    });
  }

  for (const alpha of ALPHABET_ITEMS) {
    items.push({
      key: `ch2_letter_${alpha.letter.toLowerCase()}`,
      chapter: 2,
      targetWord: alpha.letter,
      promptLabel: alpha.letterLabel,
      hint: `Name of letter ${alpha.letter}`,
      kind: 'letter-name',
      clipKey: `letter_${alpha.letterSlug}`,
      assetKind: 'system-audio',
    });
  }

  // -------------------------------------------------------------
  // CHAPTER 3: Numbers (1 to 10) + Plurals
  // -------------------------------------------------------------
  const numbersToTen = COUNT_NUMBERS.slice(0, 10);
  for (const num of numbersToTen) {
    items.push({
      key: `ch3_number_${num.value}`,
      chapter: 3,
      targetWord: String(num.value),
      promptLabel: num.name,
      hint: `Number ${num.value}`,
      kind: 'number',
      clipKey: `number_${num.value}`,
      assetKind: 'system-audio',
    });
  }

  for (const pluralId of DEFAULT_PLURAL_IDS) {
    const word = LEARNING_WORDS.find((w) => w.id === pluralId);
    if (!word) {
      continue;
    }
    const pluralLabel = getObjectSpokenLabel({ word, count: 2 });
    items.push({
      key: `ch3_plural_${pluralId}`,
      chapter: 3,
      targetWord: word.word,
      promptLabel: pluralLabel,
      hint: `${word.word} (plural)`,
      kind: 'plural',
      clipKey: `plural_${pluralId}`,
      assetKind: 'system-audio',
    });
  }

  // -------------------------------------------------------------
  // CHAPTER 4: Starter Words & Praise clips
  // -------------------------------------------------------------
  const starterWordIds = options.starterWords ?? DEFAULT_STARTER_WORD_IDS;
  for (const wordId of starterWordIds) {
    const word = LEARNING_WORDS.find((w) => w.id === wordId);
    if (!word) {
      continue;
    }
    items.push({
      key: `ch4_word_${wordId}`,
      chapter: 4,
      targetWord: word.word,
      promptLabel: word.promptLabel,
      hint: 'Starter Word',
      kind: 'word',
      clipKey: `word_${wordId}`,
      assetKind: 'word-audio',
    });
  }

  for (const praise of PRAISE_ITEMS) {
    items.push({
      key: `ch4_${praise.clipKey}`,
      chapter: 4,
      targetWord: praise.phrase.toUpperCase(),
      promptLabel: praise.phrase,
      hint: praise.hint,
      kind: 'praise',
      clipKey: praise.clipKey,
      assetKind: 'system-audio',
    });
  }

  return items;
}
