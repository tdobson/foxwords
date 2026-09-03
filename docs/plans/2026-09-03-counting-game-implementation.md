# Counting minigame implementation plan

> **For agentic workers:** This plan is structured for workflow orchestration. Tasks are labelled with agent types (`build-agent` / `review-agent` / `qa-agent`). Build tasks use `isolation: worktree`. Review tasks follow every 1-3 build tasks. QA gates every deploy.
>
> **Execution:** Use `superpowers:subagent-driven-development` (recommended) for inline execution, or drop phases directly into a Workflow script's `pipeline()`/`parallel()` calls for orchestrated execution at scale.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a toddler-friendly counting minigame (`mode === 'count'`) within the existing `TypingGame` screen, using familiar objects from `LEARNING_WORDS`, an empty number box, a 14-second glyph fade-in hint, three difficulty tiers (easy 1-9 single digit, medium 10-20 tens-and-ones, hard 1-20 even grid followed by spelling the word), and spoken audio (number name + plural).

**Architecture:** Extend `GameMode` to include `'count'`. Add pure progression matching for decimal number strings and spoken plural resolution. Create `CountPrompt` to lay out object clusters (row, ten-and-ones, or grid) alongside number tiles that support the 14-second fade hint. Wire `TypingGame` and `GameControls` to toggle count mode and its difficulties without unlocks. Extend the recorder and `/api/audio` route to support number and plural audio clips.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Mantine 9, CSS Modules, Jest 30, React Testing Library, Oxfmt, Oxlint, Stylelint.

**Codebases affected:** `james-game.tdobson.net` only.

---

## File map

- `james-game.tdobson.net/types/learning-word.types.ts` — add `'count'` to `GameMode`, define `CountDifficulty`, `CountProgressionInput`, `CountProgressionResult`.
- `james-game.tdobson.net/constants/count-difficulties.ts` — definitions, count ranges, and descriptions for Easy, Medium, and Hard count levels.
- `james-game.tdobson.net/constants/count-numbers.ts` — 1–20 number slugs and names for audio and recorder.
- `james-game.tdobson.net/constants/count-plurals.ts` — irregular plural map and `getObjectSpokenLabel` helper.
- `james-game.tdobson.net/constants/count-plurals.test.ts` — unit tests for singular, regular, and irregular plurals.
- `james-game.tdobson.net/utils/count-progression.ts` — pure number-string progression validator.
- `james-game.tdobson.net/utils/count-progression.test.ts` — unit tests for single and multi-digit progression.
- `james-game.tdobson.net/utils/audio.ts` — audio path getters for numbers and plurals.
- `james-game.tdobson.net/components/CountPrompt/CountPrompt.module.css` — styles for object clusters, tens-and-ones groups, number tiles, and the 14s fade-in animation.
- `james-game.tdobson.net/components/CountPrompt/CountPrompt.tsx` — object cluster, tens grouping, and number tiles component.
- `james-game.tdobson.net/components/CountPrompt/CountPrompt.test.tsx` — render and snapshot/attribute tests for CountPrompt.
- `james-game.tdobson.net/components/GameControls/GameControls.tsx` — add Count mode button (unlocked) and Easy/Medium/Hard segmented control when in count mode.
- `james-game.tdobson.net/components/TypingGame/TypingGame.tsx` — count state, 14s timer, audio sequencing, digit input handling, and mode switching.
- `james-game.tdobson.net/components/TypingGame/TypingGame.test.tsx` — integration tests for count mode, input progression, 14s hint, and hard-mode word spelling.
- `james-game.tdobson.net/app/api/audio/route.ts` — allowlist and list existing files for `numbers` and `plurals`.
- `james-game.tdobson.net/app/record/RecordPage.tsx` — include numbers and plurals in the recorder queue.
- `james-game.tdobson.net/app/record/RecordPage.test.tsx` — verify recorder list includes new items.

---

## Phase 1: Data, types, and pure progression logic

### Task 1: Add counting types, constants, and audio path utilities — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `types/learning-word.types.ts`
- Create: `constants/count-difficulties.ts`
- Create: `constants/count-numbers.ts`
- Create: `constants/count-plurals.ts`
- Test: `constants/count-plurals.test.ts`
- Modify: `utils/audio.ts`

**Contract:** Input: types and requirements from spec. Output: typed constants, plural resolution helper, audio path getters, and passing unit tests.

- [ ] **Step 1: Write failing tests for spoken plural resolution**

