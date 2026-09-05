# Design Document: Levels 11–16 Expansion (Multisyllables, Digraphs, Plurals) & Seamless Celebration Toast

- **Date**: 2026-09-05
- **Status**: Approved

## 1. Overview

This design extends the core learning words by 36 additional words across 6 full levels (Levels 11 through 16), bringing the total vocabulary to 96 words across 16 levels.

Additionally, this design removes the blocking 3.2-second modal backdrop between levels and replaces it with a 1.0-second floating CSS fireworks celebration banner that never pauses or intercepts gameplay.

---

## 2. Level Structure & Pedagogy

### Level 11: 2-Syllable Toddler Favorites (Play & Pets)
1. `TEDDY` (🧸, `/t e d iː/`, letters: `T-E-D-D-Y`, IPA: `['t', 'e', 'd', '', 'iː']`)
2. `PUPPY` (🐶, `/p ʌ p iː/`, letters: `P-U-P-P-Y`, IPA: `['p', 'ʌ', 'p', '', 'iː']`)
3. `KITTEN` (🐱, `/k ɪ t ə n/`, letters: `K-I-T-T-E-N`, IPA: `['k', 'ɪ', 't', '', 'ə', 'n']`)
4. `RABBIT` (🐰, `/r æ b ɪ t/`, letters: `R-A-B-B-I-T`, IPA: `['r', 'æ', 'b', '', 'ɪ', 't']`)
5. `BUTTON` (🔘, `/b ʌ t ə n/`, letters: `B-U-T-T-O-N`, IPA: `['b', 'ʌ', 't', '', 'ə', 'n']`)
6. `POCKET` (👖, `/p ɒ k ɪ t/`, letters: `P-O-C-K-E-T`, IPA: `['p', 'ɒ', 'k', '', 'ɪ', 't']`)

### Level 12: 2-Syllable Machines, Vehicles & Animals
1. `DIGGER` (🚜, `/d ɪ g ə/`, letters: `D-I-G-G-E-R`, IPA: `['d', 'ɪ', 'g', '', 'ə', '']`)
2. `ROCKET` (🚀, `/r ɒ k ɪ t/`, letters: `R-O-C-K-E-T`, IPA: `['r', 'ɒ', 'k', '', 'ɪ', 't']`)
3. `PENGUIN` (🐧, `/p e ŋ g w ɪ n/`, letters: `P-E-N-G-U-I-N`, IPA: `['p', 'e', 'ŋ', 'g', 'w', 'ɪ', 'n']`)
4. `MONKEY` (🐒, `/m ʌ ŋ k iː/`, letters: `M-O-N-K-E-Y`, IPA: `['m', 'ʌ', 'ŋ', 'k', 'iː', '']`)
5. `TEAPOT` (🫖, `/t iː p ɒ t/`, letters: `T-E-A-P-O-T`, IPA: `['t', 'iː', '', 'p', 'ɒ', 't']`)
6. `ZEBRA` (🦓, `/z e b r ə/`, letters: `Z-E-B-R-A`, IPA: `['z', 'e', 'b', 'r', 'ə']`)

### Level 13: Consonant Digraphs (`SH`, `CH`, `TH`, `NG`)
1. `SHIP` (🚢, `/ʃ ɪ p/`, letters: `S-H-I-P`, IPA: `['ʃ', '', 'ɪ', 'p']`)
2. `FISH` (🐟, `/f ɪ ʃ/`, letters: `F-I-S-H`, IPA: `['f', 'ɪ', 'ʃ', '']`)
3. `CHICK` (🐥, `/tʃ ɪ k/`, letters: `C-H-I-C-K`, IPA: `['tʃ', '', 'ɪ', 'k', '']`)
4. `CHAIR` (🪑, `/tʃ eə/`, letters: `C-H-A-I-R`, IPA: `['tʃ', '', 'eə', '', '']`)
5. `RING` (💍, `/r ɪ ŋ/`, letters: `R-I-N-G`, IPA: `['r', 'ɪ', 'ŋ', '']`)
6. `BATH` (🛁, `/b ɑː θ/`, letters: `B-A-T-H`, IPA: `['b', 'ɑː', 'θ', '']`)

