/**
 * @fileoverview Phoneme catalog used for recorded audio
 * @module constants/phonemes
 */

import type { Phoneme } from '../types/learning-word.types';

export const PHONEMES: Phoneme[] = [
  // Short vowels
  {
    symbol: 'æ',
    slug: 'ae',
    label: 'a as in cat',
    examples: ['cat', 'jam', 'tram', 'track', 'apple', 'daddy'],
  },
  { symbol: 'e', slug: 'e', label: 'e as in bed', examples: ['bed', 'meg', 'egg'] },
  { symbol: 'ɪ', slug: 'i', label: 'i as in milk', examples: ['milk', 'big', 'pig', 'jigsaw'] },
  { symbol: 'ɒ', slug: 'o', label: 'o as in dog', examples: ['dog', 'fox', 'orange', 'hot'] },
  { symbol: 'ʌ', slug: 'u', label: 'u as in cup', examples: ['cup', 'mummy', 'sun', 'up'] },
  { symbol: 'ʊ', slug: 'oo', label: 'oo as in book', examples: ['book', 'look', 'cook'] },

  // Long vowels
  {
    symbol: 'ɑː',
    slug: 'ah',
    label: 'ar as in far',
    examples: ['grandma', 'grandpa', 'banana', 'car'],
  },
  { symbol: 'iː', slug: 'ee', label: 'ee as in see', examples: ['mummy', 'daddy', 'see', 'bee'] },
  { symbol: 'ɔː', slug: 'or', label: 'aw as in saw', examples: ['saw', 'jigsaw', 'law'] },
  { symbol: 'uː', slug: 'oo2', label: 'oo as in moon', examples: ['moon', 'blue', 'zoo'] },
  { symbol: 'ɜː', slug: 'er', label: 'er as in bird', examples: ['bird', 'girl', 'nurse'] },
  {
    symbol: 'ə',
    slug: 'uh',
    label: 'uh as in banana',
    examples: ['banana', 'sarah', 'tractor', 'about'],
  },

  // Diphthongs
  {
    symbol: 'eɪ',
    slug: 'ai',
    label: 'ay as in rain',
    examples: ['rain', 'james', 'games', 'train', 'rail', 'crane'],
  },
  { symbol: 'aɪ', slug: 'ie', label: 'igh as in bike', examples: ['bike', 'sky', 'fly'] },
  { symbol: 'ɔɪ', slug: 'oi', label: 'oy as in boy', examples: ['boy', 'toy'] },
  { symbol: 'əʊ', slug: 'oh', label: 'oh as in boat', examples: ['boat', 'go', 'no'] },
  { symbol: 'aʊ', slug: 'ow', label: 'ow as in cow', examples: ['cow', 'house', 'down'] },
  { symbol: 'eə', slug: 'air', label: 'air as in hair', examples: ['hair', 'sarah', 'chair'] },
  { symbol: 'ɪə', slug: 'ear', label: 'ear as in ear', examples: ['ear', 'here'] },

  // Consonants
  {
    symbol: 'b',
    slug: 'b',
    label: 'b as in bed',
    examples: ['bed', 'banana', 'bike', 'book', 'big'],
  },
  { symbol: 'd', slug: 'd', label: 'd as in dog', examples: ['dog', 'bed', 'daddy', 'grandad'] },
  { symbol: 'f', slug: 'f', label: 'f as in fox', examples: ['fox', 'fish', 'flower'] },
  {
    symbol: 'g',
    slug: 'g',
    label: 'g as in goat',
    examples: [
      'goat',
      'meg',
      'dog',
      'big',
      'games',
      'grandma',
      'grandad',
      'grandpa',
      'granny',
      'jigsaw',
    ],
  },
  { symbol: 'h', slug: 'h', label: 'h as in hat', examples: ['hat', 'house', 'horse'] },
  {
    symbol: 'dʒ',
    slug: 'j',
    label: 'j as in jam',
    examples: ['jam', 'james', 'jigsaw', 'orange', 'jump'],
  },
  {
    symbol: 'k',
    slug: 'k',
    label: 'k as in cat',
    examples: ['cat', 'milk', 'book', 'bike', 'tractor', 'crane', 'track'],
  },
  {
    symbol: 'l',
    slug: 'l',
    label: 'l as in milk',
    examples: ['milk', 'apple', 'splash', 'rail', 'lion'],
  },
  {
    symbol: 'm',
    slug: 'm',
    label: 'm as in meg',
    examples: ['meg', 'jam', 'milk', 'tram', 'mummy', 'grandma', 'games'],
  },
  {
    symbol: 'n',
    slug: 'n',
    label: 'n as in nose',
    examples: [
      'nose',
      'rain',
      'train',
      'crane',
      'orange',
      'banana',
      'grandma',
      'grandad',
      'grandpa',
      'granny',
    ],
  },
  { symbol: 'ŋ', slug: 'ng', label: 'ng as in ring', examples: ['ring', 'king', 'long'] },
  { symbol: 'p', slug: 'p', label: 'p as in pig', examples: ['pig', 'grandpa', 'apple', 'splash'] },
  {
    symbol: 'r',
    slug: 'r',
    label: 'r as in rain',
    examples: [
      'rain',
      'rail',
      'train',
      'track',
      'tram',
      'tractor',
      'crane',
      'orange',
      'sarah',
      'grandma',
      'grandad',
      'grandpa',
      'granny',
    ],
  },
  { symbol: 's', slug: 's', label: 's as in sun', examples: ['sun', 'sarah', 'splash', 'jigsaw'] },
  { symbol: 'ʃ', slug: 'sh', label: 'sh as in ship', examples: ['ship', 'splash', 'shoe'] },
  {
    symbol: 't',
    slug: 't',
    label: 't as in cat',
    examples: ['cat', 'tram', 'train', 'track', 'tractor'],
  },
  { symbol: 'tʃ', slug: 'ch', label: 'ch as in chair', examples: ['chair', 'chicken', 'train'] },
  { symbol: 'θ', slug: 'th', label: 'th as in thumb', examples: ['thumb', 'three'] },
  { symbol: 'ð', slug: 'th2', label: 'th as in the', examples: ['the', 'this', 'mother'] },
  { symbol: 'v', slug: 'v', label: 'v as in van', examples: ['van', 'seven', 'five'] },
  { symbol: 'w', slug: 'w', label: 'w as in water', examples: ['water', 'window', 'walrus'] },
  { symbol: 'j', slug: 'y', label: 'y as in yellow', examples: ['yellow', 'yes', 'you'] },
  { symbol: 'z', slug: 'z', label: 'z as in zebra', examples: ['zebra', 'james', 'games'] },
  { symbol: 'ks', slug: 'ks', label: 'ks as in box', examples: ['box', 'fox'] },
  { symbol: 'kw', slug: 'qu', label: 'qu as in queen', examples: ['queen', 'quiet'] },
];

export const SILENT_SYMBOL = '';

const PHONEME_SLUG_BY_SYMBOL: Record<string, string> = Object.fromEntries(
  PHONEMES.map((phoneme) => [phoneme.symbol, phoneme.slug])
);

export function getPhonemeSlug(symbol: string): string {
  return PHONEME_SLUG_BY_SYMBOL[symbol] ?? '';
}