Create `constants/count-plurals.test.ts`:
```typescript
import { describe, expect, it } from '@jest/globals';
import { getObjectSpokenLabel } from './count-plurals';
import { LEARNING_WORDS } from './learning-words';

describe('getObjectSpokenLabel', () => {
  const daddy = LEARNING_WORDS.find((w) => w.id === 'daddy')!;
  const fox = LEARNING_WORDS.find((w) => w.id === 'fox')!;
  const games = LEARNING_WORDS.find((w) => w.id === 'games')!;
  const cat = LEARNING_WORDS.find((w) => w.id === 'cat')!;

  it('returns singular promptLabel when count is 1', () => {
    expect(getObjectSpokenLabel({ word: daddy, count: 1 })).toBe('Daddy');
    expect(getObjectSpokenLabel({ word: fox, count: 1 })).toBe('Fox');
  });

  it('resolves irregular plurals correctly', () => {
    expect(getObjectSpokenLabel({ word: daddy, count: 2 })).toBe('Daddies');
    expect(getObjectSpokenLabel({ word: fox, count: 3 })).toBe('Foxes');
  });

  it('keeps games unchanged for plural', () => {
    expect(getObjectSpokenLabel({ word: games, count: 4 })).toBe('Games');
  });

  it('appends s for standard regular nouns', () => {
    expect(getObjectSpokenLabel({ word: cat, count: 2 })).toBe('Cats');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest constants/count-plurals.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Update `types/learning-word.types.ts`**

Edit `types/learning-word.types.ts`:
```typescript
export type DifficultyLevel = 'faint' | 'reveal';
export type GameMode = 'words' | 'quiz' | 'count';
export type CountDifficulty = 'easy' | 'medium' | 'hard';
export type ProgressionKind = 'advanced' | 'incorrect' | 'ignored';

export interface DifficultyDefinition {
  value: DifficultyLevel;
  label: string;
  description: string;
}

export interface CountDifficultyDefinition {
  value: CountDifficulty;
  label: string;
  description: string;
  minCount: number;
  maxCount: number;
}

export interface LearningWord {
  id: string;
  word: string;
  promptLabel: string;
  accentColor: string;
  /** Emoji fallback (also used when no photo exists) */
  promptImage?: string;
  /** Photo path in public/images/words (e.g. /images/words/daddy.jpg) */
  promptPhoto?: string;
  ipa: string[];
}

export interface Phoneme {
  symbol: string;
  slug: string;
  label: string;
  examples: string[];
  letterName?: string;
}

export interface ProgressionInput {
  word: string;
  nextIndex: number;
  key: string;
}

export interface ProgressionResult {
  kind: ProgressionKind;
  nextIndex: number;
  completed: boolean;
}

export interface CountProgressionInput {
  targetNumber: number;
  nextIndex: number;
  key: string;
}

export interface CountProgressionResult {
  kind: ProgressionKind;
  nextIndex: number;
  completed: boolean;
}
```

- [ ] **Step 4: Create `constants/count-difficulties.ts`, `constants/count-numbers.ts`, `constants/count-plurals.ts`, and update `utils/audio.ts`**

Create `constants/count-difficulties.ts`:
```typescript
import { CountDifficulty, CountDifficultyDefinition } from '../types/learning-word.types';

export const COUNT_DIFFICULTIES: Record<CountDifficulty, CountDifficultyDefinition> = {
  easy: {
    value: 'easy',
    label: 'Easy',
    description: 'Counts 1–9. Type the single digit.',
    minCount: 1,
    maxCount: 9,
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    description: 'Counts 10–20. Type both digits (tens and ones layout).',
    minCount: 10,
    maxCount: 20,
  },
  hard: {
    value: 'hard',
    label: 'Hard',
    description: 'Counts 1–20. Type the digit(s) then spell the word.',
    minCount: 1,
    maxCount: 20,
  },
};
```

Create `constants/count-numbers.ts`:
```typescript
export interface CountNumber {
  value: number;
  slug: string;
  name: string;
}

export const COUNT_NUMBERS: CountNumber[] = [
  { value: 1, slug: 'one', name: 'One' },
  { value: 2, slug: 'two', name: 'Two' },
  { value: 3, slug: 'three', name: 'Three' },
  { value: 4, slug: 'four', name: 'Four' },
  { value: 5, slug: 'five', name: 'Five' },
  { value: 6, slug: 'six', name: 'Six' },
  { value: 7, slug: 'seven', name: 'Seven' },
  { value: 8, slug: 'eight', name: 'Eight' },
  { value: 9, slug: 'nine', name: 'Nine' },
  { value: 10, slug: 'ten', name: 'Ten' },
  { value: 11, slug: 'eleven', name: 'Eleven' },
  { value: 12, slug: 'twelve', name: 'Twelve' },
  { value: 13, slug: 'thirteen', name: 'Thirteen' },
  { value: 14, slug: 'fourteen', name: 'Fourteen' },
  { value: 15, slug: 'fifteen', name: 'Fifteen' },
  { value: 16, slug: 'sixteen', name: 'Sixteen' },
  { value: 17, slug: 'seventeen', name: 'Seventeen' },
  { value: 18, slug: 'eighteen', name: 'Eighteen' },
  { value: 19, slug: 'nineteen', name: 'Nineteen' },
  { value: 20, slug: 'twenty', name: 'Twenty' },
];

export function getCountNumberSlug(value: number): string | undefined {
  return COUNT_NUMBERS.find((item) => item.value === value)?.slug;
}
```

Create `constants/count-plurals.ts`:
```typescript
import { LearningWord } from '../types/learning-word.types';

export const IRREGULAR_PLURALS: Record<string, string> = {
  daddy: 'Daddies',
  mummy: 'Mummies',
  baby: 'Babies',
  granny: 'Grannies',
  fox: 'Foxes',
  splash: 'Splashes',
  orange: 'Oranges',
  games: 'Games',
};

