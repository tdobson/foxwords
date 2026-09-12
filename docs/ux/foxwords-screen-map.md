# Foxwords UX Canonical Screen Map

**Status:** Canonical Reference
**Date:** 2026-09-12
**Target:** Web, Tablet (1024×1366), Mobile (390×844)

---

## 1. Root Launcher (`/`)

```text
┌──────────────────────────────────────────────┐
│ FOXWORDS                             [parent]│
│ Gentle word, sound and clock play            │
│                                              │
│ [ Play with a family code ]                  │
│ [ Set up Foxwords ]                          │
│ [ Try Tim's starter game ]                   │
│                                              │
│ No child login needed. A parent sets it up.  │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- `Play with a family code`: Navigates to `/join` (no API call).
- `Set up Foxwords`: Navigates to `/parent/login` (no API call).
- `Try Tim's starter game`: Navigates to `/words` using starter curriculum and Tim's audio assets (no API call).
- `[parent]`: Navigates to `/parent` (checked via session cookie).

### Displayed Data and Source
- Static branding, accessibility copy, and starter game pointers.

---

## 2. Parent Email Request (`/parent/login`)

```text
┌──────────────────────────────────────────────┐
│ Set up Foxwords                              │
│ Your email is the key to your family space.  │
│                                              │
│ Email [ parent@example.com                 ] │
│                                              │
│ [ Email me a magic link ]                    │
│                                              │
│ We do not use a password.                    │
│ [Error alert if invalid / rate limited]      │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- `Email` input: Controlled string. Validated for non-empty and RFC-compliant syntax.
- `Email me a magic link`: Calls `POST /api/auth/request` with `{ email }`.
  - HTTP 202: Navigates immediately to `/parent/check-email`.
  - HTTP 400: Displays local error banner ("Please enter a valid email address.").
  - HTTP 429: Displays rate-limit notice ("Too many sign-in attempts. Please try again in 15 minutes.").

### Displayed Data and Source
- Client state only; inputs sanitized before dispatch.

---

## 3. Check Email (`/parent/check-email`)

```text
┌──────────────────────────────────────────────┐
│ Check your email                             │
│ If that address can receive mail, a link is  │
│ on its way. It expires in 15 minutes.        │
│                                              │
│ [ Try another email ]   [ Back to Foxwords ] │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- `Try another email`: Navigates to `/parent/login`.
- `Back to Foxwords`: Navigates to `/`.

### Displayed Data and Source
- Static guidance text. Never echoes submitted email address or SES delivery status.

---

## 4. Magic Link Verification & Error State (`/auth/verify`)

```text
┌──────────────────────────────────────────────┐
│ That link has expired or is invalid          │
│ For safety, links work once and expire soon. │
│                                              │
│ [ Send me a new link ]   [ Back to Home ]    │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Page automatically consumes token via `GET /api/auth/verify?token=...`.
- On success: 302 redirect with HttpOnly cookie to `/parent`.
- On failure (expired/invalid/already used): Displays recovery card.
- `Send me a new link`: Navigates to `/parent/login`.

---

## 5. Parent Dashboard (`/parent`)

### 5.1 Empty State
```text
┌──────────────────────────────────────────────┐
│ Foxwords Parent Space             [Sign out] │
│                                              │
│ No child spaces yet                          │
│ Make one for your child, then add words,     │
│ pictures, and familiar voices.               │
│                                              │
│ [ + Add a child ]                            │
└──────────────────────────────────────────────┘
```

### 5.2 Populated State
```text
┌──────────────────────────────────────────────┐
│ Foxwords Parent Space             [Sign out] │
│                                              │
│ ┌──────────────────────────────────────────┐ │
│ │ Maya                             [Open]  │ │
│ │ 4 custom items · Code: LION-9            │ │
│ │ [Edit] [Connect Tablet] [Delete]         │ │
│ └──────────────────────────────────────────┘ │
│                                              │
│ [ + Add another child ]                      │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Initial Load: Calls `GET /api/profiles` with session cookie.
- `Sign out`: Calls `POST /api/auth/logout` and navigates to `/`.
- `+ Add a child`: Opens child creation modal or navigates to `/parent/profiles/new`. Calls `POST /api/profiles` with `{ childName }`.
- `[Open]`: Navigates to `/play/[playCode]`.
- `[Edit]`: Navigates to `/parent/profile/[profileId]`.
- `[Connect Tablet]`: Navigates to `/parent/profile/[profileId]/connect`.
- `[Delete]`: Confirms and calls `DELETE /api/profiles/[profileId]`.

---

## 6. Profile Editor (`/parent/profile/[profileId]`)

