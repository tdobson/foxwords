/**
 * @fileoverview Phoneme catalog used for recorded audio
 * @module constants/phonemes
 */

import { Phoneme } from '../types/learning-word.types';

export const PHONEMES: Phoneme[] = [
  {
    symbol: 'æ',
    slug: 'ae',
    label: 'a as in cat',
    examples: ['cat', 'jam', 'tram', 'track', 'apple', 'daddy'],
  },
  { symbol: 'ɑː', slug: 'ah', label: 'ar as in far', examples: ['grandma', 'grandpa', 'banana'] },
  { symbol: 'ə', slug: 'uh', label: 'uh as in banana', examples: ['sarah', 'banana', 'tractor'] },
  { symbol: 'iː', slug: 'ee', label: 'ee as in see', examples: ['mummy', 'daddy', 'granny'] },
  {
    symbol: 'eɪ',
    slug: 'ai',
    label: 'ay as in rain',
    examples: ['james', 'rain', 'games', 'train', 'rail', 'crane'],
  },
  { symbol: 'aɪ', slug: 'ie', label: 'igh as in bike', examples: ['bike'] },
  { symbol: 'ɒ', slug: 'o', label: 'o as in dog', examples: ['fox', 'orange', 'dog'] },
  { symbol: 'ʊ', slug: 'oo', label: 'oo as in book', examples: ['book'] },
  { symbol: 'ɔː', slug: 'or', label: 'aw as in saw', examples: ['jigsaw'] },
  { symbol: 'eə', slug: 'air', label: 'air as in hair', examples: ['sarah'] },
  { symbol: 'e', slug: 'e', label: 'e as in bed', examples: ['meg', 'bed'] },
  { symbol: 'ɪ', slug: 'i', label: 'i as in milk', examples: ['milk', 'orange', 'jigsaw', 'big'] },
  { symbol: 'ʌ', slug: 'u', label: 'u as in cup', examples: ['mummy'] },
  {
    symbol: 'b',
    slug: 'b',
    label: 'b as in bed',
    examples: ['bed', 'banana', 'bike', 'book', 'big'],
  },
  { symbol: 'd', slug: 'd', label: 'd as in dog', examples: ['dog', 'bed', 'daddy', 'granddad'] },
  { symbol: 'f', slug: 'f', label: 'f as in fox', examples: ['fox'] },
  {
    symbol: 'g',
    slug: 'g',
    label: 'g as in goat',
    examples: ['meg', 'dog', 'big', 'games', 'grandma', 'granddad', 'grandpa', 'granny', 'jigsaw'],
  },
  { symbol: 'dʒ', slug: 'j', label: 'j as in jam', examples: ['jam', 'james', 'jigsaw', 'orange'] },
  {
    symbol: 'k',
    slug: 'k',
    label: 'k as in cat',
    examples: ['cat', 'milk', 'book', 'bike', 'tractor', 'crane', 'track'],
  },
  { symbol: 'l', slug: 'l', label: 'l as in milk', examples: ['milk', 'apple', 'splash', 'rail'] },
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
      'rain',
      'train',
      'crane',
      'orange',
      'banana',
      'grandma',
      'granddad',
      'grandpa',
      'granny',
    ],
  },
  { symbol: 'p', slug: 'p', label: 'p as in pig', examples: ['grandpa', 'apple', 'splash'] },
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
      'granddad',
      'grandpa',
      'granny',
    ],
  },
  { symbol: 's', slug: 's', label: 's as in sun', examples: ['sarah', 'splash', 'jigsaw'] },
  { symbol: 'ʃ', slug: 'sh', label: 'sh as in ship', examples: ['splash'] },
  {
    symbol: 't',
    slug: 't',
    label: 't as in cat',
    examples: ['cat', 'tram', 'train', 'track', 'tractor'],
  },
  { symbol: 'z', slug: 'z', label: 'z as in zebra', examples: ['james', 'games'] },
  { symbol: 'ks', slug: 'ks', label: 'ks as in box', examples: ['fox'] },
];

export const SILENT_SYMBOL = '';

const PHONEME_SLUG_BY_SYMBOL: Record<string, string> = Object.fromEntries(
  PHONEMES.map((phoneme) => [phoneme.symbol, phoneme.slug])
);

export function getPhonemeSlug(symbol: string): string {
  return PHONEME_SLUG_BY_SYMBOL[symbol] ?? '';
}
