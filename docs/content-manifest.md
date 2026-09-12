# Foxwords Content Manifest

This manifest documents all bundled educational content, audio assets, images, and curriculum data in Foxwords, their provenance, and their licensing.

## 1. Licenses Summary

- **Source Code**: GNU Affero General Public License v3.0 (`AGPL-3.0`) — see `LICENSE`.
- **Educational Content & Media**: Creative Commons Attribution-ShareAlike 3.0 Unported (`CC-BY-SA-3.0`) — see `CONTENT-LICENSE`.
- **Third-Party Libraries**: Upstream permissive licenses (e.g. MIT) — see `package.json`.

---

## 2. Audio Content (`public/audio/`)

All audio files in `public/audio/` were voiced, recorded, and edited by Tim Dobson specifically for Foxwords (and its predecessor educational project).

- **Phonics Sounds** (`public/audio/phonemes/`):
  - Phonics sound recordings covering letters and diagraphs (e.g. `a.webm`, `b.webm`, `ch.webm`, `sh.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Letter Names** (`public/audio/letter-names/`):
  - Spoken letter names (e.g. `a.webm` = "ay", `b.webm` = "bee").
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Spoken Words** (`public/audio/words/`):
  - Spoken words for the curriculum (e.g. `cat.webm`, `dog.webm`, `grandad.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Numbers** (`public/audio/numbers/`):
  - Spoken numbers 1 to 20 for counting challenges.
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Plurals & Objects** (`public/audio/plurals/`):
  - Spoken plural forms (e.g. `teddies.webm`, `foxes.webm`, `cats.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Clock Phrases** (`public/audio/clock/`):
  - Spoken clock times and instructional prompts (e.g. `three-oclock.webm`, `half-past-four.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).

---

## 3. Visual Content (`public/images/`)

- **Curriculum Photographs & Illustrations**:
  - Located in `public/images/words/` and `public/images/prompts/`.
  - Photos depicting animals, everyday objects, family references, and vehicles used for spelling and quiz prompts.
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).

---

## 4. Curriculum Data (`constants/`)

- `constants/learning-words.ts`: Base vocabulary list with phonetic breakdowns and IPA mappings.
- `constants/difficulty-levels.ts`: Level groupings from 3-letter CVC up to multi-syllable words.
- `constants/count-numbers.ts`: Counting integers 1-10 with audio slugs.
- `constants/count-plurals.ts`: Pluralization rules and spoken audio associations.
- `constants/clock-curriculum.ts`: Hour, half-hour, and quarter-hour targets.
- `constants/rhyme-levels.ts`: Rhyme word family groupings and distractors.
- `constants/letter-names.ts` & `constants/phonemes.ts`: Alphabet and phonics metadata.
- License: CC-BY-SA-3.0 (Author: Tim Dobson).

---

## 5. Third-Party Library Assets

The following runtime libraries and third-party assets are incorporated under their respective permissive licenses and are NOT authored by Tim Dobson:

- `@mantine/core`, `@mantine/hooks`: MIT License (Copyright (c) 2020-present Vitaly Rtishchev).
- `@tabler/icons-react`: MIT License (Copyright (c) 2020-present Paweł Kuna).
- `next`, `react`, `react-dom`: MIT License.
- `@opennextjs/cloudflare`: MIT / Apache-2.0 License.