```text
┌──────────────────────────────────────────────┐
│ Maya's Foxwords                              │
│ [Back to Dashboard]             [Connect Tablet]
│                                              │
│ Child Name: [ Maya             ] [Save Name] │
│ Tablet Code: LION-9  [Rotate Code & Link]    │
│                                              │
│ --- Family & Favorite Words ---              │
│ [ + Add custom word or VIP ]                 │
│                                              │
│ • MUM (VIP) [Photo] [Voice: Family] [Delete] │
│ • DAD (VIP) [No Photo] [Voice: Tim] [Delete] │
│ • ROVER (Pet) [Photo] [Voice: Speech] [Del]  │
│                                              │
│ --- Voice Overrides (System Sounds) ---      │
│ Praise: "Great job!" [Record Voice] [Clear]  │
│ Letter A: [Tim Default] [Record Voice]       │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Load: Calls `GET /api/profiles/[profileId]`, `GET /api/profiles/[profileId]/items`, `GET /api/profiles/[profileId]/audio-overrides`.
- `[Save Name]`: Calls `PATCH /api/profiles/[profileId]` with `{ childName }`.
- `[Rotate Code & Link]`: Calls `POST /api/profiles/[profileId]/credentials/rotate`.
- `[ + Add custom word or VIP ]`: Opens creation dialog.
  - Submits to `POST /api/profiles/[profileId]/items`.
  - If photo selected: First uploads via `POST /api/profiles/[profileId]/assets` (`kind=photo`), then attaches `photoAssetId`.
  - If audio recorded: Uploads via `POST /api/profiles/[profileId]/assets` (`kind=word-audio`), attaches `audioAssetId`.
- `[Delete]` on word: Calls `DELETE /api/profiles/[profileId]/items/[itemId]`.
- `[Record Voice]` for system override: Uploads via `POST /api/profiles/[profileId]/assets` (`kind=system-audio`), then calls `PUT /api/profiles/[profileId]/audio-overrides` with `{ clipKey, assetId }`.
- `[Clear]` on override: Calls `DELETE /api/profiles/[profileId]/audio-overrides` with `{ clipKey }`.

---

## 7. Connect Tablet Screen (`/parent/profile/[profileId]/connect`)

```text
┌──────────────────────────────────────────────┐
│ Connect Maya's Tablet                        │
│ [Back to Profile]                            │
│                                              │
│ 1. Open game.tdobson.net on the tablet       │
│ 2. Tap "Play with a family code"             │
│ 3. Enter this code:                          │
│                                              │
│               [ L I O N - 9 ]                │
│                                              │
│ Or scan this QR Code / Open direct link:     │
│ [ QR CODE SVG ]                              │
│ https://game.tdobson.net/play/LION-9         │
│                                              │
│ [ Copy Link ]                                │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Static display of `playCode` and direct `/play/[playCode]` link.
- `[Copy Link]`: Copies full URL to clipboard.

---

## 8. Child Code Entry (`/join`)

```text
┌──────────────────────────────────────────────┐
│ Enter Family Code                    [Back]  │
│                                              │
│                [ L I O N - 9 ]               │
│                                              │
│      [ A ] [ B ] [ C ] [ D ] [ E ] [ F ]     │
│      [ G ] [ H ] [ J ] [ K ] [ L ] [ M ]     │
│      [ N ] [ P ] [ Q ] [ R ] [ S ] [ T ]     │
│      [ U ] [ V ] [ W ] [ X ] [ Y ] [ Z ]     │
│      [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ 6 ] [ 7 ]     │
│      [ 8 ] [ 9 ]        [ ⌫ Clear ]          │
│                                              │
│               [ LET'S PLAY! ]                │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Touch keypad without ambiguous characters (`0`, `O`, `1`, `I`).
- Key tap: Appends to code display.
- `[ ⌫ Clear ]`: Clears or deletes last character.
- `[ LET'S PLAY! ]`: Calls `POST /api/play/resolve` with `{ code }`.
  - On 200: Navigates to `/play/[playCode]`.
  - On 404: Displays child-friendly hint: "Oops, code not found! Ask a grown-up."
  - On 429: "Please wait a moment before trying again."

---

## 9. Child Play Space (`/play/[token]`)

```text
┌──────────────────────────────────────────────┐
│ Foxwords for Maya                  [Exit ✕]  │
│                                              │
│   [ 🔤 Words ]         [ ⏰ Clock ]          │
│   [ 🔢 Counting ]      [ ❓ Quiz ]           │
│   [ 🎵 Rhyme ]                               │
│                                              │
│ Personalised with 4 family words & voices    │
└──────────────────────────────────────────────┘
```

### Controls and Mutations
- Mount: Calls `GET /api/play/[token]`.
  - Receives `{ childName, words, audioOverrides }`.
  - Initializes `ProfileProvider` context.
- `[ 🔤 Words ]`: Navigates to `/words` with profile context active.
- `[ ⏰ Clock ]`: Navigates to `/clock`.
- `[ 🔢 Counting ]`: Navigates to `/counting`.
- `[ ❓ Quiz ]`: Navigates to `/quiz`.
- `[ 🎵 Rhyme ]`: Navigates to `/rhyme`.
- `[Exit ✕]`: Returns to `/`.
