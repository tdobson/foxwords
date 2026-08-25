# Letter Trail

Letter Trail is a gentle, single-user typing and spelling game designed for toddlers and early learners using a physical keyboard.

A child sees a familiar visual prompt (such as a picture or emoji of James, Grandma, Granny, Granddad, Grandpa, Mummy, Daddy, Sarah, Meg, or a Dog or Cat) and completes the target word by pressing the matching keys on a physical keyboard in sequence.

## Prerequisites

- Node.js >= 20
- Yarn (v4) or npm

## Installation

```bash
yarn install
```

## Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Example

1. Open the local game screen. The game starts on `JAMES` with the prompt card and letter tiles displayed.
2. Press the keys **J**, **A**, **M**, **E**, **S** in order on your physical keyboard.
3. Each correct key fills the corresponding tile with a solid warm color and moves focus to the next letter.
4. Pressing an incorrect key causes a gentle shake animation without resetting progress or penalizing the child.
5. Once the word is complete, a brief celebration animation plays and the game automatically transitions to the next word (`GRANDMA`).
6. Click **New word** at any time to skip to the next word.

## Difficulty / Scaffold Modes

The game includes two visual scaffolding modes selectable via the controls at the bottom:

1. **Reveal:** Only the current letter is visible. It appears faintly until completed, and the next letter is revealed only when the previous one is typed. This is the default mode.
2. **Faint:** All unfinished letters are visible with faint outlines to encourage recall.

## Levels

Every 6 words form a level. The game shows a level label so each group of words has a natural pause point before continuing.

## Word Data

Word fixtures are defined in `constants/learning-words.ts` with local visual prompt glyphs and accent colors.

## Running Tests and Verification

```bash
# Run full suite (Next typegen, oxfmt, oxlint, stylelint, TypeScript, Jest)
npm run test

# Run Jest unit and behavioral tests only
npm run jest

# Run production build
npm run build
```

## Prototype Limitations

- Physical keyboard input only (no on-screen touch keyboard).
- No backend, user accounts, persistence, or external APIs.
- Starter word set only (`JAMES`, `GRANDMA`, `GRANDDAD`, `MUMMY`, `DADDY`, `SARAH`, `GRANDPA`, `GRANNY`, `MEG`, `DOG`, `CAT`, `BIKE`, `BOOK`, `TRACTOR`, `CRANE`, `APPLE`, `JAM`, `BIG`, `SPLASH`, `RAIN`, `GAMES`, `JIGSAW`, `TRAM`, `TRAIN`, `RAIL`, `TRACK`, `ENGINE`).
- Uppercase matching only (case-insensitive for typing).
