# Expand Learning Words (10 Full Levels) and Grandad Normalization Implementation Plan

> **For agentic workers:** This plan is structured for workflow orchestration or subagent-driven development.
>
> **Execution:** Use `superpowers:subagent-driven-development` or inline execution with `superpowers:executing-plans`.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand `LEARNING_WORDS` with 28 new toddler-friendly tangible words with simple phonics (total 60 words across 10 clean 6-word levels), handle counting-mode irregular plurals (`boxes`, `buses`), and normalize all `GRANDDAD` references to `GRANDAD`.

**Architecture:** Update static learning word fixtures, phoneme validation tests, count-plural mappings, test assertions in `TypingGame.test.tsx`, documentation in `README.md`, and remove obsolete audio file `granddad.webm`.

**Tech Stack:** TypeScript, Next.js, Jest, React Testing Library.

**Codebases affected:** `james-game.tdobson.net` (single repository).

---

## File Structure & Responsibilities

- `constants/learning-words.ts`: Holds `LEARNING_WORDS` array with id, uppercase word, promptLabel, accentColor, promptImage, and ipa sequence. Needs 28 new words added in order.
- `constants/count-plurals.ts`: Contains `IRREGULAR_PLURALS` map for counting mode. Needs `box: 'Boxes'` and `bus: 'Buses'`.
- `constants/count-plurals.test.ts`: Jest tests verifying plural generation. Add test cases for `boxes` and `buses`.
- `constants/phonemes.test.ts`: Validates that every IPA phoneme used in `LEARNING_WORDS` exists in `PHONEMES`.
- `components/TypingGame/TypingGame.test.tsx`: Tests game progression and levels. Update `firstLevelWords` fixture from `'GRANDDAD'` to `'GRANDAD'`.
- `README.md`: Update documentation occurrences of `GRANDDAD` to `GRANDAD`.
- `public/audio/words/granddad.webm`: Delete legacy duplicate file.

---

## Task 1: Normalize GRANDAD across Codebase and Tests

**Files:**
- Modify: `components/TypingGame/TypingGame.test.tsx:6`
- Modify: `README.md:14,24`
- Delete: `public/audio/words/granddad.webm`

- [ ] **Step 1: Update TypingGame test fixture from GRANDDAD to GRANDAD**

In `components/TypingGame/TypingGame.test.tsx`:
```typescript
// Replace line 6:
const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDDAD', 'MUMMY', 'DADDY', 'SARAH'];
// With:
const firstLevelWords = ['JAMES', 'GRANDMA', 'GRANDAD', 'MUMMY', 'DADDY', 'SARAH'];
```

- [ ] **Step 2: Run TypingGame tests to verify they pass**

Run: `npm test components/TypingGame/TypingGame.test.tsx`
Expected: PASS

- [ ] **Step 3: Update README.md and remove legacy audio file**

In `README.md`, replace `GRANDDAD` with `GRANDAD`.
Remove `public/audio/words/granddad.webm`.

- [ ] **Step 4: Commit**

```bash
git rm public/audio/words/granddad.webm
git add components/TypingGame/TypingGame.test.tsx README.md
git commit -m "fix: normalize GRANDDAD to GRANDAD in tests and docs"
```

---

## Task 2: Add Counting Mode Irregular Plurals (box & bus) with TDD

**Files:**
- Test: `constants/count-plurals.test.ts`
- Modify: `constants/count-plurals.ts`

- [ ] **Step 1: Write failing tests for box and bus plurals**

In `constants/count-plurals.test.ts`, add test cases for `box` and `bus`:
```typescript
  it('returns Boxes for box count > 1', () => {
    const boxWord = { id: 'box', word: 'BOX', promptLabel: 'Box', accentColor: '#D35400', ipa: [] };
    expect(getObjectSpokenLabel({ word: boxWord, count: 2 })).toBe('Boxes');
  });

  it('returns Buses for bus count > 1', () => {
    const busWord = { id: 'bus', word: 'BUS', promptLabel: 'Bus', accentColor: '#E67E22', ipa: [] };
    expect(getObjectSpokenLabel({ word: busWord, count: 3 })).toBe('Buses');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest constants/count-plurals.test.ts`
Expected: FAIL (received "Boxs" and "Buss")

