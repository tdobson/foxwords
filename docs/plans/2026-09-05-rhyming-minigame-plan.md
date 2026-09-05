# Rhyme Time Mini-Game Implementation Plan

> **For agentic workers:** This plan is structured for workflow orchestration. Tasks are labelled with agent types (`build-agent` / `review-agent` / `qa-agent`). Build tasks use `isolation: worktree`. Review tasks follow every 1-3 build tasks. QA gates every deploy.
>
> **Execution:** Use `superpowers:subagent-driven-development` (recommended) for inline execution, or drop phases directly into a Workflow script's `pipeline()`/`parallel()` calls for orchestrated execution at scale.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a toddler-friendly rhyme recognition mini-game (`RhymeGame` accessible via `GameMode = 'rhyme'` and `/rhyme`), presenting a target word hero prompt and two choice cards (one rhyming, one distractor), with dual input (Left/Right Arrow keys or the first letter of each option), audio playback, and non-blocking celebration toasts.

**Architecture:** 
- Add `'rhyme'` to `GameMode` in `types/learning-word.types.ts` and define `RhymeQuestion` and `RhymeChoice` types.
- Create curriculum fixtures in `constants/rhyme-levels.ts` for Levels 1 and 2, referencing existing words in `LEARNING_WORDS`.
- Build a pure input matching helper `utils/rhyme-progression.ts` resolving Left/Right Arrow keys, `A`/`D` keys, and the starting letters of both options.
- Create `components/RhymeGame/RhymeGame.tsx` with high-contrast cards, key badge helpers (`[ ← or H ]`), audio cue playback, shake feedback on incorrect choice, and non-blocking CSS fireworks toast on level completion.
- Wire into `GameControls.tsx` mode switching and add a dedicated `/rhyme` route in `app/rhyme/page.tsx`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Mantine 9, CSS Modules, Jest 30, React Testing Library, Oxfmt, Oxlint, Stylelint.

**Codebases affected:** `james-game.tdobson.net` only.

---

## File map

- `james-game.tdobson.net/types/learning-word.types.ts` — add `'rhyme'` to `GameMode`; define `RhymeQuestion`, `RhymeChoice`, and `RhymeInputResult`.
- `james-game.tdobson.net/constants/rhyme-levels.ts` — Level 1 & Level 2 question sets (targets, rhyming matches, distractors).
- `james-game.tdobson.net/constants/rhyme-levels.test.ts` — verify all words exist in `LEARNING_WORDS`, have valid audio, and initial letters are distinct per question.
- `james-game.tdobson.net/utils/rhyme-progression.ts` — pure input matcher for Arrow keys, A/D keys, and first letters.
- `james-game.tdobson.net/utils/rhyme-progression.test.ts` — unit tests for progression logic (left, right, correct, incorrect, ignored).
- `james-game.tdobson.net/components/RhymeGame/RhymeGame.module.css` — hero target card, side-by-side choice cards, keyboard badges, shake animations, and fireworks toast.
- `james-game.tdobson.net/components/RhymeGame/RhymeGame.tsx` — game state owner, keyboard listener, audio sequencing, and level celebration.
- `james-game.tdobson.net/components/RhymeGame/RhymeGame.test.tsx` — integration tests for keyboard/click inputs, feedback, and level progression.
- `james-game.tdobson.net/components/GameControls/GameControls.tsx` — add "Rhyme" mode button.
- `james-game.tdobson.net/components/TypingGame/TypingGame.tsx` — integrate `RhymeGame` when `mode === 'rhyme'`.
- `james-game.tdobson.net/app/rhyme/page.tsx` — dedicated route for Rhyme Time.

---

## Phase 1: Types, Curriculum Constants & Pure Matcher

### Task 1: Add Rhyme types and curriculum data with tests — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `types/learning-word.types.ts`
- Create: `constants/rhyme-levels.ts`
- Test: `constants/rhyme-levels.test.ts`

**Contract:** Input: Approved spec for Rhyme Time Levels 1 & 2. Output: Typed curriculum constants and passing unit tests.

- [ ] **Step 1: Update `types/learning-word.types.ts`**

