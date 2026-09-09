# App Shell & Clock Mini-Game Design Spec

- **Date:** 2026-09-09
- **Status:** Approved
- **Topic:** Global App Shell & Analog Clock Learning Mini-Game

## Overview & Goals

1. Provide an accessible **App Shell** navigation across the entire suite of games:
   - **Menu/Home** button on the top left.
   - Distinct, colorful icon CTA buttons across the top for all games:
     - 🔤 Words
     - 🔢 Counting
     - 🕒 Clock
     - ❓ Quiz
     - 🎵 Rhyme
   - Touch-friendly and optimized for a 1024x768 kiosk display and mobile.

2. Introduce the **Clock Mini-Game** (`/clock`):
   - Teaches reading analog time through progressive scaffolding.
   - Clean SVG analog clock face with clear 1–12 numbers.
   - Intuitive color-coded zones: soft green right hemisphere ("PAST") and soft orange left hemisphere ("TO") to remove confusion.
   - Distinct hands: thick short red hour hand and long blue minute hand.
   - Spoken audio saying *"It is [time]"* (e.g. *"It is 4 o'clock"*, *"It is quarter to 8"*).
   - Audio is hybrid: plays custom audio files (`/audio/clock/[slug].webm`) when recorded, falling back to high-quality British English Web Speech synthesis.
   - Primes all clock audio clips into `/record` for human recording in future sessions.
   - Keyboard input with word-completion shortcuts (`Q` -> "Quarter", `H` -> "Half", `P` -> "past", `T` -> "to") and digits for minutes/hours.
   - Starts with blank prompt text; after 30 seconds of inactivity, faint hints appear.
   - Celebration flash on successful entry before advancing to the next challenge.

---

## 1. App Shell & Navigation Structure

### 1.1 Routes & URLs
- `/` -> Main Menu / Hub showing visual launcher cards for each game.
- `/words` -> Phonics / Word spelling game.
- `/counting` -> Number counting game.
- `/clock` -> Analog clock reading game.
- `/quiz` -> Word quiz challenge.
- `/rhyme` -> Rhyme Time game.
- `/record` -> Audio recording studio.

### 1.2 Top Navigation Header (`AppShellNav.tsx`)
- Placed in `app/layout.tsx` so it renders persistently across all game routes.
- **Left CTA:** `🏠 Menu` button linking to `/`.
- **Top Bar Buttons:**
  - `🔤 Words` (`/words`)
  - `🔢 Counting` (`/counting`)
  - `🕒 Clock` (`/clock`)
  - `❓ Quiz` (`/quiz`)
  - `🎵 Rhyme` (`/rhyme`)
- Highlights active route cleanly.
- Compact height (< 64px) to preserve vertical space on 1024x768 screens.

---

## 2. Clock Face Component (`ClockFace.tsx`)

### 2.1 SVG Clock Rendering
- Crisp vector rendering scaling to viewport (max 320x320px).
- Numeric numerals `1` through `12` in bold, friendly font.
- Minute tick marks around the rim.
- **Intuitive Visual Aids for Past vs. To:**
  - Right semicircle (12:00 to 6:00) with a light green background tint and subtle "PAST" badge.
  - Left semicircle (6:00 to 12:00) with a light orange background tint and subtle "TO" badge.
- **Hands:**
  - Short, thick Red hour hand (`#e03131`), correctly advancing between hours based on elapsed minutes.
  - Long, slender Blue minute hand (`#1971c2`).
  - Center pivot pin.
- **Outer Ring Minute Markers (Hard & Ultra Hard):**
  - Minute indicator badges (5, 10, 15, 20... / 25 to, 20 to...) around the outside of the dial to reinforce 5-minute increments.

---

## 3. Clock Game Modes & Curriculum