- [ ] **Step 3: Update `IRREGULAR_PLURALS` in `constants/count-plurals.ts`**

```typescript
export const IRREGULAR_PLURALS: Record<string, string> = {
  daddy: 'Daddies',
  mummy: 'Mummies',
  baby: 'Babies',
  granny: 'Grannies',
  fox: 'Foxes',
  splash: 'Splashes',
  orange: 'Oranges',
  games: 'Games',
  box: 'Boxes',
  bus: 'Buses',
};
```

- [ ] **Step 4: Run tests and verify PASS**

Run: `npx jest constants/count-plurals.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add constants/count-plurals.ts constants/count-plurals.test.ts
git commit -m "feat: add box and bus to irregular plurals for counting mode"
```

---

## Task 3: Add 28 New Learning Words to LEARNING_WORDS

**Files:**
- Modify: `constants/learning-words.ts`
- Test: `constants/phonemes.test.ts`

- [ ] **Step 1: Append the 28 words to `LEARNING_WORDS` in `constants/learning-words.ts`**

Add the 28 words maintaining level groupings (completing Level 6, and adding Levels 7, 8, 9, 10):
```typescript
  // Level 6 additions
  {
    id: 'bus',
    word: 'BUS',
    promptLabel: 'Bus',
    accentColor: '#E67E22',
    promptImage: '🚌',
    ipa: ['b', 'ʌ', 's'],
  },
  {
    id: 'van',
    word: 'VAN',
    promptLabel: 'Van',
    accentColor: '#34495E',
    promptImage: '🚐',
    ipa: ['v', 'æ', 'n'],
  },
  {
    id: 'boat',
    word: 'BOAT',
    promptLabel: 'Boat',
    accentColor: '#2980B9',
    promptImage: '⛵',
    ipa: ['b', 'əʊ', '', 't'],
  },
  {
    id: 'car',
    word: 'CAR',
    promptLabel: 'Car',
    accentColor: '#C0392B',
    promptImage: '🚗',
    ipa: ['k', 'ɑː', ''],
  },

  // Level 7: Animals & Creatures
  {
    id: 'rat',
    word: 'RAT',
    promptLabel: 'Rat',
    accentColor: '#7F8C8D',
    promptImage: '🐀',
    ipa: ['r', 'æ', 't'],
  },
  {
    id: 'pig',
    word: 'PIG',
    promptLabel: 'Pig',
    accentColor: '#F48FB1',
    promptImage: '🐷',
    ipa: ['p', 'ɪ', 'g'],
  },
  {
    id: 'duck',
    word: 'DUCK',
    promptLabel: 'Duck',
    accentColor: '#F39C12',
    promptImage: '🦆',
    ipa: ['d', 'ʌ', 'k', ''],
  },
  {
    id: 'hen',
    word: 'HEN',
    promptLabel: 'Hen',
    accentColor: '#D35400',
    promptImage: '🐔',
    ipa: ['h', 'e', 'n'],
  },
  {
    id: 'frog',
    word: 'FROG',
    promptLabel: 'Frog',
    accentColor: '#27AE60',
    promptImage: '🐸',
    ipa: ['f', 'r', 'ɒ', 'g'],
  },
  {
    id: 'bat',
    word: 'BAT',
    promptLabel: 'Bat',
    accentColor: '#2C3E50',
    promptImage: '🦇',
    ipa: ['b', 'æ', 't'],
  },

  // Level 8: Nature, Outdoors & Animals
  {
    id: 'bug',
    word: 'BUG',
    promptLabel: 'Bug',
    accentColor: '#8E44AD',
    promptImage: '🐛',
    ipa: ['b', 'ʌ', 'g'],
  },
  {
    id: 'sun',
    word: 'SUN',
    promptLabel: 'Sun',
    accentColor: '#F1C40F',
    promptImage: '☀️',
    ipa: ['s', 'ʌ', 'n'],
  },
  {
    id: 'moon',
    word: 'MOON',
    promptLabel: 'Moon',
    accentColor: '#5DADE2',
    promptImage: '🌙',
    ipa: ['m', 'uː', '', 'n'],
  },
  {
    id: 'star',
    word: 'STAR',
    promptLabel: 'Star',
    accentColor: '#F39C12',
    promptImage: '⭐',
    ipa: ['s', 't', 'ɑː', ''],
  },
  {
    id: 'log',
    word: 'LOG',
    promptLabel: 'Log',
    accentColor: '#795548',
    promptImage: '🪵',
    ipa: ['l', 'ɒ', 'g'],
  },
  {
    id: 'web',
    word: 'WEB',
    promptLabel: 'Web',
    accentColor: '#95A5A6',
    promptImage: '🕸️',
    ipa: ['w', 'e', 'b'],
  },

  // Level 9: Things at Home & Clothes
  {
    id: 'hat',
    word: 'HAT',
    promptLabel: 'Hat',
    accentColor: '#2980B9',
    promptImage: '🧢',
    ipa: ['h', 'æ', 't'],
  },
  {
    id: 'cup',
    word: 'CUP',
    promptLabel: 'Cup',
    accentColor: '#D35400',
    promptImage: '☕',
    ipa: ['k', 'ʌ', 'p'],
  },
  {
    id: 'mug',
    word: 'MUG',
    promptLabel: 'Mug',
    accentColor: '#16A085',
    promptImage: '🥛',
    ipa: ['m', 'ʌ', 'g'],
  },
  {
    id: 'pot',
    word: 'POT',
    promptLabel: 'Pot',
    accentColor: '#C0392B',
    promptImage: '🍲',
    ipa: ['p', 'ɒ', 't'],
  },
  {
    id: 'pan',
    word: 'PAN',
    promptLabel: 'Pan',
    accentColor: '#7F8C8D',
    promptImage: '🍳',
    ipa: ['p', 'æ', 'n'],
  },
  {
    id: 'sock',
    word: 'SOCK',
    promptLabel: 'Sock',
    accentColor: '#9B59B6',
    promptImage: '🧦',
    ipa: ['s', 'ɒ', 'k', ''],
  },

  // Level 10: Fun Objects, Rich Alphabet & Sounds
  {
    id: 'box',
    word: 'BOX',
    promptLabel: 'Box',
    accentColor: '#D35400',
    promptImage: '📦',
    ipa: ['b', 'ɒ', 'ks'],
  },
  {
    id: 'zip',
    word: 'ZIP',
    promptLabel: 'Zip',
    accentColor: '#34495E',
    promptImage: '🤐',
    ipa: ['z', 'ɪ', 'p'],
  },
  {
    id: 'jet',
    word: 'JET',
    promptLabel: 'Jet',
    accentColor: '#2980B9',
    promptImage: '✈️',
    ipa: ['dʒ', 'e', 't'],
  },
  {
    id: 'yak',
    word: 'YAK',
    promptLabel: 'Yak',
    accentColor: '#8D6E63',
    promptImage: '🐂',
    ipa: ['j', 'æ', 'k'],
  },
  {
    id: 'tub',
    word: 'TUB',
    promptLabel: 'Tub',
    accentColor: '#1ABC9C',
    promptImage: '🛁',
    ipa: ['t', 'ʌ', 'b'],
  },
  {
    id: 'nut',
    word: 'NUT',
    promptLabel: 'Nut',
    accentColor: '#A0522D',
    promptImage: '🥜',
    ipa: ['n', 'ʌ', 't'],
  },
```

- [ ] **Step 2: Run phoneme validation tests**

Run: `npx jest constants/phonemes.test.ts`
Expected: PASS (verifies every IPA phoneme used in `LEARNING_WORDS` has an entry in `PHONEMES`).

- [ ] **Step 3: Commit**

```bash
git add constants/learning-words.ts
git commit -m "feat: add 28 toddler-friendly tangible words expanding to 10 full levels"
```

---

## Task 4: Full Validation and Verification Gauntlet

**Files:**
- Run full test suite across the repo.

- [ ] **Step 1: Run format check, linter, typecheck, and Jest**

Run: `npm test`
Expected: All formatting, oxlint, stylelint, typecheck, and Jest tests pass without errors.

- [ ] **Step 2: Verify Record Page reflects 60 words and plurals**

Run: `npx jest`
Expected: All 9 test suites pass.

- [ ] **Step 3: Final branch verification and review**

Check `git status` and `git diff master` to ensure clean working tree.
