# Typing-and-spelling learning game Prototype Implementation Plan

> **For agentic workers:** This plan is structured for workflow orchestration. Tasks are labelled with agent types (`build-agent` / `review-agent` / `qa-agent`). Build tasks use `isolation: worktree`. Review tasks follow every 1-3 build tasks. QA gates every deploy.
>
> **Execution:** Use `superpowers:subagent-driven-development` (recommended) for inline execution, or drop phases directly into a Workflow script's `pipeline()`/`parallel()` calls for orchestrated execution at scale.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify a single-user toddler typing-and-spelling game in the empty Next.js/Mantine app, using local typed word data and physical keyboard input.

**Architecture:** Copy the clean starter surface from `next-app-template` into the target project, then organize the feature into typed data/constants, pure progression utilities, and focused client components. Keep all game state in the client game screen; use no backend, persistence, authentication, or H5P runtime.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 6, Mantine 9, CSS Modules, Jest 30, React Testing Library, Oxfmt, Oxlint, Stylelint.

**Codebases affected:** `james-game.tdobson.net` only; source conventions from `/home/tdobson/dev/typescriptConventions.md`; starter patterns from `/home/tdobson/dev/next-app-template`.

## File map

- `james-game.tdobson.net/package.json` — target project scripts and dependencies copied from the approved template.
- `james-game.tdobson.net/tsconfig.json`, `next.config.mjs`, `postcss.config.cjs`, `oxfmt.config.mjs`, `oxlint.config.mjs`, `.stylelintrc.json`, `jest.config.cjs`, `jest.setup.cjs`, `.nvmrc`, `.yarnrc.yml`, `mantine-styles.d.ts` — target project tooling copied from the template.
- `james-game.tdobson.net/app/layout.tsx` — Mantine provider, metadata, favicon, and viewport.
- `james-game.tdobson.net/app/page.tsx` — route entry that renders the game.
- `james-game.tdobson.net/app/globals.css` — global reset, warm background, and shared visual tokens.
- `james-game.tdobson.net/theme.ts` — Mantine theme override for the game palette and typography.
- `james-game.tdobson.net/types/learning-word.types.ts` — `LearningWord`, `DifficultyLevel`, and progression result interfaces/unions.
- `james-game.tdobson.net/constants/learning-words.ts` — starter word fixtures with deterministic prompt metadata.
- `james-game.tdobson.net/constants/difficulty-levels.ts` — the four scaffold definitions and reveal delay.
- `james-game.tdobson.net/utils/progression.ts` — pure input normalization and next-letter decision logic.
- `james-game.tdobson.net/utils/progression.test.ts` — unit tests for progression behavior.
- `james-game.tdobson.net/components/TypingGame/TypingGame.tsx` — client state owner and keyboard lifecycle.
- `james-game.tdobson.net/components/TypingGame/TypingGame.module.css` — page-level game layout and feedback animations.
- `james-game.tdobson.net/components/PromptCard/PromptCard.tsx` — prompt illustration/fallback and label.
- `james-game.tdobson.net/components/PromptCard/PromptCard.module.css` — prompt presentation.
- `james-game.tdobson.net/components/WordTiles/WordTiles.tsx` — ordered letter tile rendering and scaffold visibility.
- `james-game.tdobson.net/components/WordTiles/WordTiles.module.css` — tile states, focus treatment, and reduced-motion behavior.
- `james-game.tdobson.net/components/GameControls/GameControls.tsx` — difficulty selector and new-word action.
- `james-game.tdobson.net/components/GameControls/GameControls.module.css` — controls layout.
- `james-game.tdobson.net/components/TypingGame/TypingGame.test.tsx` — user-facing keyboard and control behavior tests.
- `james-game.tdobson.net/components/WordTiles/WordTiles.test.tsx` — scaffold rendering tests.
- `james-game.tdobson.net/README.md` — purpose, setup, usage, testing, and extension notes.

## Phase 1: Bootstrap the target app

### Task 1: Copy and adapt the Next/Mantine foundation — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`

**Files:** Create or modify all foundation files listed in the file map through `theme.ts`; remove the template demo components from the target rather than carrying dead UI into the prototype.

**Contract:** Input is the clean `next-app-template` at `/home/tdobson/dev/next-app-template`. Output is an installable target project with the same tested toolchain, no Mantine welcome screen, and a route that can later render `TypingGame`. Do not modify the source template.

- [ ] **Step 1: Copy the template foundation.**

  Copy the template's tracked application/tooling files into the target, excluding `.git`, `node_modules`, `.next`, `.yarn/cache`, demo `components/Welcome`, and demo `components/ColorSchemeToggle`. Keep the target's committed design specification and add no generated build output.