### 3.1 Difficulty Tiers
1. **Easy (O'clock):**
   - Minute hand fixed at 12.
   - Spoken audio: *"It is [X] o'clock"* (e.g. *"It is 4 o'clock"*).
   - Expected input: Hour number (e.g. `4`, or `1` then `2` for 12).
2. **Medium (Quarter & Half):**
   - Minute hand at 3 (quarter past), 6 (half past), or 9 (quarter to).
   - Spoken audio: *"It is quarter past [X]"*, *"It is half past [X]"*, *"It is quarter to [X]"*.
   - Expected input:
     - `Q` -> expands to "Quarter "
     - `H` -> expands to "Half "
     - `P` -> expands to "past "
     - `T` -> expands to "to "
     - followed by hour digits.
     - Example: `Q` -> `T` -> `8` yields "Quarter to 8".
3. **Hard (Five Past & Five To):**
   - Minute hand at 1 (5 past) or 11 (5 to).
   - Spoken audio: *"It is five past [X]"*, *"It is five to [X]"*.
   - Expected input: `5` -> `P` (or `T`) -> hour digits.
4. **Ultra Hard (5-Minute Increments):**
   - Minute hand at any 5-minute step (10 past, 20 past, 25 past, 25 to, 20 to, 10 to, plus quarter/half).
   - Spoken audio: *"It is [M] past/to [X]"*.
   - Expected input: minute digits (e.g. `2` `5`) -> `P`/`T` -> hour digits.

### 3.2 Display & Hint Mechanics
- Under the clock, the prompt line starts blank.
- As the user types valid keys, the typed words/numbers appear in vibrant text.
- If 30 seconds elapse without completing the answer, a faint ghost hint appears showing the remaining keys (e.g. `[Q]uarter [t]o [8]`).
- On completion: trigger green flash / celebrate feedback, play celebration sound, pause for 1.2s, then generate next question.

---

## 4. Pure Progression Matcher (`clock-progression.ts`)

Pure, side-effect-free function:
```typescript
export interface ClockTargetTime {
  hour: number;        // 1 - 12
  minute: number;      // 0 - 55 in steps of 5
  type: 'oclock' | 'quarter_past' | 'half_past' | 'quarter_to' | 'five_past' | 'five_to' | 'increment_past' | 'increment_to';
  spokenPhrase: string; // e.g. "It is quarter to 8"
  tokens: ClockToken[]; // e.g. [{ key: 'q', text: 'Quarter ' }, { key: 't', text: 'to ' }, { key: '8', text: '8' }]
}

export interface ClockProgressionState {
  currentTokenIndex: number; // which token in tokens we are currently matching
  currentDigits: string;     // accumulated digits if token requires multi-digit input (like "11" or "25")
}

export function getClockProgressionResult(
  target: ClockTargetTime,
  state: ClockProgressionState,
  key: string
): {
  kind: 'advanced' | 'incorrect' | 'ignored';
  newState: ClockProgressionState;
  completed: boolean;
};
```
Thoroughly unit tested for:
- Exact letter expansions (`Q`, `q`, `P`, `p`, etc.).
- Multi-digit handling (e.g. `10`, `11`, `12`, `25`).
- Incorrect key handling without state corruption.

---

## 5. Audio Architecture & Recording System

### 5.1 Hybrid Audio Player (`utils/clock-audio.ts`)
1. Generates consistent audio slugs:
   - `clock-it-is-4-oclock`
   - `clock-it-is-quarter-to-8`
   - `clock-it-is-half-past-3`
   - `clock-it-is-25-past-4`
2. First checks if `/audio/clock/${slug}.webm` is present.
3. If not present (or error), uses `window.speechSynthesis` with `en-GB` voice reciting `spokenPhrase`.
4. Gracefully handles browsers where audio permissions require initial user gesture.

### 5.2 Recording Studio Integration (`RecordPage.tsx` & `/api/audio`)
- Add `'clock'` to recording categories in `RecordPage.tsx` and `types/learning-word.types.ts`.
- Ensure directory `public/audio/clock` exists and `/api/audio/route.ts` allows saving `kind === 'clock'`.
- All standard clock phrases are automatically queued in the recorder UI for easy recording.

---

## 6. Verification & Testing Strategy

1. **Unit Tests:**
   - `clock-progression.test.ts`: Exhaustive test of matching logic across all 4 difficulty levels.
   - `ClockFace.test.tsx`: Tests rendering of SVG clock face, hands rotation math for hour/minute, and past/to zones.
   - `AppShellNav.test.tsx`: Tests active route links, menu navigation, and responsiveness.
2. **Integration Verification:**
   - Run Next.js static build (`yarn build`) to ensure zero static export or SSR hydration errors.
   - Verify all routes (`/`, `/words`, `/counting`, `/clock`, `/quiz`, `/rhyme`, `/record`) render cleanly with AppShellNav.
   - Verify keyboard input on `/clock` produces expected speech, visual updates, and celebrations.
