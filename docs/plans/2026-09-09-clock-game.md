# Global App Shell & Analog Clock Mini-Game Implementation Plan

> **For agentic workers:** This plan is structured for workflow orchestration and subagent-driven development. Tasks are labelled with agent types (`build-agent` / `review-agent` / `qa-agent`). Build tasks use `isolation: worktree`. Review tasks follow every 1-3 build tasks.
>
> **Execution:** Use `superpowers:subagent-driven-development` (recommended) for inline execution, or drop phases directly into a Workflow script's `pipeline()`/`parallel()` calls.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a persistent top AppShell with intuitive game launcher/navigation across all games (Words, Counting, Clock, Quiz, Rhyme), and build an analog Clock Learning Mini-Game (`/clock`) with pure deterministic progression matching, SVG clock face with Past/To zones, and hybrid audio/recording integration.

**Architecture:** 
1. Build pure clock curriculum types, constants, and progression matcher with 100% test coverage.
2. Build hybrid audio playback and `/record` + `/api/audio` audio persistence integration.
3. Build SVG `ClockFace` component featuring intuitive color-shaded Past/To halves, distinct colored hands, and outer minute markers.
4. Build `ClockGame` component with keyboard input, 30-second hint delay, and completion celebratory animations.
5. Build `AppShellNav` global header component, wire into `app/layout.tsx`, create dedicated routes (`/`, `/words`, `/counting`, `/clock`, `/quiz`, `/rhyme`), and update `/` with launcher tiles.

**Tech Stack:** Next.js 16 (App Router, static export), React 19, TypeScript, Mantine Core 9, Web Speech Synthesis API, Web Audio/MediaRecorder, Jest + Testing Library.

**Codebases affected:** `clock-game` (standalone repository root).

---

## File Map

- Create: `types/clock.types.ts` (clock data structures, difficulty levels, target times, tokens)
- Create: `constants/clock-curriculum.ts` (clock questions/levels for Easy, Medium, Hard, Ultra Hard)
- Create: `utils/clock-progression.ts` (pure progression input matcher)
- Create: `utils/clock-progression.test.ts` (comprehensive unit tests for keyboard matching)
- Create: `utils/clock-audio.ts` (hybrid audio: custom webm playback + Web Speech API fallback)
- Create: `utils/clock-audio.test.ts` (unit tests for audio path slugs and speech formatting)
- Modify: `types/learning-word.types.ts` (add `'clock'` to recording categories and game modes)
- Modify: `app/record/RecordPage.tsx` (prime all clock recording phrases into recorder UI)
- Modify: `app/api/audio/route.ts` (allow saving and listing `clock` audio files)
- Create: `components/ClockGame/ClockFace.tsx` (SVG analog clock face with Past/To hemispheres)
- Create: `components/ClockGame/ClockFace.module.css` (styling for clock face and markers)
- Create: `components/ClockGame/ClockFace.test.tsx` (unit tests for hand angles and visual elements)
- Create: `components/ClockGame/ClockGame.tsx` (main clock game interactive component)
- Create: `components/ClockGame/ClockGame.module.css` (game layout, prompt tokens, hint animations)
- Create: `components/ClockGame/ClockGame.test.tsx` (component tests for user interaction and hint timing)
- Create: `components/AppShellNav/AppShellNav.tsx` (persistent top navigation header)
- Create: `components/AppShellNav/AppShellNav.module.css` (responsive navigation bar styling)
- Create: `components/AppShellNav/AppShellNav.test.tsx` (unit tests for navigation links & active states)
- Modify: `app/layout.tsx` (embed `AppShellNav` globally)
- Create: `app/clock/page.tsx` (route for `/clock`)
- Create: `app/words/page.tsx` (route for `/words` - TypingGame words mode)
- Create: `app/counting/page.tsx` (route for `/counting` - TypingGame count mode)
- Create: `app/quiz/page.tsx` (route for `/quiz` - TypingGame quiz mode)
- Modify: `app/page.tsx` (main hub / game launcher with friendly cards, with auto-fallback to words)