- [ ] **Step 2: Replace the route and layout metadata.**

  `app/layout.tsx` must expose:

  ```tsx
  export const metadata = {
    title: 'Letter Trail',
    description: 'A gentle typing game for learning to spell familiar words.',
  };
  ```

  Keep `MantineProvider`, `ColorSchemeScript`, `mantineHtmlProps`, favicon, and viewport behavior from the template. `app/page.tsx` should temporarily render a typed heading, not the removed demo components:

  ```tsx
  import { Container, Title } from '@mantine/core';

  export default function HomePage() {
    return (
      <Container size="md" py="xl">
        <Title order={1}>Letter Trail</Title>
      </Container>
    );
  }
  ```

- [ ] **Step 3: Add initial global style and theme files.**

  Keep the template's CSS import in `app/layout.tsx`, then import `./globals.css` after Mantine styles. Set a warm, accessible base surface in `app/globals.css` with `box-sizing`, no default body margin, a minimum viewport height, and a light cream background. Put named colors and default font choices in `theme.ts` using `createTheme`; do not create a second styling system.

- [ ] **Step 4: Install and run the foundation checks.**

  Run:

  ```bash
  cd /home/tdobson/dev/james-game.tdobson.net
  npm install
  npm run typecheck
  npm run lint
  npm run format:test
  npm run jest -- --runInBand
  ```

  Expected result: each command exits successfully; Jest reports zero tests because the demo tests were intentionally removed.

- [ ] **Step 5: Commit the foundation.**

  ```bash
  git add app components theme.ts package.json package-lock.json tsconfig.json next.config.mjs postcss.config.cjs oxfmt.config.mjs oxlint.config.mjs .stylelintrc.json jest.config.cjs jest.setup.cjs .nvmrc .yarnrc.yml mantine-styles.d.ts README.md public
  git commit -m "chore: bootstrap letter trail app"
  ```

### Task R1: Review the foundation — `review-agent`

**Scope:** Task 1 foundation diff against the target's committed design spec and the source template. Review read-only; do not modify files.

- [ ] **Step 1: Adversarially review.** Check that the target does not depend on source-template relative imports, does not retain dead demo UI, has valid Next/Mantine provider setup, uses strict TypeScript, and has no generated artifacts or secrets.
- [ ] **Step 2: Triage.** Any correctness or build issue blocks Phase 2. Report exact file and line, reproduction command, and smallest fix.

## Phase 2: Model the learning loop with tests first

### Task 2: Add typed domain data and pure progression logic — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`

**Files:** Create `types/learning-word.types.ts`, `constants/learning-words.ts`, `constants/difficulty-levels.ts`, `utils/progression.ts`, and `utils/progression.test.ts`; modify no React components.

**Contract:** Export a small, explicit API that the game component can use without knowing implementation details. All object definitions live in `.types.ts`; finite states use unions; no `any`.

- [ ] **Step 1: Write the failing unit tests first.** Create `utils/progression.test.ts` with AAA tests for this API:

  ```ts
  import { describe, expect, it } from '@jest/globals';
  import { getProgressionResult } from './progression';

  describe('getProgressionResult', () => {
    it('advances when the pressed letter is the expected letter', () => {
      expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'j' })).toEqual({
        kind: 'advanced',
        nextIndex: 1,
        completed: false,
      });
    });

    it('does not advance for a wrong letter', () => {
      expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'x' })).toEqual({
        kind: 'incorrect',
        nextIndex: 0,
        completed: false,
      });
    });

    it('ignores non-letter keys', () => {
      expect(getProgressionResult({ word: 'JAMES', nextIndex: 0, key: 'ArrowLeft' })).toEqual({
        kind: 'ignored',
        nextIndex: 0,
        completed: false,
      });
    });

    it('reports completion on the final matching letter', () => {
      expect(getProgressionResult({ word: 'JAMES', nextIndex: 4, key: 's' })).toEqual({
        kind: 'advanced',
        nextIndex: 5,
        completed: true,
      });
    });

    it('does not advance after completion', () => {
      expect(getProgressionResult({ word: 'JAMES', nextIndex: 5, key: 's' })).toEqual({
        kind: 'ignored',
        nextIndex: 5,
        completed: true,
      });
    });
  });
  ```

- [ ] **Step 2: Run the focused test and verify RED.**

  ```bash
  npm run jest -- utils/progression.test.ts --runInBand
  ```

  Expected result: FAIL because `./progression` and the exported domain types do not exist yet.

