# Design Document: Static Export, Cloudflare Deployment, and Offline Local Bundle

**Date:** 2026-08-28  
**Project:** Letter Trail (`james-game.tdobson.net`)

---

## 1. Overview & Goals

1. **Static Export**: Configure Next.js for static HTML/CSS/JS export (`output: 'export'`) outputting to the `out/` directory.
2. **Production Route Gating**: Ensure development-only routes (`/record` and `/api/audio`) do not interfere with static export or expose dev recording tools in production builds.
3. **Cloudflare Deployment**: Enable direct deployment of static assets to Cloudflare via Wrangler CLI (`wrangler pages deploy` or Cloudflare Workers Static Assets).
4. **Offline Local Bundle**: Provide an automated packaging script (`yarn bundle`) that creates a standalone `dist/letter-trail-offline.zip` containing all static assets and cross-platform launcher scripts (`start.sh`, `start.bat`) to run the game on `localhost` without an internet connection.

---

## 2. Architecture & Components

### 2.1 Next.js Configuration (`next.config.mjs`)
- Configure `output: 'export'` for builds.
- Configure `images: { unoptimized: true }` required for Next.js static HTML export.

### 2.2 Route Separation / Gating
- The main game is located at `/` (`app/page.tsx`) with pure client-side state.
- Route `/api/audio` relies on Node filesystem (`fs`) for local recording. In static export mode, Next.js requires static pages/routes.
- Exclude `/api/audio` and `/record` from static export or adapt them so static builds complete without errors.

### 2.3 Cloudflare Deployment Configuration
- Create `wrangler.jsonc` or `wrangler.toml` targeting static assets in `./out`.
- Project name: `james-game`.
- Provide `yarn deploy` script invoking `wrangler pages deploy out --project-name=james-game` (or Workers Static Assets).

### 2.4 Standalone Offline Bundle (`scripts/create-bundle.mjs`)
- Script reads the `out/` directory produced by `next build`.
- Generates:
  - `start.sh`: Shell script for macOS/Linux that detects available local HTTP server (Python 3 `http.server`, Node `npx serve`, or Python 2 `SimpleHTTPServer`), starts the server on `http://localhost:8000`, and opens the browser.
  - `start.bat`: Windows batch script that starts Python `http.server` or Node server and opens the browser.
  - `README.txt`: Simple instructions explaining how to double-click the launcher or run a local server.
- Archives the directory into `dist/letter-trail-offline.zip`.

---

## 3. Scripts & Verification

- `yarn build`: Runs static export to `out/`.
- `yarn deploy`: Builds and deploys `out/` to Cloudflare.
- `yarn bundle`: Builds static export and creates `dist/letter-trail-offline.zip`.
- Automated test: Verify static build generates `out/index.html` and `dist/letter-trail-offline.zip` contains expected files.