Add `'rhyme'` to `GameMode`:
```typescript
export type GameMode = 'words' | 'quiz' | 'count' | 'rhyme';

export interface RhymeChoice {
  wordId: string;
  isRhyme: boolean;
}

export interface RhymeQuestion {
  targetWordId: string;
  leftChoice: RhymeChoice;
  rightChoice: RhymeChoice;
}

export interface RhymeLevel {
  levelNumber: number;
  name: string;
  questions: RhymeQuestion[];
}
```

- [ ] **Step 2: Write tests in `constants/rhyme-levels.test.ts`**

Assert that:
1. Every `targetWordId`, `leftChoice.wordId`, and `rightChoice.wordId` exists in `LEARNING_WORDS`.
2. For each question, exactly one choice has `isRhyme === true`.
3. The initial letters of `leftChoice` and `rightChoice` are distinct (so initial-letter keypresses are unambiguous).
4. Both Level 1 and Level 2 contain 6 questions.

- [ ] **Step 3: Create `constants/rhyme-levels.ts`**

Define `RHYME_LEVELS`:
- Level 1:
  1. `cat` -> `hat` vs `dog`
  2. `frog` -> `log` vs `bus`
  3. `rat` -> `bat` vs `pig`
  4. `bug` -> `mug` vs `sun`
  5. `pan` -> `van` vs `pot`
  6. `fox` -> `box` vs `hen`
- Level 2:
  1. `train` -> `rain` vs `track`
  2. `car` -> `star` vs `cup`
  3. `moon` -> `spoon` vs `boot`
  4. `log` -> `frog` vs `pig`
  5. `bat` -> `rat` vs `fox`
  6. `mug` -> `bug` vs `nut`

- [ ] **Step 4: Run tests and verify PASS**

Run: `npx jest constants/rhyme-levels.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add types/learning-word.types.ts constants/rhyme-levels.ts constants/rhyme-levels.test.ts
git commit -m "feat: add rhyme mini-game types and level curriculum constants"
```

---

### Task 2: Pure Input & Progression Matcher — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Create: `utils/rhyme-progression.ts`
- Test: `utils/rhyme-progression.test.ts`

**Contract:** Pure function taking the active question, the left & right word strings, and a key event, returning which side was selected ('left' | 'right' | null) and whether it is correct.

- [ ] **Step 1: Write tests in `utils/rhyme-progression.test.ts`**

Test cases:
- `ArrowLeft` or `a`/`A` selects `'left'`.
- `ArrowRight` or `d`/`D` selects `'right'`.
- First letter of left word (case-insensitive) selects `'left'`.
- First letter of right word (case-insensitive) selects `'right'`.
- Unrelated keys return `null`.
- Modifier combinations (Ctrl, Alt, Meta) are ignored (`null`).
- Accurately reports `isCorrect: true` when the chosen side has `isRhyme: true`.

- [ ] **Step 2: Implement `utils/rhyme-progression.ts`**

Implement `resolveRhymeInput({ key, leftWord, rightWord, question, ctrlKey, metaKey, altKey })`.

- [ ] **Step 3: Run tests and verify PASS**

