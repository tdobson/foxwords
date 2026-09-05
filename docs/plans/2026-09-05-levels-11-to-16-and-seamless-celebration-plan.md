# Implementation Plan: Levels 11–16 Expansion & Seamless Level Celebration Toast

> **For agentic workers:** Execute tasks using subagents or inline TDD.
> Steps use checkbox (`- [ ]`) syntax.

**Goal:** Implement Levels 11–16 (36 new words including 2-syllables, consonant digraphs, diphthongs, and regular/irregular plurals with multi-item visual prompts) and replace the blocking modal level screen with a lightweight, non-interrupting 1.0s CSS fireworks toast.

---

## Task 1: Add promptRepeat to LearningWord & Update PromptCard Component

**Files:**
- Modify: `types/learning-word.types.ts`
- Modify: `components/PromptCard/PromptCard.tsx`
- Modify: `components/PromptCard/PromptCard.module.css`
- Test: `components/PromptCard/PromptCard.test.tsx`

- [ ] **Step 1: Update `types/learning-word.types.ts` with `promptRepeat?: number`**
- [ ] **Step 2: Update `PromptCard.tsx` to render repeated emoji when `promptRepeat > 1`**
- [ ] **Step 3: Update `components/PromptCard/PromptCard.module.css` to format multi-item clusters cleanly**
- [ ] **Step 4: Add unit test in `components/PromptCard/PromptCard.test.tsx` verifying multi-item rendering**
- [ ] **Step 5: Run tests and commit**

---

## Task 2: Replace Level Complete Modal with Non-Interrupting 1.0s CSS Fireworks Toast

**Files:**
- Modify: `components/TypingGame/TypingGame.tsx`
- Modify: `components/TypingGame/TypingGame.module.css`
- Modify: `components/TypingGame/TypingGame.test.tsx`

- [ ] **Step 1: In `TypingGame.tsx`, remove `LEVEL_COMPLETE_MS` and blocking modal backdrop**
- [ ] **Step 2: Add floating non-blocking level toast with CSS fireworks animation (1.0s, pointer-events: none)**
- [ ] **Step 3: In `TypingGame.module.css`, define firework particle keyframes and toast animation**
- [ ] **Step 4: Update `TypingGame.test.tsx` to verify word transitions immediately without waiting for 3.2s modal**
- [ ] **Step 5: Run tests and commit**

---

## Task 3: Add Irregular Plurals for Levels 11–16 to count-plurals

**Files:**
- Modify: `constants/count-plurals.ts`
- Test: `constants/count-plurals.test.ts`

- [ ] **Step 1: Add test cases for `teddy` -> `Teddies`, `puppy` -> `Puppies`, `fish` -> `Fish`, `sheep` -> `Sheep`, `mouse` / `mice`, etc.**
- [ ] **Step 2: Add mappings to `IRREGULAR_PLURALS` in `constants/count-plurals.ts`**
- [ ] **Step 3: Verify tests pass and commit**

---

## Task 4: Add 36 New Learning Words (Levels 11–16) to LEARNING_WORDS

**Files:**
- Modify: `constants/learning-words.ts`
- Test: `constants/phonemes.test.ts`

- [ ] **Step 1: Append Levels 11 through 16 to `LEARNING_WORDS` with exact IPA, emoji, and promptRepeat values**
- [ ] **Step 2: Run `npx jest constants/phonemes.test.ts` to ensure IPA mappings are covered**
- [ ] **Step 3: Commit**

---

## Task 5: Full Validation Gauntlet

- [ ] **Step 1: Run `npm test` (format check, lint, typecheck, Jest suites)**
- [ ] **Step 2: Verify git status and clean working tree**