---

## Phase 1: Core Progression Engine & Data Model

### Task 1: Clock Types & Curriculum Constants — `build-agent` (worktree)

**Files:**
- Create: `types/clock.types.ts`
- Create: `constants/clock-curriculum.ts`

**Contract:**
- Define `ClockDifficulty` (`'easy' | 'medium' | 'hard' | 'ultra'`).
- Define `ClockToken`: `{ key: string; text: string }`.
- Define `ClockTargetTime`: `{ id: string; hour: number; minute: number; difficulty: ClockDifficulty; spokenPhrase: string; audioSlug: string; tokens: ClockToken[] }`.
- Provide complete curriculum generation:
  - Easy: 12 o'clock targets (1-12) with tokens: hour digits.
  - Medium: Half past (30m), Quarter past (15m), Quarter to (45m) with letter shortcut tokens: `Q` -> "Quarter ", `H` -> "Half ", `P` -> "past ", `T` -> "to ", plus hour digits.
  - Hard: Five past (5m), Five to (55m) with tokens: `5` -> "5 ", `P`/`T` -> "past "/"to ", plus hour digits.
  - Ultra Hard: 10, 20, 25 past and 25, 20, 10 to with minute tokens, `P`/`T`, and hour digits.

- [ ] **Step 1: Write `types/clock.types.ts`**

```typescript
export type ClockDifficulty = 'easy' | 'medium' | 'hard' | 'ultra';

export interface ClockToken {
  key: string;
  text: string;
}

export interface ClockTargetTime {
  id: string;
  hour: number;        // 1 - 12
  minute: number;      // 0 - 55 in steps of 5
  difficulty: ClockDifficulty;
  spokenPhrase: string; // e.g. "It is quarter to 8"
  audioSlug: string;    // e.g. "clock-it-is-quarter-to-8"
  tokens: ClockToken[];
}

export interface ClockProgressionState {
  tokenIndex: number;
  enteredKeyBuffer: string;
}

export type ClockProgressionKind = 'advanced' | 'incorrect' | 'ignored';

export interface ClockProgressionResult {
  kind: ClockProgressionKind;
  state: ClockProgressionState;
  completed: boolean;
  revealedText: string;
}
```

- [ ] **Step 2: Write `constants/clock-curriculum.ts`**

Generate deterministic pools for each level:
- Easy: 1 to 12 o'clock. Audio slug: `clock-it-is-${h}-oclock`. Phrase: `"It is ${h} o'clock"`. Tokens: `[{ key: String(h), text: `${h}` }]`.
- Medium: 15, 30, 45 mins.
  - 15m: Tokens: `[{ key: 'q', text: 'Quarter ' }, { key: 'p', text: 'past ' }, { key: String(h), text: `${h}` }]`.
  - 30m: Tokens: `[{ key: 'h', text: 'Half ' }, { key: 'p', text: 'past ' }, { key: String(h), text: `${h}` }]`.
  - 45m: Tokens: `[{ key: 'q', text: 'Quarter ' }, { key: 't', text: 'to ' }, { key: String(nextH), text: `${nextH}` }]`.
- Hard: 5 past and 5 to.
  - 5 past: Tokens: `[{ key: '5', text: '5 ' }, { key: 'p', text: 'past ' }, { key: String(h), text: `${h}` }]`.
  - 5 to: Tokens: `[{ key: '5', text: '5 ' }, { key: 't', text: 'to ' }, { key: String(nextH), text: `${nextH}` }]`.
- Ultra: 10, 20, 25 past and 25, 20, 10 to.
- Export `CLOCK_CURRICULUM: Record<ClockDifficulty, ClockTargetTime[]>`.

- [ ] **Step 3: Run typecheck**

Run: `yarn typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add types/clock.types.ts constants/clock-curriculum.ts
git commit -m "feat(clock): define types and curriculum constants for all difficulty tiers"
```

---