export interface ObjectSpokenLabelOptions {
  word: LearningWord;
  count: number;
}

export function getObjectSpokenLabel({ word, count }: ObjectSpokenLabelOptions): string {
  if (count === 1) {
    return word.promptLabel;
  }
  if (IRREGULAR_PLURALS[word.id]) {
    return IRREGULAR_PLURALS[word.id];
  }
  return `${word.promptLabel}s`;
}
```

Modify `utils/audio.ts` to add helpers:
```typescript
const NUMBER_AUDIO_DIR = '/audio/numbers';
const PLURAL_AUDIO_DIR = '/audio/plurals';

export function getNumberAudioPath(slug: string): string {
  return `${NUMBER_AUDIO_DIR}/${slug}.webm`;
}

export function getPluralAudioPath(wordId: string): string {
  return `${PLURAL_AUDIO_DIR}/${wordId}.webm`;
}
```

- [ ] **Step 5: Run tests and verify PASS**

Run: `yarn jest constants/count-plurals.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add types/learning-word.types.ts constants/count-difficulties.ts constants/count-numbers.ts constants/count-plurals.ts constants/count-plurals.test.ts utils/audio.ts
git commit -m "feat: add counting types, difficulties, number slugs, and plural resolution"
```

---

### Task 2: Pure count progression validator — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Create: `utils/count-progression.ts`
- Test: `utils/count-progression.test.ts`

**Contract:** Input: target number (int), nextIndex (int), key pressed (string). Output: `{ kind: 'advanced' | 'incorrect' | 'ignored', nextIndex, completed: boolean }`.

- [ ] **Step 1: Write failing unit test for `getCountProgressionResult`**

Create `utils/count-progression.test.ts`:
```typescript
import { describe, expect, it } from '@jest/globals';
import { getCountProgressionResult } from './count-progression';

