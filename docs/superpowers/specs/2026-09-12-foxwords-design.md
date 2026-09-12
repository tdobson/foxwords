# Foxwords Design Document

**Status:** Approved  
**Date:** 2026-09-12  
**Target Repository:** `tdobson/foxwords`  
**License:** Code under GNU Affero General Public License v3.0 (AGPL-3.0); Audio & Educational Content under Creative Commons Attribution-ShareAlike 3.0 (CC-BY-SA-3.0).

---

## 1. Overview & Vision

**Foxwords** is a personalised, joyful early-learning web application designed for young children (ages ~2–6). It combines multi-sensory phonics spelling, interactive teaching clock games, and personalized vocabulary practice.

While the game comes loaded with a default starter curriculum voiced by Tim (the original James curriculum), Foxwords lets any family make the app feel tailored to their child:
- Adding the child's name, favourite people (Mum, Dad, Grandad), siblings, pets, and favourite toys/objects.
- Uploading photos for personalized photo-quiz identification and spelling cards.
- Recording family voices directly in the browser so words speak with a parent's voice, falling back gracefully to default voice clips for unrecorded sounds.
- Children access their customized game on tablets with zero login hurdles via a unique play URL or a simple family code (e.g. `LION-9`).

---

## 2. Architecture & Tech Stack

Following proven deployment patterns from `~/dev/pokebook` and `~/dev/ebay-post-a-tron`:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FOXWORDS                                   │
│            Next.js 15 (App Router) + OpenNext Cloudflare Worker         │
├────────────────────────────────────┬────────────────────────────────────┤
│         Edge Infrastructure        │          Storage & Services        │
│  • Cloudflare Worker (App & API)   │  • Cloudflare D1 (SQLite Edge DB)  │
│  • Edge Assets (.open-next/assets) │  • Cloudflare R2 (Audio & Photos)  │
│    for static assets & Tim's voice │  • AWS SES (Magic Link Auth)       │
│  • Under free Worker bundle limits │  • Stripe-ready customer schema    │
└────────────────────────────────────┴────────────────────────────────────┘
```

### 2.1 Edge Delivery & Script Size Optimization
- Next.js is compiled via OpenNext for Cloudflare Workers.
- Static assets, default audio clips (~1.1 MB), and default images are placed in `.open-next/assets` and served directly through Cloudflare's static asset pipeline (`[assets] binding = "ASSETS"`).
- This keeps the Worker script size well under Cloudflare's free script limit.

---

## 3. Data Model (Cloudflare D1 SQLite)

```sql
-- Parents / Accounts
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'free',
  created_at INTEGER NOT NULL
);

-- Magic Link Tokens
CREATE TABLE magic_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Child Profiles
CREATE TABLE child_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  child_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,           -- e.g. "leo-x8f2" used in /play/[slug]
  play_code TEXT UNIQUE NOT NULL,      -- e.g. "LION-9" for quick tablet entry
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom Vocabulary Items
CREATE TABLE custom_words (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  word TEXT NOT NULL,                  -- e.g. "ROVER", "TRACTOR"
  category TEXT NOT NULL,              -- 'vip' | 'family' | 'pet' | 'toy' | 'custom'
  photo_r2_key TEXT,                   -- Cloudflare R2 key for photo
  audio_r2_key TEXT,                   -- Cloudflare R2 key for spoken word
  created_at INTEGER NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES child_profiles(id) ON DELETE CASCADE
);

-- Custom System Audio Overrides (Optional Voice Customization)
CREATE TABLE audio_overrides (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  clip_key TEXT NOT NULL,              -- e.g. 'letter_a', 'praise_great_job'
  audio_r2_key TEXT NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES child_profiles(id) ON DELETE CASCADE,
  UNIQUE(profile_id, clip_key)
);
```

---

## 4. Child Play Experience (`/play/[slug]` & `/join`)

1. **Zero-friction access:**
   - URL `/play/[slug]` directly loads the child's profile into memory and caches it in browser `localStorage`.
   - `/join` provides a large, toddler-friendly keypad to enter a 4-to-6 character code (e.g. `LION-9`).
2. **Curriculum Blending:**
   - The game runtime merges the profile's custom words and photos with the core phonics curriculum.
   - Child's name appears as a primary celebratory spelling word.
   - Custom family/pets appear in the photo quiz and spelling games.
3. **Audio Playback Hierarchy:**
   - Step 1: Check child profile's custom R2 audio override.
   - Step 2: Fall back to Tim's high-quality default audio asset.
   - Step 3: Optional client-side Web Speech API fallback if neither exists.

---

## 5. Parent Portal (`/parent`)

1. **Passwordless Authentication:**
   - Parent inputs email address.
   - System signs an HMAC magic-link token and delivers it via AWS SES (using a dedicated least-privilege IAM user `foxwords-mailer`).
   - Session stored as an `HttpOnly`, `SameSite=Lax`, secure cookie.
2. **Profile & Family Customizer:**
   - Add/edit child name.
   - Preset VIP slots: Child Name, Mum, Dad, Grandad, Pets.
   - Add Custom items: Word label, photo file upload, and in-browser audio recording.
3. **In-Browser Audio Recorder:**
   - Records using HTML5 `MediaRecorder` (`audio/webm` or `audio/mp4`).
   - Uploads directly to Cloudflare R2 via presigned PUT URL or authenticated Worker proxy.
4. **Kid Device Connect:**
   - Displays direct tablet link (`/play/[slug]`), a printable QR code, and a simple tablet code (`LION-9`).
5. **Stripe Readiness:**
   - User table includes `stripe_customer_id` and `subscription_status`.
   - Ready for checkout/portal webhooks without requiring database restructuring.

---

## 6. Open Source & Licensing

- **Code:** GNU Affero General Public License v3.0 (`AGPL-3.0`) in `LICENSE`.
- **Media Content:** Creative Commons Attribution-ShareAlike 3.0 Unported (`CC-BY-SA-3.0`) in `CONTENT-LICENSE` covering all phonics audio files, default photos, and curriculum datasets.
- Clean README with quickstart instructions, self-hosting guide using Cloudflare D1/R2, and local development steps.
