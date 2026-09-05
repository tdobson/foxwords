# Design Document: Expanding Learning Words (10 Full Levels) and Grandad Normalization

- **Date**: 2026-09-05
- **Status**: Approved

## 1. Overview

This design expands the core vocabulary of the game by 28 new words, bringing the total from 32 to 60 words. Since the game defines each level as 6 words (`LEVEL_SIZE = 6`), this produces 10 complete, structured levels.

All 28 new words represent tangible, concrete real-world objects suited for toddlers, emphasizing simple phonics (mostly CVC words and simple blends) while widening alphabet and phoneme coverage (including `X`, `Z`, `J`, `V`, `W`, `Y`).

Additionally, the spelling and assets for `GRANDAD` are normalized across the entire codebase to eliminate legacy references to `GRANDDAD`.

---

## 2. Word Additions & Level Progression

Each level consists of exactly 6 words. The 28 new words complete Level 6 and create Levels 7 through 10.

### Level 1 (Family 1)
1. `JAMES`
2. `GRANDMA`
3. `GRANDAD` (spelling verified)
4. `MUMMY`
5. `DADDY`
6. `SARAH`

### Level 2 (Family & Pets)
1. `BABY`
2. `GRANDPA`
3. `GRANNY`
4. `MEG`
5. `FOX`
6. `BED`

### Level 3 (Food & Animals)
1. `MILK`
2. `ORANGE`
3. `BANANA`
4. `DOG`
5. `CAT`
6. `BIKE`

### Level 4 (Objects & Vehicles)
1. `BOOK`
2. `TRACTOR`
3. `CRANE`
4. `APPLE`
5. `JAM`
6. `BIG`

### Level 5 (Play & Transport)
1. `SPLASH`
2. `RAIN`
3. `GAMES`
4. `JIGSAW`
5. `TRAM`
6. `TRAIN`

### Level 6 (Vehicles & Travel)
1. `RAIL` (existing)
2. `TRACK` (existing)
3. `BUS` (`/b ʌ s/`, 🚌, accent: `#E67E22`) - CVC vehicle
4. `VAN` (`/v æ n/`, 🚐, accent: `#34495E`) - introduces V
5. `BOAT` (`/b əʊ t/`, ⛵, accent: `#2980B9`) - digraph 'oa'
6. `CAR` (`/k ɑː/`, 🚗, accent: `#C0392B`) - r-controlled 'ar'

### Level 7 (Animals & Creatures)
1. `RAT` (`/r æ t/`, 🐀, accent: `#7F8C8D`) - CVC
2. `PIG` (`/p ɪ g/`, 🐷, accent: `#F48FB1`) - CVC
3. `DUCK` (`/d ʌ k/`, 🦆, accent: `#F39C12`) - digraph 'ck'
4. `HEN` (`/h e n/`, 🐔, accent: `#D35400`) - CVC
5. `FROG` (`/f r ɒ g/`, 🐸, accent: `#27AE60`) - CCVC blend
6. `BAT` (`/b æ t/`, 🦇, accent: `#2C3E50`) - CVC

### Level 8 (Nature, Outdoors & Animals)
1. `BUG` (`/b ʌ g/`, 🐛, accent: `#8E44AD`) - CVC
2. `SUN` (`/s ʌ n/`, ☀️, accent: `#F1C40F`) - CVC
3. `MOON` (`/m uː n/`, 🌙, accent: `#5DADE2`) - digraph 'oo'
4. `STAR` (`/s t ɑː/`, ⭐, accent: `#F39C12`) - blend + 'ar'
5. `LOG` (`/l ɒ g/`, 🪵, accent: `#795548`) - CVC
6. `WEB` (`/w e b/`, 🕸️, accent: `#95A5A6`) - introduces W

### Level 9 (Things at Home & Clothes)
1. `HAT` (`/h æ t/`, 🧢, accent: `#2980B9`) - CVC
2. `CUP` (`/k ʌ p/`, ☕, accent: `#D35400`) - CVC
3. `MUG` (`/m ʌ g/`, 🥛, accent: `#16A085`) - CVC
4. `POT` (`/p ɒ t/`, 🍲, accent: `#C0392B`) - CVC
5. `PAN` (`/p æ n/`, 🍳, accent: `#7F8C8D`) - CVC
6. `SOCK` (`/s ɒ k/`, 🧦, accent: `#9B59B6`) - digraph 'ck'

### Level 10 (Fun Objects, Rich Alphabet & Sounds)
1. `BOX` (`/b ɒ ks/`, 📦, accent: `#D35400`) - features X
2. `ZIP` (`/z ɪ p/`, 🤐, accent: `#34495E`) - features Z
3. `JET` (`/dʒ e t/`, ✈️, accent: `#2980B9`) - features J
4. `YAK` (`/j æ k/`, 🐂, accent: `#8D6E63`) - features Y
5. `TUB` (`/t ʌ b/`, 🛁, accent: `#1ABC9C`) - CVC
6. `NUT` (`/n ʌ t/`, 🥜, accent: `#A0522D`) - CVC

---

## 3. Phoneme / Letter-to-IPA Mappings