- [ ] **Step 3: Define the domain types.** `types/learning-word.types.ts` must export:

  ```ts
  export type DifficultyLevel = 'full-outline' | 'outline' | 'faint' | 'reveal';
  export type ProgressionKind = 'advanced' | 'incorrect' | 'ignored';

  export interface LearningWord {
    id: string;
    word: string;
    promptLabel: string;
    accentColor: string;
    promptImage?: string;
    audioSrc?: string;
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
  ```

- [ ] **Step 4: Implement the pure progression utility.** Export `getProgressionResult(input: ProgressionInput): ProgressionResult`. Normalize the word and key with `toUpperCase()`. Return `ignored` if the index is at or beyond the word length or the normalized key is not exactly one ASCII letter. Return `advanced` with `nextIndex + 1`; `completed` is true only when the new index equals the normalized word length. Return `incorrect` for a valid but non-matching letter. Use early returns and keep the function under 30 lines.

- [ ] **Step 5: Add fixtures and scaffold definitions.** `constants/learning-words.ts` exports `LEARNING_WORDS: LearningWord[]` with stable IDs, uppercase words, labels, and distinct warm accent colors. Use local emoji/shape prompt identifiers rather than broken external URLs; `PromptCard` will render them as decorative prompt art. `constants/difficulty-levels.ts` exports `DIFFICULTY_LEVELS` as records keyed by `DifficultyLevel`, with labels, descriptions, and `REVEAL_DELAY_MS = 5000`.

- [ ] **Step 6: Run the focused test and all static checks.**

  ```bash
  npm run jest -- utils/progression.test.ts --runInBand
  npm run typecheck
  npm run lint
  npm run format:test
  ```

  Expected result: all commands pass and the progression tests document the complete utility contract.

- [ ] **Step 7: Commit.**

  ```bash
  git add types constants utils
  git commit -m "feat: add typed word progression model"
  ```

### Task R2: Review the domain model — `review-agent`

**Scope:** `types/`, `constants/`, and `utils/` from Task 2.

- [ ] **Step 1: Adversarially review.** Check normalization, boundary indexes, empty strings, non-letter keys, completion behavior, explicit types, stable fixture data, and consistency between difficulty unions and definitions.
- [ ] **Step 2: Triage.** Fix all correctness or type-safety findings before UI work; keep stylistic findings non-blocking unless they violate the convention document.

## Phase 3: Build the game surface

### Task 3: Build prompt, tiles, and controls — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`

**Files:** Create `components/PromptCard/PromptCard.tsx`, `components/PromptCard/PromptCard.module.css`, `components/WordTiles/WordTiles.tsx`, `components/WordTiles/WordTiles.module.css`, `components/GameControls/GameControls.tsx`, `components/GameControls/GameControls.module.css`, and their tests where listed in the file map.

**Contract:** These components are presentational and receive typed props. They must not own the round index or attach global keyboard listeners. Use Mantine primitives and CSS Modules. The tiles must expose accessible progress text without making the child read small text.

- [ ] **Step 1: Write component tests first.** `components/WordTiles/WordTiles.test.tsx` must render `JAMES` at `nextIndex: 1` and assert `J` is marked completed, `A` is marked active, and later letters are unfinished. Add one test per scaffold level asserting that unfinished tiles have the semantic state labels `outline`, `faint`, or `hidden`; tests should query roles/labels rather than CSS implementation details.

- [ ] **Step 2: Run the focused test and verify RED.**

  ```bash
  npm run jest -- components/WordTiles/WordTiles.test.tsx --runInBand
  ```

  Expected result: FAIL because `WordTiles` does not exist.

- [ ] **Step 3: Implement `PromptCard`.** Props are `{ word: LearningWord }`. Render a labelled `Paper`/`Card`, a large decorative prompt art block using the fixture's prompt identifier or a stable fallback, and `word.promptLabel`. Decorative art gets `aria-hidden="true"`; the label is visible and associated with the prompt region. Keep the component focused on prompt presentation.

- [ ] **Step 4: Implement `WordTiles`.** Props are `{ word: string; nextIndex: number; difficulty: DifficultyLevel; revealCount?: number }`. Render one tile per uppercase character. Give each tile `data-testid="letter-tile-${index}"`, an accessible label such as `Letter J, completed`, and a `data-state` of `completed`, `active`, `outline`, `faint`, or `hidden`. At `full-outline`, unfinished letters use `outline`; at `outline`, use the same visible state with reduced emphasis; at `faint`, use `faint`; at `reveal`, letters before `revealCount` use `faint`, and later letters use `hidden`. The active expected tile remains visible as an outline when revealed. Completed tiles always show solid text.

