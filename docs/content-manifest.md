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
  - Tracked: 29 webm audio files covering standard letter sounds and key digraphs (e.g. `ae.webm`, `b.webm`, `sh.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Spoken Words** (`public/audio/words/`):
  - Tracked: 32 webm audio files for standard starter vocabulary (e.g. `cat.webm`, `dog.webm`, `daddy.webm`, `grandad.webm`).
  - License: CC-BY-SA-3.0 (Author: Tim Dobson).
- **Planned / Dynamic Audio Classes**:
  - `public/audio/letter-names/`: Letter names (planned/recorded via prime recorder or family voice override).
  - `public/audio/numbers/`: Spoken numbers (planned/recorded).
  - `public/audio/plurals/`: Spoken plurals (planned/recorded).
  - `public/audio/clock/`: Spoken clock phrases (hybrid synthesis / planned voice overrides).
  - License: CC-BY-SA-3.0 for any Tim Dobson recordings in these categories.

---

## 3. Visual Content (`public/images/`)

- **Curriculum Photographs & Illustrations**:
  - Tracked: `public/images/words/daddy.jpg` (Author: Tim Dobson, License: CC-BY-SA-3.0).
  - Planned / Custom Photos: Additional word and quiz prompt photos are uploaded dynamically to private R2 storage per child profile rather than bundled statically.

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