The phoneme audio sequencer relies on each letter index in a word corresponding to an IPA string (or `''` for silent/second characters in digraphs).

| Word | Letters | IPA Array | Notes |
| :--- | :--- | :--- | :--- |
| `BUS` | B-U-S | `['b', 'ʌ', 's']` | 3 phonemes |
| `VAN` | V-A-N | `['v', 'æ', 'n']` | 3 phonemes |
| `BOAT`| B-O-A-T | `['b', 'əʊ', '', 't']` | 'oa' digraph mapped to /əʊ/ + silent |
| `CAR` | C-A-R | `['k', 'ɑː', '']` | 'ar' r-controlled vowel mapped to /ɑː/ + silent |
| `RAT` | R-A-T | `['r', 'æ', 't']` | 3 phonemes |
| `PIG` | P-I-G | `['p', 'ɪ', 'g']` | 3 phonemes |
| `DUCK`| D-U-C-K | `['d', 'ʌ', 'k', '']` | 'ck' mapped to /k/ + silent |
| `HEN` | H-E-N | `['h', 'e', 'n']` | 3 phonemes |
| `FROG`| F-R-O-G | `['f', 'r', 'ɒ', 'g']` | 4 phonemes |
| `BAT` | B-A-T | `['b', 'æ', 't']` | 3 phonemes |
| `BUG` | B-U-G | `['b', 'ʌ', 'g']` | 3 phonemes |
| `SUN` | S-U-N | `['s', 'ʌ', 'n']` | 3 phonemes |
| `MOON`| M-O-O-N | `['m', 'uː', '', 'n']` | 'oo' mapped to /uː/ + silent |
| `STAR`| S-T-A-R | `['s', 't', 'ɑː', '']` | 'ar' mapped to /ɑː/ + silent |
| `LOG` | L-O-G | `['l', 'ɒ', 'g']` | 3 phonemes |
| `WEB` | W-E-B | `['w', 'e', 'b']` | 3 phonemes |
| `HAT` | H-A-T | `['h', 'æ', 't']` | 3 phonemes |
| `CUP` | C-U-P | `['k', 'ʌ', 'p']` | 3 phonemes |
| `MUG` | M-U-G | `['m', 'ʌ', 'g']` | 3 phonemes |
| `POT` | P-O-T | `['p', 'ɒ', 't']` | 3 phonemes |
| `PAN` | P-A-N | `['p', 'æ', 'n']` | 3 phonemes |
| `SOCK`| S-O-C-K | `['s', 'ɒ', 'k', '']` | 'ck' mapped to /k/ + silent |
| `BOX` | B-O-X | `['b', 'ɒ', 'ks']` | 'x' mapped to /ks/ |
| `ZIP` | Z-I-P | `['z', 'ɪ', 'p']` | 3 phonemes |
| `JET` | J-E-T | `['dʒ', 'e', 't']` | 3 phonemes |
| `YAK` | Y-A-K | `['j', 'æ', 'k']` | 3 phonemes |
| `TUB` | T-U-B | `['t', 'ʌ', 'b']` | 3 phonemes |
| `NUT` | N-U-T | `['n', 'ʌ', 't']` | 3 phonemes |

All phonemes (`b`, `ʌ`, `s`, `v`, `æ`, `n`, `əʊ`, `t`, `k`, `ɑː`, `r`, `p`, `ɪ`, `g`, `h`, `e`, `f`, `ɒ`, `m`, `uː`, `l`, `w`, `ks`, `z`, `dʒ`, `j`) are present in `PHONEMES` in `constants/phonemes.ts`.

---

## 4. Counting Mode & Plurals

In counting mode (`mode === 'count'`), plurals are spoken for counts > 1.

Add to `IRREGULAR_PLURALS` in `constants/count-plurals.ts`:
- `box`: `'Boxes'`
- `bus`: `'Buses'`

The other 26 words use regular English plurals (`+s`), which `getObjectSpokenLabel` handles automatically.

---

## 5. Normalization: Granddad to Grandad

Ensure complete consistency with the rule that Tim's family spelling is `GRANDAD` (two `d`s total, ID `grandad`):
- Update `components/TypingGame/TypingGame.test.tsx`: change `const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDDAD', ...]` to `... 'GRANDAD' ...`.
- Update `README.md`: replace `GRANDDAD` with `GRANDAD`.
- Remove orphaned audio file `public/audio/words/granddad.webm` (`public/audio/words/grandad.webm` is active).

---

## 6. Testing & Validation

1. **Phonemes Coverage Test (`constants/phonemes.test.ts`)**:
   - Ensures all IPA symbols in `LEARNING_WORDS` have valid phoneme slugs.
2. **Plurals Test (`constants/count-plurals.test.ts`)**:
   - Add test cases for `boxes` and `buses`.
3. **TypingGame Integration Tests (`components/TypingGame/TypingGame.test.tsx`)**:
   - Verify word cycling and level progression pass with `GRANDAD`.
4. **Full Test Suite (`npm test`)**:
   - Typecheck, oxlint, stylelint, and Jest suites.