- [ ] **Step 5: Implement `GameControls`.** Props are `{ difficulty: DifficultyLevel; onDifficultyChange: (difficulty: DifficultyLevel) => void; onNewWord: () => void }`. Render a labelled Mantine `SegmentedControl` or equivalent with all four difficulty values plus a clearly labelled `New word` button. Keep controls large enough for an adult helper and keyboard accessible.

- [ ] **Step 6: Run focused tests and static checks.**

  ```bash
  npm run jest -- components/WordTiles/WordTiles.test.tsx --runInBand
  npm run typecheck
  npm run lint
  npm run format:test
  ```

  Expected result: PASS.

- [ ] **Step 7: Commit.**

  ```bash
  git add components/PromptCard components/WordTiles components/GameControls
  git commit -m "feat: add prompt word tiles and game controls"
  ```

### Task R3: Review the presentational surface — `review-agent`

**Scope:** Task 3 components and tests.

- [ ] **Step 1: Adversarially review.** Check accessible names and roles, visible state distinction without color alone, no broken image assumptions, correct handling of empty/fallback prompt art, controlled difficulty input, and absence of hidden game state in presentational components.
- [ ] **Step 2: Triage.** Correct any finding that would make a child or keyboard-only adult unable to understand or operate the interface.

### Task 4: Integrate round state and keyboard interaction — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`

**Files:** Create `components/TypingGame/TypingGame.tsx`, `components/TypingGame/TypingGame.module.css`, `components/TypingGame/TypingGame.test.tsx`; modify `app/page.tsx` and `app/globals.css` only as needed.

**Contract:** `TypingGame` is the only client state owner. It receives no required props, selects the first fixture initially, advances cyclically through `LEARNING_WORDS`, and exposes the complete keyboard loop from a real `window` key event to rendered progress.

- [ ] **Step 1: Write failing interaction tests.** Cover these user behaviors with React Testing Library and `userEvent`/`fireEvent`:

  ```tsx
  it('fills the next letter when the matching physical key is pressed', async () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'j' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'completed');
    expect(screen.getByRole('status')).toHaveTextContent(/1 of 5/i);
  });

  it('leaves progress unchanged for an incorrect key', () => {
    render(<TypingGame />);
    fireEvent.keyDown(window, { key: 'x' });
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('status')).toHaveTextContent(/try the highlighted letter/i);
  });

  it('starts the next word after the final letter', () => {
    render(<TypingGame />);
    for (const key of 'JAMES') fireEvent.keyDown(window, { key });
    expect(screen.getByRole('heading', { name: /grandma/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/word complete/i);
  });

  it('resets and moves to the next word when New word is selected', async () => {
    const user = userEvent.setup();
    render(<TypingGame />);
    await user.click(screen.getByRole('button', { name: /new word/i }));
    expect(screen.getByRole('heading', { name: /grandma/i })).toBeInTheDocument();
    expect(screen.getByTestId('letter-tile-0')).toHaveAttribute('data-state', 'active');
  });
  ```

  Include a test that selecting `reveal` starts with later letters hidden and uses fake timers to make the next letter visible after `REVEAL_DELAY_MS`. Ensure each test resets timers and DOM state.

- [ ] **Step 2: Run the focused tests and verify RED.**

  ```bash
  npm run jest -- components/TypingGame/TypingGame.test.tsx --runInBand
  ```

  Expected result: FAIL because `TypingGame` and its route integration do not exist.

- [ ] **Step 3: Implement state and keyboard lifecycle.** Mark `TypingGame.tsx` with `'use client'`. Use `useState` for `wordIndex`, `nextIndex`, `difficulty`, `feedback`, and `revealCount`; use `useEffect` to attach a `keydown` listener and clean it up on unmount. Call `getProgressionResult` for every event. On `incorrect`, set a short feedback token and clear it with a timeout; on `advanced`, update the index; on completion, set a completion message and schedule the next fixture after a short celebration. Ignore events after completion until the scheduled transition. Avoid stale closures by including all used state and callbacks in effect dependencies or by using stable callbacks.

- [ ] **Step 4: Implement reveal timing.** At round start in `reveal` mode, reveal the first unfinished letter after `REVEAL_DELAY_MS`. After a correct advance, reset the timer so the following letter reveals after the same delay. Clear every reveal timeout when word, difficulty, or component lifecycle changes. For non-reveal difficulties, set `revealCount` to the complete word length.