describe('getCountProgressionResult', () => {
  it('advances on correct single digit', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: '2' })).toEqual({
      kind: 'advanced',
      nextIndex: 1,
      completed: true,
    });
  });

  it('marks incorrect on wrong single digit', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: '3' })).toEqual({
      kind: 'incorrect',
      nextIndex: 0,
      completed: false,
    });
  });

  it('advances on first digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 0, key: '1' })).toEqual({
      kind: 'advanced',
      nextIndex: 1,
      completed: false,
    });
  });

  it('completes on second digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 1, key: '2' })).toEqual({
      kind: 'advanced',
      nextIndex: 2,
      completed: true,
    });
  });

  it('shakes on wrong second digit of double-digit number', () => {
    expect(getCountProgressionResult({ targetNumber: 12, nextIndex: 1, key: '3' })).toEqual({
      kind: 'incorrect',
      nextIndex: 1,
      completed: false,
    });
  });

  it('ignores non-digit keys (letters, symbols, navigation)', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: 'd' })).toEqual({
      kind: 'ignored',
      nextIndex: 0,
      completed: false,
    });
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 0, key: 'Enter' })).toEqual({
      kind: 'ignored',
      nextIndex: 0,
      completed: false,
    });
  });

  it('ignores input once number is already completed', () => {
    expect(getCountProgressionResult({ targetNumber: 2, nextIndex: 1, key: '2' })).toEqual({
      kind: 'ignored',
      nextIndex: 1,
      completed: true,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest utils/count-progression.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `utils/count-progression.ts`**

Create `utils/count-progression.ts`:
```typescript
import { CountProgressionInput, CountProgressionResult } from '../types/learning-word.types';

export function getCountProgressionResult(input: CountProgressionInput): CountProgressionResult {
  const { targetNumber, nextIndex, key } = input;
  const targetStr = targetNumber.toString();

  if (nextIndex >= targetStr.length) {
    return { kind: 'ignored', nextIndex, completed: true };
  }

  // Only accept digits 0-9
  if (!/^[0-9]$/.test(key)) {
    return { kind: 'ignored', nextIndex, completed: false };
  }

  const expectedChar = targetStr[nextIndex];
  if (key !== expectedChar) {
    return { kind: 'incorrect', nextIndex, completed: false };
  }

  const updatedIndex = nextIndex + 1;
  const completed = updatedIndex === targetStr.length;

  return {
    kind: 'advanced',
    nextIndex: updatedIndex,
    completed,
  };
}
```

- [ ] **Step 4: Run test and verify PASS**

Run: `yarn jest utils/count-progression.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add utils/count-progression.ts utils/count-progression.test.ts
git commit -m "feat: implement pure number string progression utility"
```

---

### Task R1: Review Tasks 1 and 2 — `review-agent`

**Scope:** Diff from Tasks 1 and 2 (`types/learning-word.types.ts`, `constants/count-difficulties.ts`, `constants/count-numbers.ts`, `constants/count-plurals.ts`, `utils/count-progression.ts`, and test files).
**Spec reference:** `docs/superpowers/specs/2026-09-03-counting-game-design.md` §Round data, §Input, §Count difficulties.

- [ ] **Step 1: Adversarial review**

Dispatch review-agent:
- Verify irregular plurals match the spec requirements (daddy, mummy, baby, granny, fox, splash, orange, games).
- Verify progression ignores non-digits and respects left-to-right multi-digit progression.
- Verify `CountDifficulty` definitions align with ranges (easy: 1-9, medium: 10-20, hard: 1-20).

- [ ] **Step 2: Triage findings**

Resolve any findings before proceeding to UI components.

---

## Phase 2: UI Component — `CountPrompt`

### Task 3: Create `CountPrompt` visual component with 14s fade-in support — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Create: `components/CountPrompt/CountPrompt.module.css`
- Create: `components/CountPrompt/CountPrompt.tsx`
- Test: `components/CountPrompt/CountPrompt.test.tsx`

**Contract:**
Input props:
```typescript
export interface CountPromptProps {
  word: LearningWord;
  count: number;
  layout: 'row' | 'tens' | 'grid';
  numberNextIndex: number;
  hintRevealed: boolean;
  isCorrect: boolean;
}
```
Behavior:
- Displays `count` copies of `word.promptPhoto` (or `word.promptImage` emoji).
- If `layout === 'tens'`, splits items into groups of 10 (two rows of five) plus leftover ones.
- If `layout === 'grid'`, displays an even grid.
- If `layout === 'row'`, displays a flex row.
- Renders number tiles for the target number string.
- If `hintRevealed` is true, unfinished tiles display the target digit with a faint/fade-in state. If `isCorrect`, tiles show completed filled state.
- No text such as "Two daddies" or "2" appears in headers.

- [ ] **Step 1: Write failing unit test for `CountPrompt`**

Create `components/CountPrompt/CountPrompt.test.tsx`:
```typescript
import React from 'react';
import { render, screen } from '@/test-utils';
import { CountPrompt } from './CountPrompt';
import { LEARNING_WORDS } from '../../constants/learning-words';

describe('CountPrompt', () => {
  const cat = LEARNING_WORDS.find((w) => w.id === 'cat')!;

  it('renders 2 items and 1 empty number tile for count 2', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={0}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    const items = screen.getAllByTestId('count-item');
    expect(items).toHaveLength(2);

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'hidden');
    expect(tile.textContent).toBe('');
  });

  it('reveals faint glyph hint when hintRevealed is true and not yet typed', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={0}
        hintRevealed={true}
        isCorrect={false}
      />
    );

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'faint');
    expect(tile.textContent).toBe('2');
  });

  it('renders 2 tiles for count 12 and tens-and-ones grouping', () => {
    render(
      <CountPrompt
        word={cat}
        count={12}
        layout="tens"
        numberNextIndex={1}
        hintRevealed={false}
        isCorrect={false}
      />
    );

    const items = screen.getAllByTestId('count-item');
    expect(items).toHaveLength(12);

    expect(screen.getByTestId('tens-group-0')).toBeInTheDocument();
    expect(screen.getByTestId('ones-group')).toBeInTheDocument();

    const tile0 = screen.getByTestId('number-tile-0');
    const tile1 = screen.getByTestId('number-tile-1');
    expect(tile0).toHaveAttribute('data-state', 'completed');
    expect(tile0.textContent).toBe('1');
    expect(tile1).toHaveAttribute('data-state', 'hidden');
    expect(tile1.textContent).toBe('');
  });

  it('displays completed tiles when isCorrect is true', () => {
    render(
      <CountPrompt
        word={cat}
        count={2}
        layout="row"
        numberNextIndex={1}
        hintRevealed={false}
        isCorrect={true}
      />
    );

    const tile = screen.getByTestId('number-tile-0');
    expect(tile).toHaveAttribute('data-state', 'completed');
    expect(tile.textContent).toBe('2');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest components/CountPrompt/CountPrompt.test.tsx`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `CountPrompt.module.css` and `CountPrompt.tsx`**

Create `components/CountPrompt/CountPrompt.module.css`:
```css
.countCard {
  border: 3px solid;
  border-radius: 1.5rem;
  padding: 1.75rem;
  text-align: center;
  max-width: 640px;
  width: 100%;
  background-color: #fff;
  box-shadow: 0 4px 20px rgb(0, 0, 0, 0.05);
}

.clusterContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 180px;
  margin-bottom: 1.5rem;
}

/* Layout: simple row (counts 1-9) */
.rowLayout {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
}

/* Layout: tens-and-ones (counts 10-20) */
.tensLayout {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
}

.tensGroup {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: #f8fafc;
  border: 2px dashed #cbd5e1;
  border-radius: 1rem;
}

.onesGroup {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
}

/* Layout: full even grid (hard mode) */
.gridLayout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(3.5rem, 1fr));
  gap: 0.5rem;
  max-width: 480px;
  margin: 0 auto;
}

.itemWrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(2rem, 5vw, 3rem);
}

.itemPhoto {
  width: clamp(3rem, 7vw, 4.5rem);
  height: clamp(3rem, 7vw, 4.5rem);
  object-fit: cover;
  border-radius: 0.75rem;
  box-shadow: 0 4px 10px rgb(0, 0, 0, 0.1);
}

/* Number Tiles container & items */
.numberTilesContainer {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin: 1rem 0;
  padding: 0;
  list-style: none;
}

.numberTile {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(3rem, 12vw, 4.5rem);
  height: clamp(3.75rem, 15vw, 5.5rem);
  border-radius: clamp(0.5rem, 2vw, 1rem);
  font-size: clamp(1.75rem, 7vw, 2.75rem);
  font-weight: 800;
  user-select: none;
  transition:
    background-color 0.8s ease,
    color 0.8s ease,
    border-color 0.8s ease;
}

.numberTile[data-state='completed'] {
  background-color: #c2410c;
  color: #fff;
  border: 3px solid #9a3412;
  box-shadow: 0 6px 12px rgb(194, 65, 12, 0.25);
  transform: scale(1.02);
}

.numberTile[data-state='hidden'] {
  background-color: #f1f5f9;
  color: transparent;
  border: 2px dashed #cbd5e1;
}

.numberTile[data-state='faint'] {
  background-color: #f8fafc;
  color: #94a3b8;
  border: 2px dashed #e2e8f0;
  opacity: 1;
  animation: fadeInHint 1s ease-in;
}

@keyframes fadeInHint {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .numberTile {
    transition: none;
    animation: none;
  }
  .numberTile[data-state='faint'] {
    animation: none;
  }
}
```

Create `components/CountPrompt/CountPrompt.tsx`:
```typescript
import React from 'react';
import { Paper } from '@mantine/core';
import { LearningWord } from '../../types/learning-word.types';
import classes from './CountPrompt.module.css';

export interface CountPromptProps {
  word: LearningWord;
  count: number;
  layout: 'row' | 'tens' | 'grid';
  numberNextIndex: number;
  hintRevealed: boolean;
  isCorrect: boolean;
}

export function CountPrompt({
  word,
  count,
  layout,
  numberNextIndex,
  hintRevealed,
  isCorrect,
}: CountPromptProps) {
  const targetStr = count.toString();
  const digits = targetStr.split('');

  const renderItem = (key: string) => (
    <div key={key} className={classes.itemWrapper} data-testid="count-item" aria-hidden="true">
      {word.promptPhoto ? (
        <img
          src={word.promptPhoto}
          alt={`One of ${count} ${word.promptLabel}`}
          className={classes.itemPhoto}
        />
      ) : (
        <span>{word.promptImage || '✨'}</span>
      )}
    </div>
  );

  const renderCluster = () => {
    if (layout === 'tens') {
      const tenGroupsCount = Math.floor(count / 10);
      const remainder = count % 10;
      const groups = [];

      for (let g = 0; g < tenGroupsCount; g += 1) {
        const tenItems = [];
        for (let i = 0; i < 10; i += 1) {
          tenItems.push(renderItem(`ten-${g}-${i}`));
        }
        groups.push(
          <div
            key={`group-${g}`}
            className={classes.tensGroup}
            data-testid={`tens-group-${g}`}
            aria-label="Group of 10 items"
          >
            {tenItems}
          </div>
        );
      }

      if (remainder > 0) {
        const onesItems = [];
        for (let i = 0; i < remainder; i += 1) {
          onesItems.push(renderItem(`rem-${i}`));
        }
        groups.push(
          <div
            key="remainder"
            className={classes.onesGroup}
            data-testid="ones-group"
            aria-label={`${remainder} leftover items`}
          >
            {onesItems}
          </div>
        );
      }

      return <div className={classes.tensLayout}>{groups}</div>;
    }

    if (layout === 'grid') {
      const items = Array.from({ length: count }, (_, i) => renderItem(`grid-${i}`));
      return <div className={classes.gridLayout}>{items}</div>;
    }

    const items = Array.from({ length: count }, (_, i) => renderItem(`row-${i}`));
    return <div className={classes.rowLayout}>{items}</div>;
  };

  return (
    <Paper
      className={classes.countCard}
      style={{ borderColor: word.accentColor }}
      role="region"
      aria-label={`Count prompt with ${count} objects`}
    >
      <div className={classes.clusterContainer}>{renderCluster()}</div>

      <ol className={classes.numberTilesContainer} aria-label="Number answer tiles">
        {digits.map((digit, index) => {
          let state: 'completed' | 'faint' | 'hidden' = 'hidden';

          if (isCorrect || index < numberNextIndex) {
            state = 'completed';
          } else if (hintRevealed) {
            state = 'faint';
          }

          return (
            <li
              key={`digit-tile-${index}`}
              className={classes.numberTile}
              data-testid={`number-tile-${index}`}
              data-state={state}
              aria-label={
                state === 'completed'
                  ? `Digit ${digit}, completed`
                  : state === 'faint'
                    ? `Digit ${digit}, hint`
                    : `Digit ${index + 1} of ${digits.length}, blank`
              }
            >
              {state === 'hidden' ? '' : digit}
            </li>
          );
        })}
      </ol>
    </Paper>
  );
}
```

- [ ] **Step 4: Run test and verify PASS**

Run: `yarn jest components/CountPrompt/CountPrompt.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/CountPrompt/
git commit -m "feat: implement CountPrompt with tens-and-ones layout and 14s fade hint"
```

---

## Phase 3: Controls, Game Integration, and Audio Sequencing

### Task 4: Update `GameControls` to support Count mode and Count difficulties — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `components/GameControls/GameControls.tsx`
- Modify: `components/GameControls/GameControls.module.css` (if needed)
- Modify: `components/TypingGame/TypingGame.test.tsx` (or add controls test)

**Contract:**
- Props extended:
  ```typescript
  export interface GameControlsProps {
    difficulty: DifficultyLevel;
    onDifficultyChange: (difficulty: DifficultyLevel) => void;
    countDifficulty: CountDifficulty;
    onCountDifficultyChange: (difficulty: CountDifficulty) => void;
    onNewWord: () => void;
    mode: GameMode;
    onModeChange: (mode: GameMode) => void;
    quizLocked: boolean;
  }
  ```
- When `mode === 'count'`, the difficulty label shows "Count Difficulty:" with Easy / Medium / Hard options.
- The Count button is always enabled and switches mode between words and count (or between modes).
- Quiz button behaves as before.

- [ ] **Step 1: Update `components/GameControls/GameControls.tsx`**

Edit `components/GameControls/GameControls.tsx`:
```typescript
import React from 'react';
import { Button, SegmentedControl, Text } from '@mantine/core';
import { DIFFICULTY_LEVELS } from '../../constants/difficulty-levels';
import { COUNT_DIFFICULTIES } from '../../constants/count-difficulties';
import { QUIZ_UNLOCK_THRESHOLD } from '../../constants/learning-words';
import { CountDifficulty, DifficultyLevel, GameMode } from '../../types/learning-word.types';
import classes from './GameControls.module.css';

export interface GameControlsProps {
  difficulty: DifficultyLevel;
  onDifficultyChange: (difficulty: DifficultyLevel) => void;
  countDifficulty: CountDifficulty;
  onCountDifficultyChange: (difficulty: CountDifficulty) => void;
  onNewWord: () => void;
  mode: GameMode;
  onModeChange: (mode: GameMode) => void;
  quizLocked: boolean;
}

export function GameControls({
  difficulty,
  onDifficultyChange,
  countDifficulty,
  onCountDifficultyChange,
  onNewWord,
  mode,
  onModeChange,
  quizLocked,
}: GameControlsProps) {
  const isCount = mode === 'count';

  const wordDifficultyData = Object.values(DIFFICULTY_LEVELS).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  const countDifficultyData = Object.values(COUNT_DIFFICULTIES).map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <div className={classes.controlsContainer}>
      <div className={classes.controlsRow}>
        <Text size="sm" fw={600} c="dimmed">
          {isCount ? 'Count Level:' : 'Difficulty:'}
        </Text>
        {isCount ? (
          <SegmentedControl
            value={countDifficulty}
            onChange={(val) => onCountDifficultyChange(val as CountDifficulty)}
            data={countDifficultyData}
            size="md"
            radius="md"
            className={classes.segmentedControl}
            aria-label="Select count difficulty"
          />
        ) : (
          <SegmentedControl
            value={difficulty}
            onChange={(val) => onDifficultyChange(val as DifficultyLevel)}
            data={wordDifficultyData}
            size="md"
            radius="md"
            className={classes.segmentedControl}
            aria-label="Select difficulty mode"
          />
        )}
        <Button
          onClick={onNewWord}
          size="md"
          radius="md"
          color="orange"
          className={classes.newWordButton}
        >
          New word
        </Button>
        <Button
          onClick={() => onModeChange(mode === 'count' ? 'words' : 'count')}
          size="md"
          radius="md"
          variant={mode === 'count' ? 'filled' : 'outline'}
          color="teal"
          title="Switch to counting minigame"
        >
          {mode === 'count' ? 'Back to words' : 'Count'}
        </Button>
        <Button
          onClick={() => onModeChange(mode === 'quiz' ? 'words' : 'quiz')}
          size="md"
          radius="md"
          variant={mode === 'quiz' ? 'filled' : 'outline'}
          disabled={quizLocked}
          title={
            quizLocked
              ? `Keep practising — quiz unlocks after ${QUIZ_UNLOCK_THRESHOLD} words`
              : 'Switch to first-letter quiz'
          }
        >
          {mode === 'quiz' ? 'Back to words' : 'Quiz'}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/GameControls/GameControls.tsx
git commit -m "feat: add Count button and count difficulty segmented control to GameControls"
```

---

### Task 5: Integrate Count mode into `TypingGame` with 14s timer, audio sequencing, and hard-mode word spelling — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `components/TypingGame/TypingGame.tsx`
- Test: `components/TypingGame/TypingGame.test.tsx`

**Contract:**
- Supports `mode === 'count'`.
- On entering Count mode or next count round, randomly selects a count in the range for the current difficulty (Easy: 1-9, Medium: 10-20, Hard: 1-20), avoiding consecutive duplicate counts.
- Sets a 14-second timeout (`COUNT_HINT_DELAY_MS = 14000`). When timer fires, sets `hintRevealed = true`. Completing the number clears the timer.
- Audio at round start and completion: plays number audio (`getNumberAudioPath(slug)`) then object audio (`getWordAudioPath(id)` or `getPluralAudioPath(id)` after a short pause).
- Keyboard handler:
  - In Count mode, digits advance `numberNextIndex`. Non-digits are ignored. Incorrect digit triggers shake.
  - If `countDifficulty === 'hard'`, once the number completes (`numberCompleted`), the word tiles are revealed. Subsequent letter keys advance the word via `getProgressionResult`. Digits are ignored. Completing the word finishes the round with celebration.
  - If `countDifficulty !== 'hard'`, completing the number completes the round with celebration.

- [ ] **Step 1: Write integration tests for Count mode in `TypingGame.test.tsx`**

Add tests to `components/TypingGame/TypingGame.test.tsx`:
```typescript
it('allows switching to Count mode immediately with zero completed words', () => {
  render(<TypingGame />);
  const countBtn = screen.getByRole('button', { name: /^count$/i });
  expect(countBtn).toBeEnabled();
  fireEvent.click(countBtn);
  expect(screen.getByRole('region', { name: /count prompt with/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /back to words/i })).toBeInTheDocument();
});

it('advances count on correct digit in easy mode and reveals 14s hint if delayed', () => {
  jest.useFakeTimers();
  render(<TypingGame />);
  fireEvent.click(screen.getByRole('button', { name: /^count$/i }));

  const tile = screen.getByTestId('number-tile-0');
  expect(tile).toHaveAttribute('data-state', 'hidden');

  // Fast-forward 14 seconds
  act(() => {
    jest.advanceTimersByTime(14000);
  });

  expect(tile).toHaveAttribute('data-state', 'faint');
  const expectedDigit = tile.textContent!;
  expect(expectedDigit).toMatch(/^[1-9]$/);

  // Type incorrect digit
  const wrongDigit = expectedDigit === '1' ? '2' : '1';
  fireEvent.keyDown(window, { key: wrongDigit });
  expect(tile).toHaveAttribute('data-state', 'faint');

  // Type correct digit
  fireEvent.keyDown(window, { key: expectedDigit });
  expect(tile).toHaveAttribute('data-state', 'completed');
});

it('hard mode requires typing the number then spelling the word', () => {
  jest.useFakeTimers();
  render(<TypingGame />);
  fireEvent.click(screen.getByRole('button', { name: /^count$/i }));

  // Switch to Hard
  fireEvent.click(screen.getByRole('radio', { name: /hard/i }));

  const numTiles = screen.getAllByTestId(/^number-tile-/);
  // Word tiles must not be in the document until number is completed
  expect(screen.queryByTestId('letter-tile-0')).not.toBeInTheDocument();

  // Reveal hint to easily see target digits
  act(() => {
    jest.advanceTimersByTime(14000);
  });

  for (let i = 0; i < numTiles.length; i += 1) {
    const digit = screen.getByTestId(`number-tile-${i}`).textContent!;
    fireEvent.keyDown(window, { key: digit });
  }

  // Number completed! Word tiles now appear
  expect(screen.getByTestId('letter-tile-0')).toBeInTheDocument();

  // Complete the word (JAMES)
  for (const letter of 'JAMES') {
    fireEvent.keyDown(window, { key: letter });
  }

  // Celebration state
  expect(screen.getByTestId('letter-tile-4')).toHaveAttribute('data-state', 'completed');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest components/TypingGame/TypingGame.test.tsx`
Expected: FAIL (Count mode not wired in `TypingGame`)

- [ ] **Step 3: Implement Count mode in `components/TypingGame/TypingGame.tsx`**

Update `components/TypingGame/TypingGame.tsx`:
- Import `CountPrompt`, `COUNT_DIFFICULTIES`, `getCountProgressionResult`, `getCountNumberSlug`, `getObjectSpokenLabel`, `getNumberAudioPath`, `getPluralAudioPath`.
- Manage state:
  - `countDifficulty`: `CountDifficulty` (default `'easy'`)
  - `targetCount`: `number`
  - `numberNextIndex`: `number`
  - `hintRevealed`: `boolean`
  - `numberCompleted`: `boolean`
- Helper `pickNewCount(diff: CountDifficulty, prevCount?: number): number`
- 14-second hint effect:
  ```typescript
  useEffect(() => {
    if (mode !== 'count' || numberCompleted || isCompleted) {
      return undefined;
    }
    const timer = setTimeout(() => {
      setHintRevealed(true);
    }, COUNT_HINT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [mode, numberCompleted, isCompleted, targetCount]);
  ```
- Spoken audio sequence helper `playCountAudio(count: number, word: LearningWord)`:
  - Plays number audio `getNumberAudioPath(slug)`.
  - After 600ms, plays `count === 1 ? getWordAudioPath(word.id) : getPluralAudioPath(word.id)`.
- Keydown handling:
  - If `mode === 'count'` and `!numberCompleted`: evaluate with `getCountProgressionResult`.
  - If completed, set `numberCompleted = true`. If `countDifficulty !== 'hard'`, mark `isCompleted = true`, celebrate, replay audio.
  - If `countDifficulty === 'hard'` and `numberCompleted`: evaluate with `getProgressionResult` against `currentWord.word`. When word finishes, celebrate, replay audio.
- Render:
  - In interactiveArea, if `mode === 'count'`, render `<CountPrompt ... />` and (if hard mode and number is done) `<WordTiles ... />`.
  - Pass `countDifficulty` and handlers to `<GameControls ... />`.

- [ ] **Step 4: Run tests and verify PASS**

Run: `yarn jest components/TypingGame/TypingGame.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/TypingGame/TypingGame.tsx components/TypingGame/TypingGame.test.tsx
git commit -m "feat: integrate count mode with 14s hint, audio sequencing, and hard mode"
```

---

### Task R2: Review Tasks 4 and 5 — `review-agent`

**Scope:** Diff from Tasks 4 and 5 (`components/GameControls/`, `components/TypingGame/`).
**Spec reference:** `docs/superpowers/specs/2026-09-03-counting-game-design.md` §User experience, §Input, §Number hint.

- [ ] **Step 1: Adversarial review**

Dispatch review-agent:
- Verify 14-second hint cancels properly when typing completes or round switches.
- Verify hard mode does not show word tiles prematurely.
- Verify audio sequencing does not crash when audio files are absent.
- Check that switching between words, quiz, and count preserves cleanly isolated state.

- [ ] **Step 2: Triage findings**

Fix any bugs or timing issues.

---

## Phase 4: Audio recording and API endpoints

### Task 6: Extend `/api/audio` route and `/record` page for numbers and plurals — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`
**Files:**
- Modify: `app/api/audio/route.ts`
- Modify: `app/record/RecordPage.tsx`
- Test: `app/record/RecordPage.test.tsx`

**Contract:**
- `/api/audio` GET returns `{ phonemes, letterNames, words, numbers, plurals }`.
- `/api/audio` POST accepts `kind: 'number'` and `kind: 'plural'` with valid IDs.
- `RecordPage.tsx` adds `COUNT_NUMBERS` (kind: 'number') and `LEARNING_WORDS` plurals (kind: 'plural', with prompt showing plural token) to the recording queue.

- [ ] **Step 1: Write failing test in `app/record/RecordPage.test.tsx`**

Add test checking that total recording count reflects phonemes + letter-names + words + numbers + plurals:
```typescript
it('includes numbers and plurals in the recording queue', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      phonemes: [],
      letterNames: [],
      words: [],
      numbers: [],
      plurals: [],
    }),
  } as Response);

  render(<RecordPage />);

  await waitFor(() => {
    expect(global.fetch).toHaveBeenCalledWith('/api/audio');
  });

  // 44 phonemes + 30 letter-names + 32 words + 20 numbers + 31 plurals (games skipped) = 157 items
  const progressLabel = screen.getByTestId('progress-label');
  expect(progressLabel.textContent).toMatch(/of (15[0-9]|16[0-9])/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest app/record/RecordPage.test.tsx`
Expected: FAIL (total count is still 106)

- [ ] **Step 3: Update `app/api/audio/route.ts` and `app/record/RecordPage.tsx`**

In `app/api/audio/route.ts`:
- Import `COUNT_NUMBERS` and `LEARNING_WORDS`.
- Allowlist `numbers` and `plurals`.
- Include `listExisting('numbers')` and `listExisting('plurals')` in GET response.
- In POST: allow `kind === 'number'` and `kind === 'plural'`.

In `app/record/RecordPage.tsx`:
- Add number items (`kind: 'number'`, path: `public/audio/numbers/${slug}.webm`).
- Add plural items (`kind: 'plural'`, path: `public/audio/plurals/${id}.webm`, prompt showing `getObjectSpokenLabel({ word, count: 2 })`). Note: skip `games` as it reuses the singular word clip.
- Update resume logic to include `numbers` and `plurals`.

- [ ] **Step 4: Run tests and verify PASS**

Run: `yarn jest app/record/RecordPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/audio/route.ts app/record/RecordPage.tsx app/record/RecordPage.test.tsx
git commit -m "feat: add numbers and plurals to audio API and recorder page"
```

---

## Phase 5: Verification and static export check

### Task 7: Full test suite, lint, typecheck, and static build verification — `qa-agent`

**Pre-requisite:** All previous tasks completed and committed.

- [ ] **Step 1: Run format check**

Run: `yarn format:test`
Expected: PASS (or run `yarn format:write` to auto-fix styling)

- [ ] **Step 2: Run oxlint and stylelint**

Run: `yarn lint`
Expected: zero errors and zero warnings.

- [ ] **Step 3: Run TypeScript compiler**

Run: `yarn typecheck`
Expected: PASS with 0 errors.

- [ ] **Step 4: Run full Jest test suite**

Run: `yarn jest`
Expected: All tests PASS across the entire project.

- [ ] **Step 5: Run static export build**

Run: `yarn build`
Expected: Next.js builds and exports static HTML cleanly into `out/`.

- [ ] **Step 6: Commit any remaining fixes**

```bash
git status
# If clean, proceed. If formatting adjustments were made:
git add -A
git commit -m "chore: format and lint cleanups for counting minigame"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-09-03-counting-game-implementation.md`. Three execution options:

1. **Workflow orchestration (recommended for 3+ tasks)** — I write a Workflow script that spawns agents per phase. Build agents get isolated worktrees, review agents verify each chunk, QA agent runs the gauntlet. Best for: multi-agent isolation and adversarial review.
2. **Subagent-driven** — Fresh subagent per task, review between tasks, fast iteration. Best for: single-codebase work.
3. **Inline execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Best for: fast direct implementation.

Which approach would you like to use?