### Task 2: Pure Clock Progression Matcher (TDD) — `build-agent` (worktree)

**Files:**
- Create: `utils/clock-progression.ts`
- Create: `utils/clock-progression.test.ts`

- [ ] **Step 1: Write the failing tests in `utils/clock-progression.test.ts`**

Test scenarios:
- Easy mode (e.g. 4 o'clock): pressing '4' returns `completed: true`. Pressing '1' on 12 o'clock waits for '2' then completes.
- Medium mode ("Quarter to 8"):
  - Pressing 'Q' (or lowercase 'q') advances token index, reveals "Quarter ".
  - Pressing 'T' (or 't') advances token index, reveals "Quarter to ".
  - Pressing '8' completes progression.
  - Pressing wrong key (e.g. 'X') returns `kind: 'incorrect'` without changing token index.
- Hard/Ultra mode (e.g. "25 past 4"):
  - Pressing '2' buffers '2', then '5' advances to '25 '.
  - Pressing 'P' advances to '25 past '.
  - Pressing '4' completes.
- Ignored keys (Shift, Alt, Meta, CapsLock) return `kind: 'ignored'`.

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest utils/clock-progression.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement `utils/clock-progression.ts`**

Implement `getClockProgressionResult(target, state, key)`:
```typescript
import { ClockProgressionResult, ClockProgressionState, ClockTargetTime } from '../types/clock.types';

export function getClockProgressionResult(
  target: ClockTargetTime,
  state: ClockProgressionState,
  rawKey: string
): ClockProgressionResult {
  if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(rawKey)) {
    return { kind: 'ignored', state, completed: false, revealedText: getRevealedText(target, state) };
  }
  const key = rawKey.toLowerCase();
  const currentToken = target.tokens[state.tokenIndex];
  if (!currentToken) {
    return { kind: 'ignored', state, completed: true, revealedText: getRevealedText(target, state) };
  }

  // If token target is multi-character digit (like '11' or '25')
  const expectedKey = currentToken.key.toLowerCase();
  if (expectedKey.length > 1) {
    const nextCharIndex = state.enteredKeyBuffer.length;
    if (key === expectedKey[nextCharIndex]) {
      const newBuffer = state.enteredKeyBuffer + key;
      if (newBuffer === expectedKey) {
        const nextIndex = state.tokenIndex + 1;
        const completed = nextIndex >= target.tokens.length;
        const newState = { tokenIndex: nextIndex, enteredKeyBuffer: '' };
        return { kind: 'advanced', state: newState, completed, revealedText: getRevealedText(target, newState) };
      }
      const newState = { tokenIndex: state.tokenIndex, enteredKeyBuffer: newBuffer };
      return { kind: 'advanced', state: newState, completed: false, revealedText: getRevealedText(target, newState) };
    }
    return { kind: 'incorrect', state, completed: false, revealedText: getRevealedText(target, state) };
  }

  // Single-key token (e.g. 'q', 'h', 'p', 't', '4')
  if (key === expectedKey) {
    const nextIndex = state.tokenIndex + 1;
    const completed = nextIndex >= target.tokens.length;
    const newState = { tokenIndex: nextIndex, enteredKeyBuffer: '' };
    return { kind: 'advanced', state: newState, completed, revealedText: getRevealedText(target, newState) };
  }

  return { kind: 'incorrect', state, completed: false, revealedText: getRevealedText(target, state) };
}

export function getRevealedText(target: ClockTargetTime, state: ClockProgressionState): string {
  return target.tokens
    .slice(0, state.tokenIndex)
    .map((t) => t.text)
    .join('');
}
```

- [ ] **Step 4: Run tests and verify PASS**

Run: `yarn jest utils/clock-progression.test.ts`
Expected: PASS (all cases passing).

- [ ] **Step 5: Commit**

```bash
git add utils/clock-progression.ts utils/clock-progression.test.ts
git commit -m "feat(clock): implement pure progression matcher with unit test suite"
```

---

### Task R1: Review Tasks 1-2 — `review-agent`

**Scope:** `types/clock.types.ts`, `constants/clock-curriculum.ts`, `utils/clock-progression.ts`, `utils/clock-progression.test.ts`.

- [ ] **Step 1: Adversarial review**
Check:
1. Are all 4 difficulties covered correctly in the curriculum?
2. Does the matcher properly handle uppercase/lowercase key presses (e.g. Shift+Q)?
3. Are multi-digit hours (10, 11, 12) and minutes (10, 20, 25) seamlessly matched?
4. Are tests comprehensive with no mock gaps?

- [ ] **Step 2: Triage & apply fixes if needed**

---

## Phase 2: Audio Hybrid Engine & Recorder Priming

### Task 3: Hybrid Clock Audio & Recorder Priming — `build-agent` (worktree)

**Files:**
- Create: `utils/clock-audio.ts`
- Create: `utils/clock-audio.test.ts`
- Modify: `types/learning-word.types.ts`
- Modify: `app/record/RecordPage.tsx`
- Modify: `app/api/audio/route.ts`

- [ ] **Step 1: Write `utils/clock-audio.ts`**

```typescript
export function getClockAudioPath(audioSlug: string): string {
  return `/audio/clock/${audioSlug}.webm`;
}

export function speakClockPhrase(phrase: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = 'en-GB';
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const britishVoice = voices.find((v) => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('British'));
  if (britishVoice) {
    utterance.voice = britishVoice;
  }
  window.speechSynthesis.speak(utterance);
}

export function playClockAudio(target: { audioSlug: string; spokenPhrase: string }): void {
  const audioPath = getClockAudioPath(target.audioSlug);
  const audio = new Audio(audioPath);
  audio.play().catch(() => {
    // Fallback to Web Speech Synthesis API
    speakClockPhrase(target.spokenPhrase);
  });
}
```

- [ ] **Step 2: Update `app/record/RecordPage.tsx` and `types/learning-word.types.ts`**

- Add `'clock'` to `RecordingItem.kind` (`'phoneme' | 'letter-name' | 'word' | 'number' | 'plural' | 'clock'`).
- Import `CLOCK_CURRICULUM` and map all unique targets to recording items:
  ```typescript
  const clockItems = Object.values(CLOCK_CURRICULUM).flat().map((target) => ({
    key: `clock-${target.audioSlug}`,
    kind: 'clock' as const,
    id: target.audioSlug,
    name: target.spokenPhrase,
    hint: `Clock: ${target.difficulty}`,
    file: getClockAudioPath(target.audioSlug),
    path: `public/audio/clock/${target.audioSlug}.webm`,
  }));
  ```
- Ensure `app/api/audio/route.ts` creates/reads `public/audio/clock/` directory and handles `kind === 'clock'`.

- [ ] **Step 3: Run unit tests and typecheck**

Run: `yarn typecheck && yarn jest utils/clock-audio.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add utils/clock-audio.ts utils/clock-audio.test.ts types/learning-word.types.ts app/record/RecordPage.tsx app/api/audio/route.ts
git commit -m "feat(audio): implement hybrid clock audio and prime recorder with clock curriculum phrases"
```

---

## Phase 3: Visual Clock Face & Interactive Game Component

### Task 4: SVG ClockFace Component — `build-agent` (worktree)

**Files:**
- Create: `components/ClockGame/ClockFace.tsx`
- Create: `components/ClockGame/ClockFace.module.css`
- Create: `components/ClockGame/ClockFace.test.tsx`

**Requirements:**
- High-contrast SVG clock dial with numeric digits 1 through 12.
- Right hemisphere (12 to 6) shaded with gentle green (`rgba(81, 207, 102, 0.15)`) with a clear label/badge "PAST".
- Left hemisphere (6 to 12) shaded with gentle orange (`rgba(255, 146, 43, 0.15)`) with a clear label/badge "TO".
- Red hour hand: angle = `(hour % 12) * 30 + (minute / 60) * 30` degrees.
- Blue minute hand: angle = `minute * 6` degrees.
- Outer ring badges for minutes (5, 10, 15, 20, 25... / 25 to, 20 to...).
- Responsive SVG sizing (`viewBox="0 0 300 300"`), accessible `aria-label="Analog clock displaying [spokenPhrase]"`.

- [ ] **Step 1: Write `ClockFace.test.tsx`**

Test hand angles:
- 3:00 -> hour hand at 90°, minute hand at 0°.
- 4:30 -> hour hand at 135°, minute hand at 180°.
- 8:45 (Quarter to 9) -> hour hand at 262.5°, minute hand at 270°.
- Semicircles present for PAST and TO.

- [ ] **Step 2: Implement `ClockFace.tsx` & `ClockFace.module.css`**

- [ ] **Step 3: Run tests**

Run: `yarn jest components/ClockGame/ClockFace.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/ClockGame/ClockFace.tsx components/ClockGame/ClockFace.module.css components/ClockGame/ClockFace.test.tsx
git commit -m "feat(clock): implement SVG ClockFace with past/to visual zones and hand rotation math"
```

---

### Task 5: ClockGame Component with 30s Hint Timer — `build-agent` (worktree)

**Files:**
- Create: `components/ClockGame/ClockGame.tsx`
- Create: `components/ClockGame/ClockGame.module.css`
- Create: `components/ClockGame/ClockGame.test.tsx`

**Behavior:**
- State: `difficulty` ('easy' | 'medium' | 'hard' | 'ultra'), `targetTime`, `progressionState`, `showHint` (starts false, sets to true after 30s timer), `feedback` ('none' | 'shake' | 'celebrate').
- On mount and on target change: play audio via `playClockAudio`.
- Reset 30s hint timer whenever the current target changes.
- Listen to global `keydown` events (attaches listener, ignores if modifier keys).
- Call `getClockProgressionResult`.
  - If `kind === 'advanced'`: update state, play letter click/tap sound.
  - If `kind === 'incorrect'`: trigger brief 'shake' feedback.
  - If `completed`: trigger 'celebrate' screen flash, play victory sound, wait 1.2s, select next target time.
- Display segment control for Easy / Medium / Hard / Ultra.
- Display "New Clock" button to skip/reshuffle.
- Display ghost guide under clock if `showHint === true`.

- [ ] **Step 1: Write `ClockGame.test.tsx`**

- [ ] **Step 2: Implement `ClockGame.tsx` & `ClockGame.module.css`**

- [ ] **Step 3: Run tests**

Run: `yarn jest components/ClockGame/ClockGame.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/ClockGame/ClockGame.tsx components/ClockGame/ClockGame.module.css components/ClockGame/ClockGame.test.tsx
git commit -m "feat(clock): implement interactive ClockGame component with hint timer and celebratory feedback"
```

---

### Task R2: Review Tasks 4-5 — `review-agent`

**Scope:** `ClockFace.tsx`, `ClockFace.test.tsx`, `ClockGame.tsx`, `ClockGame.test.tsx`.

- [ ] **Step 1: Adversarial review**
Check:
1. Are event listeners properly cleaned up on unmount?
2. Does the 30-second timer reset cleanly on each new question?
3. Does the SVG render crisply on small and large screens without clipping?
4. Are ARIA tags and accessible labels present?

- [ ] **Step 2: Triage & fix any issues**

---

## Phase 4: App Shell, Navigation & Dedicated Routes

### Task 6: AppShellNav & Global Layout Integration — `build-agent` (worktree)

**Files:**
- Create: `components/AppShellNav/AppShellNav.tsx`
- Create: `components/AppShellNav/AppShellNav.module.css`
- Create: `components/AppShellNav/AppShellNav.test.tsx`
- Modify: `app/layout.tsx`

**Features:**
- Sticky top navigation bar.
- Left: `🏠 Menu` button linking to `/`.
- Center/Right buttons with icons & labels:
  - 🔤 Words (`/words`)
  - 🔢 Counting (`/counting`)
  - 🕒 Clock (`/clock`)
  - ❓ Quiz (`/quiz`)
  - 🎵 Rhyme (`/rhyme`)
- Highlights the current path using `usePathname()`.
- Fits 1024x768 screens without wrapping into multi-line clutter.

- [ ] **Step 1: Write tests in `components/AppShellNav/AppShellNav.test.tsx`**

Verify:
- Renders all 5 game links and the home button.
- Active route gets aria-current / highlighted styling.

- [ ] **Step 2: Implement `AppShellNav.tsx` and integrate into `app/layout.tsx`**

- [ ] **Step 3: Run tests**

Run: `yarn jest components/AppShellNav/AppShellNav.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add components/AppShellNav/AppShellNav.tsx components/AppShellNav/AppShellNav.module.css components/AppShellNav/AppShellNav.test.tsx app/layout.tsx
git commit -m "feat(nav): implement global AppShellNav header across the application"
```

---

### Task 7: Game Routes & Hub Launcher Page — `build-agent` (worktree)

**Files:**
- Create: `app/clock/page.tsx` (renders `<ClockGame />`)
- Create: `app/words/page.tsx` (renders `<TypingGame initialMode="words" />`)
- Create: `app/counting/page.tsx` (renders `<TypingGame initialMode="count" />`)
- Create: `app/quiz/page.tsx` (renders `<TypingGame initialMode="quiz" />`)
- Modify: `app/page.tsx` (renders friendly launcher cards with instant launch, or acts as hub)
- Modify: `components/TypingGame/TypingGame.tsx` (accept optional `initialMode?: GameMode` prop)

- [ ] **Step 1: Update `TypingGame.tsx` to support `initialMode` prop**
- [ ] **Step 2: Create `/clock`, `/words`, `/counting`, `/quiz` pages**
- [ ] **Step 3: Update `app/page.tsx` with vibrant game launcher grid**
- [ ] **Step 4: Run full test suite and typecheck**

Run: `yarn test`
Expected: All tests PASS, zero lint errors, typecheck clean.

- [ ] **Step 5: Run full Next.js static export build**

Run: `yarn build`
Expected: Next.js static export outputs to `out/` with all routes generated successfully (`/clock.html`, `/words.html`, `/counting.html`, `/quiz.html`, `/rhyme.html`).

- [ ] **Step 6: Commit**

```bash
git add app/ components/TypingGame/
git commit -m "feat(routes): wire up dedicated game routes and visual launcher hub"
```

---

## Phase 5: Verification & Quality Assurance

### Task Q1: 5-Layer QA Gauntlet — `qa-agent`

**Target:** Local test build & running server.

- [ ] **Layer 1: Unit tests & Linting**
Run: `yarn test` (runs typecheck, oxlint, stylelint, format, and jest).
Expected: All suites green.

- [ ] **Layer 2: Static Export Build Verification**
Run: `yarn export`
Expected: Exit code 0, `out/clock/index.html` (or `out/clock.html`) created cleanly.

- [ ] **Layer 3: Route & Navigation Inspection**
Test navigation between `/words`, `/counting`, `/clock`, `/quiz`, `/rhyme` in browser/Playwright. Confirm header stays responsive and current route is highlighted.

- [ ] **Layer 4: Clock Gameplay & Audio Verification**
- Load `/clock`.
- Verify Easy mode speaks *"It is [X] o'clock"*, pressing digit advances.
- Verify Medium mode typing `Q` -> `T` -> `8` reveals tokens and completes.
- Verify 30-second hint timer appears after wait.
- Verify `/record` page contains new clock audio targets.

---

## Execution Choice

Three execution options are available:
1. **Subagent-driven (Recommended)** — Fresh subagent per task, systematic verification between tasks.
2. **Workflow orchestration** — Orchestrated across phases.
3. **Inline execution** — Executed directly in this session with checkpoint reviews.