- [ ] **Step 5: Compose the layout.** Render an accessible main region with a title, progress status, `PromptCard`, `WordTiles`, a short keyboard instruction, and `GameControls`. Give the main word area the feedback class on wrong input and a completion class during celebration. Render `TypingGame` from `app/page.tsx`.

- [ ] **Step 6: Run focused tests, then the full local gate.**

  ```bash
  npm run jest -- components/TypingGame/TypingGame.test.tsx --runInBand
  npm run test
  npm run build
  ```

  Expected result: focused interaction tests, all template checks, and the production build pass.

- [ ] **Step 7: Commit.**

  ```bash
  git add app components/TypingGame app/globals.css
  git commit -m "feat: build keyboard typing game loop"
  ```

### Task R4: Review the integrated game — `review-agent`

**Scope:** Task 4 route and `TypingGame` implementation.

- [ ] **Step 1: Adversarially review.** Check keyboard listener cleanup, stale timer/listener bugs, completion transition timing, difficulty changes mid-round, reset semantics, fake-timer safety, uppercase normalization, non-letter keys, and accessible status updates. Try to reproduce a stuck listener, double-advance, skipped letter, or timer updating an old word.
- [ ] **Step 2: Triage.** Fix all correctness and accessibility findings before manual verification.

## Phase 4: Documentation and verification

### Task 5: Document usage and run the final local gate — `build-agent` (worktree)

**Codebase:** `james-game.tdobson.net`

**Files:** Modify `README.md`; add or update tests only if the final verification exposes a genuine behavior gap. Do not add unrelated features.

- [ ] **Step 1: Write the README.** Include the project's purpose, prerequisites, install command, dev command, keyboard usage, scaffold level descriptions, test command, and explicit prototype limitations. Include one short usage example:

  ```text
  Start the dev server, open the local URL, and press J, A, M, E, S in order. The completed letters fill in place, and the next word begins after the celebration.
  ```

  Document that word fixtures are in `constants/learning-words.ts` and prompt art is local fixture data.

- [ ] **Step 2: Run every applicable local check.**

  ```bash
  npm run test
  npm run build
  git diff --check
  git status --short
  ```

  Expected result: test, format, lint, typecheck, production build, and whitespace checks pass; only intended source, documentation, and lockfile changes remain.

- [ ] **Step 3: Commit documentation and any verified test fixes.**

  ```bash
  git add README.md components app constants types utils
  git commit -m "docs: explain letter trail prototype"
  ```

### Task R5: Final adversarial review — `review-agent`

**Scope:** All implementation commits after the design specification.

- [ ] **Step 1: Review against the design.** Confirm every included requirement has an implementation and test, and every excluded feature remains absent. Check for dead controls, placeholder copy, broken prompt assets, unsafe external requests, and accidental template branding.
- [ ] **Step 2: Triage.** Resolve CRITICAL/HIGH/MEDIUM findings. Record LOW findings in the final report instead of expanding scope.

### Task Q1: Local QA walkthrough — `qa-agent`

**Codebase:** `james-game.tdobson.net`; this prototype has no deploy script, API, database, or external dev environment, so only applicable QA layers run.

- [ ] **Layer 1: Unit and integration tests.** Run `npm run test`; expect all Jest, format, lint, and typecheck checks to pass.
- [ ] **Layer 2: API.** Not applicable: the application has no API or server-side data endpoint.
- [ ] **Layer 3: E2E.** Not applicable: the template has no Playwright dependency. Use the RTL interaction suite as the automated UI gate.
- [ ] **Layer 4: Manual browser walkthrough.** Run `npm run dev`, open the local URL in a browser, then verify: initial `JAMES` prompt; physical `J`, `A`, `M`, `E`, `S` progression; wrong-key wobble without lost progress; completion transition to `GRANDMA`; `New word` reset; all four difficulty controls; reveal mode after five seconds; keyboard focus and readable labels; no console errors at desktop and narrow viewport widths.
- [ ] **Layer 5: Database.** Not applicable: no database or persistence.
- [ ] **Final invariant.** Do not claim completion unless the local full test gate, production build, and manual keyboard walkthrough all pass. Do not deploy or merge to another branch without explicit user instruction.

## Execution order

Use workflow phases as follows:

1. Phase 1: Task 1, then R1.
2. Phase 2: Task 2, then R2.
3. Phase 3: Task 3, then R3; Task 4, then R4.
4. Phase 4: Task 5, then R5 and Q1.

Tasks in later phases depend on earlier commits. Presentational files in Task 3 can be built in parallel internally only if the worker keeps the shared type contract unchanged; the recommended execution remains sequential because the target repository is currently empty.
