/**
 * @fileoverview Letter names for each phoneme (sound) — used so the game can
 * play both the phonic sound ("kuh") and the letter name ("kay") for a letter.
 * The letter name is recorded as a clip at public/audio/letter-names/{slug}.webm.
 * @module constants/letter-names
 */

export interface LetterName {
  /** Phoneme slug this letter name belongs to */
  slug: string;
  /** The letter name, as you would say it (used for display and tooltips) */
  name: string;
  /** How to say the letter name (used for the recorded clip) */
  label: string;
}

export const LETTER_NAMES: LetterName[] = [
  { slug: 'ae', name: 'A', label: 'A as in apple' },
  { slug: 'e', name: 'E', label: 'E as in egg' },
  { slug: 'i', name: 'I', label: 'I as in igloo' },
  { slug: 'o', name: 'O', label: 'O as in octopus' },
  { slug: 'u', name: 'U', label: 'U as in umbrella' },
  { slug: 'b', name: 'B', label: 'B as in bee' },
  { slug: 'd', name: 'D', label: 'D as in dog' },
  { slug: 'f', name: 'F', label: 'F as in fox' },
  { slug: 'g', name: 'G', label: 'G as in goat' },
  { slug: 'h', name: 'H', label: 'H as in hat' },
  { slug: 'j', name: 'J', label: 'J as in jam' },
  { slug: 'k', name: 'K', label: 'K as in kite' },
  { slug: 'l', name: 'L', label: 'L as in lion' },
  { slug: 'm', name: 'M', label: 'M as in meg' },
  { slug: 'n', name: 'N', label: 'N as in nose' },
  { slug: 'ng', name: 'NG', label: 'NG as in ring' },
  { slug: 'p', name: 'P', label: 'P as in pig' },
  { slug: 'r', name: 'R', label: 'R as in rain' },
  { slug: 's', name: 'S', label: 'S as in sun' },
  { slug: 'sh', name: 'SH', label: 'SH as in ship' },
  { slug: 't', name: 'T', label: 'T as in train' },
  { slug: 'ch', name: 'CH', label: 'CH as in chair' },
  { slug: 'th', name: 'TH', label: 'TH as in thumb' },
  { slug: 'th2', name: 'TH', label: 'TH as in the' },
  { slug: 'v', name: 'V', label: 'V as in van' },
  { slug: 'w', name: 'W', label: 'W as in water' },
  { slug: 'y', name: 'Y', label: 'Y as in yellow' },
  { slug: 'z', name: 'Z', label: 'Z as in zebra' },
  { slug: 'ks', name: 'X', label: 'X as in box' },
  { slug: 'qu', name: 'Q', label: 'Q as in queen' },
];

export function getLetterNameLabel(slug: string): string | undefined {
  return LETTER_NAMES.find((item) => item.slug === slug)?.label;
}