### Level 14: Vowel Diphthongs & Special Vowels (`OW`, `OI`, `OO`, `OR`)
1. `COW` (🐮, `/k aʊ/`, letters: `C-O-W`, IPA: `['k', 'aʊ', '']`)
2. `OWL` (🦉, `/aʊ l/`, letters: `O-W-L`, IPA: `['aʊ', '', 'l']`)
3. `COIN` (🪙, `/k ɔɪ n/`, letters: `C-O-I-N`, IPA: `['k', 'ɔɪ', '', 'n']`)
4. `SPOON` (🥄, `/s p uː n/`, letters: `S-P-O-O-N`, IPA: `['s', 'p', 'uː', '', 'n']`)
5. `FORK` (🍴, `/f ɔː k/`, letters: `F-O-R-K`, IPA: `['f', 'ɔː', '', 'k']`)
6. `BOOT` (🥾, `/b uː t/`, letters: `B-O-O-T`, IPA: `['b', 'uː', '', 't']`)

### Level 15: Regular Plurals (Multi-Item Display)
All words display repeated items (promptRepeat):
1. `CARS` (`promptImage: '🚗'`, `promptRepeat: 3`, letters: `C-A-R-S`, IPA: `['k', 'ɑː', '', 'z']`)
2. `CUPS` (`promptImage: '☕'`, `promptRepeat: 2`, letters: `C-U-P-S`, IPA: `['k', 'ʌ', 'p', 's']`)
3. `CATS` (`promptImage: '🐱'`, `promptRepeat: 3`, letters: `C-A-T-S`, IPA: `['k', 'æ', 't', 's']`)
4. `DOGS` (`promptImage: '🐶'`, `promptRepeat: 2`, letters: `D-O-G-S`, IPA: `['d', 'ɒ', 'g', 'z']`)
5. `BOATS` (`promptImage: '⛵'`, `promptRepeat: 3`, letters: `B-O-A-T-S`, IPA: `['b', 'əʊ', '', 't', 's']`)
6. `DUCKS` (`promptImage: '🦆'`, `promptRepeat: 4`, letters: `D-U-C-K-S`, IPA: `['d', 'ʌ', 'k', '', 's']`)

### Level 16: Irregular Plurals (Multi-Item Display)
1. `BOXES` (`promptImage: '📦'`, `promptRepeat: 2`, letters: `B-O-X-E-S`, IPA: `['b', 'ɒ', 'ks', 'ɪ', 'z']`)
2. `BUSES` (`promptImage: '🚌'`, `promptRepeat: 3`, letters: `B-U-S-E-S`, IPA: `['b', 'ʌ', 's', 'ɪ', 'z']`)
3. `SHEEP` (`promptImage: '🐑'`, `promptRepeat: 4`, letters: `S-H-E-E-P`, IPA: `['ʃ', '', 'iː', '', 'p']`)
4. `FEET` (`promptImage: '🦶'`, `promptRepeat: 2`, letters: `F-E-E-T`, IPA: `['f', 'iː', '', 't']`)
5. `TEETH` (`promptImage: '🦷'`, `promptRepeat: 3`, letters: `T-E-E-T-H`, IPA: `['t', 'iː', '', 'θ', '']`)
6. `MICE` (`promptImage: '🐁'`, `promptRepeat: 3`, letters: `M-I-C-E`, IPA: `['m', 'aɪ', 's', '']`)

---

## 3. Visual Prompt Card Multi-Item Support

Add optional `promptRepeat?: number` to `LearningWord`:
- In `PromptCard.tsx`:
  - If `word.promptRepeat && word.promptRepeat > 1`:
    Render a horizontal cluster / flex row of the emoji glyph repeated `word.promptRepeat` times (scaled slightly if repeat >= 3 so it fits comfortably in the card).
  - Otherwise render the single emoji glyph as before.

---

## 4. Seamless Level Transition & Fireworks Toast

- Remove `levelCompleteOverlay`, `levelCompleteCard`, and `LEVEL_COMPLETE_MS = 3200`.
- In `TypingGame.tsx`:
  - Upon completing the final word of a level, word advances on standard `WORD_COMPLETE_MS` (1500ms).
  - When the new level starts, display a non-blocking toast badge: `✨ Level {levelNumber}! 🎆` floating at the top.
  - Toast uses `pointer-events: none` and animates with CSS keyframes (pop in, sparkling firework particle bursts, fade out after 1.0s).
  - Keystrokes are never blocked; input proceeds instantly.