Run: `npx jest utils/rhyme-progression.test.ts`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add utils/rhyme-progression.ts utils/rhyme-progression.test.ts
git commit -m "feat: implement pure rhyme input progression matcher"
```

---

## Phase 2: UI Component & Audio Integration

### Task 3: Implement `RhymeGame` component & styling — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Create: `components/RhymeGame/RhymeGame.module.css`
- Create: `components/RhymeGame/RhymeGame.tsx`
- Test: `components/RhymeGame/RhymeGame.test.tsx`

**Contract:** Interactive component with:
- Top hero card displaying target word (emoji, label, audio prompt button, "What rhymes with...?").
- Two choice cards with high-contrast emoji, label with first letter highlighted, and keyboard badges (`[ ← or H ]`, `[ → or D ]`).
- Touch/click buttons for both cards.
- Wobble/shake animation on incorrect choice.
- Green highlight + positive audio cue + star burst on correct choice.
- Floating CSS fireworks toast when level completes (1.2s auto-dismiss, `pointer-events: none`).
- Automatically transitions to next question without interrupting input.

- [ ] **Step 1: Create `components/RhymeGame/RhymeGame.module.css`**

Define styles for:
- Hero target card (`.heroCard`, `.heroEmoji`, `.heroLabel`, `.audioReplayBtn`).
- Choices grid (`.choicesContainer`, `.choiceCard`, `.choiceEmoji`, `.choiceLabel`, `.firstLetter`).
- Keyboard helper badge (`.keyBadge`).
- Animations: `@keyframes shake` for wrong pick, `@keyframes popSuccess` for correct pick, and `.fireworksToast`.

- [ ] **Step 2: Implement `components/RhymeGame/RhymeGame.tsx`**

- Connect to `playWordSound` in `utils/audio.ts`.
- Attach `window.addEventListener('keydown', ...)` using `resolveRhymeInput`.
- Maintain state: `currentLevelIndex`, `questionIndex`, `selectedSide`, `isShake`, `showLevelToast`.
- Auto-advance on correct choice after 1200ms.

- [ ] **Step 3: Write tests in `components/RhymeGame/RhymeGame.test.tsx`**

- Renders target word and choice cards.
- Left arrow selects left card.
- Right arrow selects right card.
- Initial letter key selects appropriate card.
- Incorrect choice sets `data-wrong="true"` / triggers shake.
- Correct choice sets `data-correct="true"`, plays audio, and advances to next question.
- Completing 6 questions shows level toast.

- [ ] **Step 4: Run tests and verify PASS**

Run: `npx jest components/RhymeGame/RhymeGame.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/RhymeGame/
git commit -m "feat: implement RhymeGame component with dual input and audio"
```

---

## Phase 3: Routing, Controls & Integration

### Task 4: Integrate Rhyme Time into `GameControls`, `TypingGame`, and `/rhyme` route — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `components/GameControls/GameControls.tsx`
- Modify: `components/TypingGame/TypingGame.tsx`
- Create: `app/rhyme/page.tsx`
- Test: `components/TypingGame/TypingGame.test.tsx`

**Contract:** Mode switching includes 'rhyme'. Top navigation or mode buttons allow switching into Rhyme Time and back to Words. Standalone `/rhyme` route renders `RhymeGame`.

- [ ] **Step 1: Update `GameControls.tsx`**

Add Rhyme mode toggle button alongside Words, Count, and Quiz:
```tsx
<Button
  onClick={() => onModeChange(mode === 'rhyme' ? 'words' : 'rhyme')}
  size="md"
  radius="md"
  variant={mode === 'rhyme' ? 'filled' : 'outline'}
  color="violet"
  title="Switch to Rhyme Time minigame"
>
  {mode === 'rhyme' ? 'Back to words' : 'Rhyme'}
</Button>
```

- [ ] **Step 2: Update `TypingGame.tsx`**

When `mode === 'rhyme'`, render `<RhymeGame />` inside the game container while keeping controls accessible.

- [ ] **Step 3: Create `app/rhyme/page.tsx`**

Dedicated route for direct access or bookmarking:
```tsx
import { RhymeGame } from '../../components/RhymeGame/RhymeGame';

export default function RhymePage() {
  return <RhymeGame />;
}
```

- [ ] **Step 4: Add integration test in `TypingGame.test.tsx`**

Verify clicking the "Rhyme" mode button switches view to `RhymeGame`.

- [ ] **Step 5: Run tests and verify PASS**

Run: `npx jest components/TypingGame/TypingGame.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add components/GameControls/GameControls.tsx components/TypingGame/TypingGame.tsx app/rhyme/page.tsx components/TypingGame/TypingGame.test.tsx
git commit -m "feat: wire Rhyme Time into GameControls and add /rhyme route"
```

---

## Phase 4: Verification Gauntlet

### Task 5: Full verification gauntlet — `qa-agent`

**Files:** None (validation only).
**Contract:** Run full build and test suite, zero regressions.

- [ ] **Step 1: Run `npm test`**

Runs Next typegen, oxfmt, oxlint, stylelint, tsc, and full Jest suite.
Expected: All suites PASS.

- [ ] **Step 2: Run `npm run build`**

Ensures static export builds clean in `out/`.
Expected: Static HTML export completes successfully.
