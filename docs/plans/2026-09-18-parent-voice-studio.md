# Parent Voice Studio & Family Onboarding Implementation Plan

> **For agentic workers:** This plan is structured for workflow and subagent execution using **Haiku** builders and checkers. Tasks are labelled with agent types (`build-agent` / `review-agent` / `qa-agent`). Build tasks use `isolation: worktree`. Review tasks follow every 1–3 build tasks. QA gates every deploy.
>
> Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided, chaptered 20-minute Parent Voice Studio with touch/virtual keyboard support, pre-flight family VIP discovery (replacing prototype names `JAMES` and `SARAH` with the child's own name `🧒` and siblings), and an audio upload pipeline saving to Cloudflare R2 and D1.

**Architecture:** 
- A pure curriculum transformation in `lib/profiles/public-payload.ts` replaces hardcoded prototype entries (`james`, `sarah`) with the child's own name and siblings.
- A deterministic studio queue generator in `lib/play/studio-queue.ts` defines four progressive chapters (Family VIPs, Phonics/Letters, Numbers, Starter Words & Praise).
- A touch-enabled text entry component supporting onscreen virtual keyboards and hardware input for phones and tablets.
- An interactive, responsive recording studio at `/parent/profile/[profileId]/studio` with large touch controls, spacebar shortcuts, audio waveform feedback, and atomic asset upload.
- Unrecorded clips automatically fall back to Tim Dobson static clips and then Web Speech API.

**Tech Stack:** Next.js 16 (App Router), Mantine UI v7, Web Audio API / MediaRecorder, Cloudflare Workers (@opennextjs/cloudflare), Cloudflare D1 (SQLite), Cloudflare R2.

**Codebases affected:** `foxwords` (root)

---

## File Structure

- Create: `lib/play/studio-queue.ts` — Generates chaptered recording items with audio override keys and hints.
- Create: `lib/play/__tests__/studio-queue.test.ts` — Unit tests for chapter item generation and key mappings.
- Modify: `lib/profiles/public-payload.ts` — Filter out `james`/`sarah` and prepend child name `🧒` and siblings.
- Create: `lib/profiles/__tests__/public-payload.test.ts` — Unit tests for dynamic curriculum replacement.
- Create: `components/TouchInput/TouchInput.tsx` — Onscreen virtual touch keypad + text field for mobile/tablet & desktop.
- Create: `components/TouchInput/__tests__/TouchInput.test.tsx` — Unit tests for touch and keyboard input.
- Create: `app/parent/profile/[profileId]/studio/page.tsx` — Parent Voice Studio page (pre-flight family form + chaptered audio recorder).
- Create: `app/parent/profile/[profileId]/studio/__tests__/studio-page.test.tsx` — Component tests for pre-flight form, Chapter 1 gate, and recording controls.
- Modify: `app/parent/page.tsx` — Direct new child creation into `/studio` and add "Voice Studio" badges to cards.
- Modify: `app/parent/profile/[profileId]/page.tsx` — Add "Voice Studio" button with progress indicator to the profile page.

---

## Phase 1: Core Curriculum & Queue Engine

### Task 1: Dynamic Child & Sibling Curriculum Filter — `build-agent` (worktree)

**Files:**
- Test: `lib/profiles/__tests__/public-payload.test.ts`
- Modify: `lib/profiles/public-payload.ts`

**Contract:**
Input: Profile metadata with `childName`, custom words (including sibling items), and media assets.
Output: `PublicPlayPayload` where `james` and `sarah` are excluded, the child's own name is prepended with `🧒`, and siblings are injected.
Tests: Jest test suite asserting exclusion of prototype words and inclusion of dynamic child & siblings.

- [ ] **Step 1: Write the failing test**

```typescript
// lib/profiles/__tests__/public-payload.test.ts
import { buildPublicPlayPayload } from '../public-payload';

describe('buildPublicPlayPayload dynamic name substitution', () => {
  it('excludes hardcoded prototype words JAMES and SARAH', () => {
    const payload = buildPublicPlayPayload({
      childName: 'Leo',
      playToken: 'LEO123',
      customWords: [],
      assets: [],
    });

    const wordIds = payload.words.map((w) => w.id);
    expect(wordIds).not.toContain('james');
    expect(wordIds).not.toContain('sarah');
  });

  it('prepends the child name as the primary VIP word with generic child emoji', () => {
    const payload = buildPublicPlayPayload({
      childName: 'Leo',
      playToken: 'LEO123',
      customWords: [],
      assets: [],
    });

    expect(payload.words[0].word).toBe('LEO');
    expect(payload.words[0].promptLabel).toBe('Leo');
    expect(payload.words[0].promptImage).toBe('🧒');
  });

  it('includes sibling custom words ahead of starter words', () => {
    const payload = buildPublicPlayPayload({
      childName: 'Leo',
      playToken: 'LEO123',
      customWords: [
        {
          id: 'cw_maya',
          profile_id: 'prof_1',
          word: 'MAYA',
          category: 'family',
          prompt_label: 'Maya',
          prompt_emoji: '👧',
          photo_asset_id: null,
          audio_asset_id: null,
          sort_order: 1,
          created_at: 1000,
          updated_at: 1000,
        },
      ],
      assets: [],
    });

    expect(payload.words[0].word).toBe('LEO');
    expect(payload.words[1].word).toBe('MAYA');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./scripts/low-priority.sh yarn test lib/profiles/__tests__/public-payload.test.ts`  
Expected: FAIL (missing test file or `james` still present in curriculum).

- [ ] **Step 3: Update `lib/profiles/public-payload.ts`**

Update `buildPublicPlayPayload` to:
1. Filter out words with `id === 'james'` or `id === 'sarah'` from starter curriculum.
2. Check if the profile already has an item for the child's name; if not, synthesize a VIP word for the child's name with emoji `🧒`.
3. Prepend the child's word followed by custom family/sibling words.

- [ ] **Step 4: Run tests and verify PASS**

Run: `./scripts/low-priority.sh yarn test lib/profiles/__tests__/public-payload.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/profiles/public-payload.ts lib/profiles/__tests__/public-payload.test.ts
git commit -m "feat(curriculum): dynamically replace prototype names with child and sibling VIP words"
```

---

### Task 2: Studio Prompt Queue Generator — `build-agent` (worktree)

**Files:**
- Create: `lib/play/studio-queue.ts`
- Create: `lib/play/__tests__/studio-queue.test.ts`

**Contract:**
Input: Child name, list of siblings (strings), list of optional family members.
Output: An array of `StudioPromptItem` objects partitioned into 4 chapters:
- `chapter: 1` — Family VIPs (Child name, Siblings, Mum, Dad, Grandad, Pets)
- `chapter: 2` — Phonics & Letters (26 phonemes + 26 letter names)
- `chapter: 3` — Numbers (1 to 10) + Plurals
- `chapter: 4` — Starter Words & Praise clips
Each item contains: `key`, `chapter`, `targetWord`, `promptLabel`, `hint`, `kind` (`word` vs `system`), `clipKey`, `assetKind` (`word-audio` vs `system-audio`).

- [ ] **Step 1: Write the failing test**

```typescript
// lib/play/__tests__/studio-queue.test.ts
import { buildStudioQueue } from '../studio-queue';

describe('buildStudioQueue', () => {
  it('generates Chapter 1 with child name, siblings, and parents', () => {
    const queue = buildStudioQueue({
      childName: 'Leo',
      siblings: ['Maya', 'Finn'],
      caregivers: ['Mum', 'Dad'],
    });

    const ch1 = queue.filter((i) => i.chapter === 1);
    expect(ch1[0].targetWord).toBe('LEO');
    expect(ch1[0].kind).toBe('child');
    expect(ch1[1].targetWord).toBe('MAYA');
    expect(ch1[2].targetWord).toBe('FINN');
    expect(ch1.some((i) => i.targetWord === 'MUM')).toBe(true);
    expect(ch1.some((i) => i.targetWord === 'DAD')).toBe(true);
  });

  it('generates Chapter 2 with all 26 alphabet phonemes and letter names', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch2 = queue.filter((i) => i.chapter === 2);
    expect(ch2.filter((i) => i.kind === 'phoneme')).toHaveLength(26);
    expect(ch2.filter((i) => i.kind === 'letter-name')).toHaveLength(26);
  });

  it('generates Chapter 3 numbers 1-10', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch3 = queue.filter((i) => i.chapter === 3);
    expect(ch3.some((i) => i.clipKey === 'number_1')).toBe(true);
    expect(ch3.some((i) => i.clipKey === 'number_10')).toBe(true);
  });

  it('generates Chapter 4 praise phrases', () => {
    const queue = buildStudioQueue({ childName: 'Leo' });
    const ch4 = queue.filter((i) => i.chapter === 4);
    expect(ch4.some((i) => i.clipKey === 'praise_great_job')).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./scripts/low-priority.sh yarn test lib/play/__tests__/studio-queue.test.ts`  
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/play/studio-queue.ts`**

Export `buildStudioQueue`, `StudioPromptItem`, `StudioChapter` definitions using constants from `constants/phonemes.ts`, `constants/letter-names.ts`, `constants/count-numbers.ts`, and core words from `constants/learning-words.ts`.

- [ ] **Step 4: Run tests and verify PASS**

Run: `./scripts/low-priority.sh yarn test lib/play/__tests__/studio-queue.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/play/studio-queue.ts lib/play/__tests__/studio-queue.test.ts
git commit -m "feat(studio): implement chaptered studio prompt queue generator"
```

---

### Task R1: Review Phase 1 — `review-agent`

**Scope:** `lib/profiles/public-payload.ts`, `lib/play/studio-queue.ts` and their test suites.
- Verify spec compliance (child name `🧒` at index 0, prototype names removed, 4 chapters).
- Check edge cases: single-letter names, punctuation in names, empty sibling list.
- Run Biome lint and ensure 100% tests pass.

---

## Phase 2: Touch & Keyboard Input Ergonomics

### Task 3: Touch & Mobile-Friendly Text Entry Component — `build-agent` (worktree)

**Files:**
- Create: `components/TouchInput/TouchInput.tsx`
- Create: `components/TouchInput/TouchInput.module.css`
- Create: `components/TouchInput/__tests__/TouchInput.test.tsx`

**Contract:**
Input: `value`, `onChange`, `label`, `placeholder`, `uppercase?`, `helperText?`.
Features:
- Native text input for physical keyboard entry with autofill/virtual keyboard trigger.
- Toggleable on-screen touch keyboard designed for tablets/phones (large 44px+ touch targets).
- Clean uppercase formatting and backspace/clear actions.
Tests: Typing on keyboard updates value; tapping virtual keys appends characters; backspace removes last character.

- [ ] **Step 1: Write the failing test**

```typescript
// components/TouchInput/__tests__/TouchInput.test.tsx
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import { TouchInput } from '../TouchInput';

describe('TouchInput', () => {
  it('allows typing via native input field', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Child's Name" value="" onChange={handleChange} />
      </MantineProvider>
    );

    const input = screen.getByLabelText("Child's Name");
    fireEvent.change(input, { target: { value: 'LEO' } });
    expect(handleChange).toHaveBeenCalledWith('LEO');
  });

  it('appends characters when onscreen touch buttons are tapped', () => {
    const handleChange = jest.fn();
    render(
      <MantineProvider>
        <TouchInput label="Sibling" value="MA" onChange={handleChange} showKeypad />
      </MantineProvider>
    );

    const keyY = screen.getByRole('button', { name: 'Y' });
    fireEvent.click(keyY);
    expect(handleChange).toHaveBeenCalledWith('MAY');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./scripts/low-priority.sh yarn test components/TouchInput/__tests__/TouchInput.test.tsx`  
Expected: FAIL (component not found).

- [ ] **Step 3: Implement `TouchInput` component and styling**

Create Mantine-based component with responsive touch keys (A-Z layout) that can expand/collapse, providing optimal usability for both desktop physical typing and tablet touch typing.

- [ ] **Step 4: Run tests and verify PASS**

Run: `./scripts/low-priority.sh yarn test components/TouchInput/__tests__/TouchInput.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/TouchInput/
git commit -m "feat(ui): create TouchInput component with virtual keypad and mobile ergonomics"
```

---

## Phase 3: Parent Voice Studio Interface & Workflow

### Task 4: Parent Voice Studio Route (`/parent/profile/[profileId]/studio`) — `build-agent` (worktree)

**Files:**
- Create: `app/parent/profile/[profileId]/studio/page.tsx`
- Create: `app/parent/profile/[profileId]/studio/StudioPage.module.css`
- Create: `app/parent/profile/[profileId]/studio/__tests__/studio-page.test.tsx`

**Contract:**
Input: URL parameter `profileId`.
State:
1. **Discovery View (Pre-flight)**:
   - Input for child's name (emoji `🧒`).
   - Sibling list with dynamic "Add brother/sister" button.
   - Caregiver toggles (Mum, Dad, Grandad).
   - "Enter Studio" action button.
2. **Recording Studio View**:
   - Chapter progression bar (`Chapter 1 of 4: Family & VIPs`).
   - Active prompt card with target word, hint, and phonetic guide.
   - Dual control:
     - Keyboard: Spacebar (record/stop), P (preview), R (re-record), Enter/Right (next).
     - Touch: Prominent 72px circular touch button with mic icon and recording wave.
   - Audio upload pipeline posting to `/api/profiles/[profileId]/assets` and saving overrides or custom words.
   - **Chapter 1 Gate**: Once Chapter 1 is complete, displays celebratory badge ("Play Code Unlocked: XYZ123!"), enables "Connect Tablet" button, and allows exiting safely at any time.

- [ ] **Step 1: Write the failing test**

```typescript
// app/parent/profile/[profileId]/studio/__tests__/studio-page.test.tsx
import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ParentVoiceStudioPage from '../page';

jest.mock('next/navigation', () => ({
  useParams: () => ({ profileId: 'prof_test' }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('ParentVoiceStudioPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/profiles/prof_test')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              profile: {
                id: 'prof_test',
                childName: 'Leo',
                playCode: 'LEO482',
                words: [],
              },
            }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    }) as any;
  });

  it('renders pre-flight family form with pre-filled child name and sibling input', async () => {
    render(
      <MantineProvider>
        <ParentVoiceStudioPage />
      </MantineProvider>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Leo')).toBeInTheDocument();
    });
    expect(screen.getByText(/Does Leo have any brothers or sisters\?/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./scripts/low-priority.sh yarn test app/parent/profile/[profileId]/studio/__tests__/studio-page.test.tsx`  
Expected: FAIL (page does not exist).

- [ ] **Step 3: Implement `ParentVoiceStudioPage`**

Implement full studio component with pre-flight discovery, MediaRecorder capture, Spacebar / P / R / Enter keyboard listener, touch buttons, and Chapter 1 gate.

- [ ] **Step 4: Run tests and verify PASS**

Run: `./scripts/low-priority.sh yarn test app/parent/profile/[profileId]/studio/__tests__/studio-page.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/parent/profile/[profileId]/studio/
git commit -m "feat(studio): implement full Parent Voice Studio page with family pre-flight and recording queue"
```

---

### Task 5: Parent Dashboard & Profile Customiser Integration — `build-agent` (worktree)

**Files:**
- Modify: `app/parent/page.tsx`
- Modify: `app/parent/profile/[profileId]/page.tsx`
- Test: `app/parent/parent-dashboard.test.tsx`

**Contract:**
1. When a parent creates a child in `/parent`, redirect immediately to `/parent/profile/[newId]/studio`.
2. On each child card in `/parent`, add a **"Voice Studio"** button with a microphone icon.
3. In `/parent/profile/[profileId]`, add a top-level banner/button: **"Voice Studio"** showing progress (e.g. `Record family voice prompts`).

- [ ] **Step 1: Write test asserting redirect upon child creation**

Update `app/parent/parent-dashboard.test.tsx` to verify that after submitting a new child, `router.push('/parent/profile/prof_new/studio')` is called.

- [ ] **Step 2: Run test to verify failure**

Run: `./scripts/low-priority.sh yarn test app/parent/parent-dashboard.test.tsx`  
Expected: FAIL.

- [ ] **Step 3: Update `app/parent/page.tsx` and `app/parent/profile/[profileId]/page.tsx`**

Integrate the Voice Studio launch links and redirect behavior.

- [ ] **Step 4: Run tests and verify PASS**

Run: `./scripts/low-priority.sh yarn test app/parent/parent-dashboard.test.tsx`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/parent/page.tsx app/parent/profile/[profileId]/page.tsx app/parent/parent-dashboard.test.tsx
git commit -m "feat(parent): link child creation and dashboard navigation directly to Voice Studio"
```

---

### Task R2: Review Phase 2 & 3 — `review-agent`

**Scope:** Diffs from Task 3, 4, and 5.
- Verify security: authenticated endpoints checked, same-origin CSRF guards intact, upload payload bounds.
- Verify touch ergonomics: min touch target sizes >= 48px, accessible labels, virtual keyboard toggle.
- Verify Chapter 1 gate unlocks the play code and allows pausing.
- Check Biome linting and run all unit tests.

---

## Phase 4: Verification & Deployment

### Task 6: Build, Deploy & 5-Layer QA Gauntlet — `qa-agent`

**Pre-requisite:** `scripts/low-priority.sh yarn build` passes cleanly.

- [ ] **Layer 1: Unit & Component Test Suite**
  Run: `./scripts/low-priority.sh yarn test`  
  Expected: All test suites PASS (zero regressions).

- [ ] **Layer 2: Biome Lint & Format Check**
  Run: `./scripts/low-priority.sh yarn lint`  
  Expected: Zero errors.

- [ ] **Layer 3: Dev Deployment**
  Run: `./scripts/low-priority.sh yarn deploy:dev`  
  Expected: Cloudflare Worker successfully deployed with updated routes.

- [ ] **Layer 4: API Smoke Test Suite**
  Run: `./scripts/api-smoke.sh "https://foxwords-dev.tdobson.net" "https://foxwords-dev.tdobson.net"`  
  Expected: All public and authenticated gates PASS.

- [ ] **Layer 5: End-to-End Walkthrough**
  1. Open `https://foxwords-dev.tdobson.net/parent`.
  2. Create a test child profile.
  3. Verify automatic redirect to `/parent/profile/[id]/studio`.
  4. Fill in pre-flight form with child name and sibling.
  5. Test keyboard (Space/Enter) and touch buttons.
  6. Complete Chapter 1 and confirm tablet play code is unlocked.
  7. Open `/play/[code]` and confirm child's name and sibling appear at the start of the game with generic child emoji `🧒`.
