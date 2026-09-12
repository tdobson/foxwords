# Foxwords API & Data Provenance Map

This document defines the strict data provenance for every screen in Foxwords.

| Screen | Route / View | Trigger / Event | API Endpoint & Method | Request Body / Query | Returned Data | Destination Component State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Launcher** | `/` | Page Load | None | None | None | Renders static launcher options |
| **Parent Login** | `/parent/login` | Click "Email me magic link" | `POST /api/auth/request` | `{ "email": "parent@domain.com" }` | `{ "accepted": true, "message": "..." }` | Navigates to `/parent/check-email` |
| **Verify Auth** | `/auth/verify` | Page Load / Query Param | `GET /api/auth/verify?token=XYZ` | Query `token` | Sets `__Host-foxwords_session` cookie; 302 to `/parent` | Browser cookie jar |
| **Parent Dashboard**| `/parent` | Page Mount | `GET /api/profiles` | None (Auth Cookie) | `{ "profiles": [ { "id", "childName", "playCode", "playUrl", "createdAt", "updatedAt" } ] }` | Dashboard profile cards list |
| **Create Child** | `/parent` or modal | Click "Create Child" | `POST /api/profiles` | `{ "childName": "Maya" }` | `{ "profile": { "id", "childName", "playCode", ... } }` | Appends new card to dashboard |
| **Profile Editor** | `/parent/profile/[id]` | Page Mount | `GET /api/profiles/[id]` | None (Auth Cookie) | `{ "profile": { "id", "childName", "playCode", "words": [...] } }` | Profile details & word list |
| **Profile Editor** | `/parent/profile/[id]` | Page Mount | `GET /api/profiles/[id]/audio-overrides` | None (Auth Cookie) | `{ "overrides": [ { "clip_key", "asset_id" } ] }` | Audio overrides table |
| **Update Name** | `/parent/profile/[id]` | Click "Save Name" | `PATCH /api/profiles/[id]` | `{ "childName": "New Name" }` | `{ "profile": { ... } }` | Updates profile heading |
| **Rotate Code** | `/parent/profile/[id]` | Click "Rotate Code" | `POST /api/profiles/[id]/credentials/rotate` | None (Auth Cookie) | `{ "playCode", "playUrl" }` | Updates display code & QR code |
| **Upload Photo/Audio**| `/parent/profile/[id]` | File Pick or Audio Record | `POST /api/profiles/[id]/assets` | Multipart `file`, `kind` | `{ "asset": { "id", "kind", "contentType", "byteSize", "url" } }` | Holds asset ID for item creation |
| **Add Custom Word** | `/parent/profile/[id]` | Click "Add Word" | `POST /api/profiles/[id]/items` | `{ "word", "category", "promptLabel", "photoAssetId", "audioAssetId" }` | `{ "item": { "id", "word", ... } }` | Appends item to word list |
| **Delete Custom Word**| `/parent/profile/[id]` | Click "Delete" on word | `DELETE /api/profiles/[id]/items/[itemId]` | None (Auth Cookie) | `{ "ok": true }` | Removes item from UI list |
| **Set Voice Override**| `/parent/profile/[id]` | Record System Audio | `PUT /api/profiles/[id]/audio-overrides` | `{ "clipKey": "praise_great_job", "assetId": "ast_123" }` | `{ "override": { ... } }` | Updates clip override status |
| **Clear Voice Override**| `/parent/profile/[id]`| Click "Clear" on clip | `DELETE /api/profiles/[id]/audio-overrides` | `{ "clipKey": "praise_great_job" }` | `{ "ok": true }` | Reverts clip to Tim's default |
| **Delete Profile** | `/parent/profile/[id]` | Click "Delete Profile" | `DELETE /api/profiles/[id]` | None (Auth Cookie) | `{ "ok": true }` | Navigates back to `/parent` |
| **Join Game** | `/join` | Tap "LET'S PLAY" | `POST /api/play/resolve` | `{ "code": "LION-9" }` | `{ "play": { "profileId", "childName", "playCode", "playUrl" } }` | Navigates to `/play/[playCode]` |
| **Play Game Hub** | `/play/[token]` | Page Mount | `GET /api/play/[token]` | None | `{ "childName": "Maya", "words": [...], "audioOverrides": {...} }` | Injects into `ProfileProvider` |
| **Play Asset Stream** | `/play/[token]` | Audio play or Photo render | `GET /api/play/[token]/assets/[assetId]` | None | Binary image or audio stream | Audio player / `<img>` element |
