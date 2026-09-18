# Parent Voice Studio & Family Onboarding Specification

> **Date**: 2026-09-18  
> **Status**: Approved Design  
> **Target Audience**: Parents setting up personalised early-learning game spaces for their children.  
> **Runtime**: Next.js (App Router) on Cloudflare Workers (`@opennextjs/cloudflare`), Cloudflare D1 (SQLite), Cloudflare R2 (Audio assets).

---

## 1. Objective & Vision

Transform the setup experience so that when a parent creates a child's profile, they are seamlessly guided into a dedicated **Parent Voice Studio** (`/parent/profile/[profileId]/studio`). Over an engaging 15–20 minute session (or pausable in ~3–5 minute chapters), parents record their own voice for:
1. **Their child's name** (replacing prototype name `JAMES`) using the neutral child emoji `🧒`.
2. **Siblings** (brothers & sisters, replacing prototype name `SARAH`).
3. **Family VIPs** (Mum, Dad, Grandparents, Pets).
4. **Phonics & Letter Sounds** (26 letter sounds + letter names).
5. **Numbers & Counting** (1 to 10 + plurals).
6. **Starter Nouns & Praise Audio** ("Great job!", "Brilliant spelling!").

Unrecorded prompts seamlessly fall back to Tim Dobson defaults, and then to Web Speech synthesis.

---

## 2. User Journey & Navigation Flow

### Step 1: Child Creation (`/parent`)
- Parent clicks **"Add a child"** in the parent dashboard.
- Parent enters child's first name (e.g. `Leo`).
- Upon creation, the app redirects directly to:
  `GET /parent/profile/[profileId]/studio`

### Step 2: Pre-Flight Family Discovery
Before starting audio recording, a 30-second form collects family context:
- **Child's Name**: Pre-filled from step 1 (e.g. `Leo`), default emoji `🧒`.
- **Siblings**: Quick add: "Does Leo have any brothers or sisters?" (e.g. `Maya`, `Finn`).
- **Parents / Caregivers**: Quick selection (e.g. `Mum`, `Dad`, `Grandad`).
- **Family Pets**: Optional pet name (e.g. `Rover`).

### Step 3: Studio Session & Chapters
The studio displays a clean, focused layout with a progress tracker:

```
[ Chapter 1: Family & VIPs ] ──▶ [ Gate Unlocked ] ──▶ [ Chapter 2: Phonics ] ──▶ [ Chapter 3: Numbers ] ──▶ [ Chapter 4: Starter Words & Praise ]
   (~3 min mandatory)             (Tablet Ready)          (~6 min)                (~3 min)                (~6 min)
```

- **Chapter 1 (Mandatory Gate)**:
  - Child's own name (`LEO`).
  - Sibling names (`MAYA`).
  - Caregivers (`MUM`, `DAD`).
  - *Gate Completion*: Once Chapter 1 is complete, the child's play code is active and the parent can connect a tablet at any time, or continue to Chapter 2.
- **Chapters 2–4**:
  - Optional guided completion.
  - Can be paused and resumed at any time from `/parent/profile/[profileId]`.
  - Missing clips automatically use Tim Dobson static audio.

---

## 3. Ergonomics: Desktop Keyboard & Touch Mobile

The Studio supports dual interaction modes:

### Desktop / Laptop Ergonomics
- **Spacebar**: Tap to start recording, tap to stop (or hold-to-record).
- **P**: Preview playback of the recorded clip.
- **R**: Re-record current item.
- **Enter / Right Arrow**: Save and advance to next prompt.
- **Left Arrow**: Return to previous prompt.

### Mobile / Tablet Touch Ergonomics
- Large circular record button (minimum 72px height/width) with live audio wave / pulse indicator.
- Distinct "Listen" and "Keep & Next" touch targets.
- Responsive layout adapting gracefully down to 375px screens.

---

## 4. Technical Architecture & Data Storage

### 4.1 Curriculum Filtering (Replacing Hardcoded Names)
In `lib/profiles/public-payload.ts`:
- Filter out prototype words: `id !== 'james'` and `id !== 'sarah'`.
- Insert the child's dynamic name item at index 0:
  ```typescript
  {
    id: `custom_child_${profile.id}`,
    word: profile.child_name.toUpperCase(),
    promptLabel: profile.child_name,
    accentColor: '#4A90E2',
    promptImage: '🧒',
    audioUrl: childVoiceUrl,
    audioSource: childVoiceUrl ? 'family' : 'speech'
  }
  ```
- Insert siblings as custom family items.

### 4.2 Asset & Override Endpoints
- **Custom Family Words**: Audio blob uploaded to `POST /api/profiles/[profileId]/assets` with `kind="word-audio"`. The resulting `asset.id` is saved to `custom_words.audio_asset_id`.
- **System Sounds & Letters**: Audio blob uploaded to `POST /api/profiles/[profileId]/assets` with `kind="system-audio"`. Saved to `audio_overrides` with `clip_key`:
  - `phoneme_<slug>` (e.g. `phoneme_b`)
  - `letter_<slug>` (e.g. `letter_b`)
  - `number_<slug>` (e.g. `number_2`)
  - `plural_<id>` (e.g. `plural_cat`)
  - `praise_<id>` (e.g. `praise_great_job`)

### 4.3 D1 Database & R2 Storage
- Audio files stored in Cloudflare R2 bucket `foxwords-media` under `profiles/{profileId}/audio/{assetId}.webm`.
- Metadata stored in Cloudflare D1 tables: `media_assets`, `custom_words`, and `audio_overrides`.
- No database migration needed; existing schema supports all required keys.

---

## 5. Testing & Verification Plan

1. **Unit Tests**:
   - `lib/profiles/public-payload.test.ts`: Verify `JAMES` and `SARAH` are stripped from child play payload and replaced with the profile's child name and configured siblings.
   - `lib/play/studio-queue.test.ts`: Verify prompt queue generator generates correct chapter items, hints, and keys.
2. **Component & Integration Tests**:
   - Test pre-flight family form rendering and dynamic sibling field addition.
   - Test studio keyboard shortcuts (Space, P, R, Enter).
   - Test touch button interactions.
   - Test Chapter 1 gate unlocking tablet connect button.
3. **E2E & Smoke Verification**:
   - Create a test profile, upload Chapter 1 clips, verify playback in `/play/[code]` via API smoke tests.
