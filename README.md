# Foxwords

Foxwords is a personalised, joyful early-learning web application designed for young children (ages ~2–6). It combines multi-sensory phonics spelling, counting practice, interactive teaching clock games, and personalized vocabulary practice.

The app comes loaded with a default starter curriculum voiced by Tim Dobson, and allows families to tailor the experience to their child:
- Adding the child's name, family members (Mum, Dad, Grandad), siblings, pets, and favourite toys.
- Uploading photos for personalized photo-quiz identification and spelling cards.
- Recording family voices directly in the browser so words speak with a parent's voice, falling back gracefully to default voice clips.
- Children access their customized game on tablets with zero login hurdles via a unique play URL (`/play/[slug]`) or a simple family code (e.g. `LION-9`).

## Licensing

- **Code:** GNU Affero General Public License v3.0 (`AGPL-3.0`) — see [LICENSE](LICENSE).
- **Educational Content & Media:** Creative Commons Attribution-ShareAlike 3.0 Unported (`CC-BY-SA-3.0`) — see [CONTENT-LICENSE](CONTENT-LICENSE), [NOTICE](NOTICE), and [docs/content-manifest.md](docs/content-manifest.md).

## Prerequisites

- Node.js >= 20
- Yarn (v4)

## Installation

```bash
yarn install
```

## Running the Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

To run the Cloudflare Worker runtime emulation locally:

```bash
yarn dev:worker
```

## Running Quality Checks and Tests

All commands run through `scripts/low-priority.sh` to preserve system responsiveness:

```bash
# Run the full test and verification pipeline (formatting, Biome lint, typecheck, Jest)
yarn test

# Run Jest unit and behavioral tests
yarn jest

# Run Biome checks
yarn lint

# Run Playwright end-to-end tests
yarn e2e
```

## Self-Hosting with Cloudflare D1 & R2

Foxwords compiles via OpenNext to a Cloudflare Worker backed by:
- **Cloudflare D1**: SQLite edge database storing parents, child profiles, and custom vocabulary metadata.
- **Cloudflare R2**: Object storage for parent-uploaded photos and audio recordings.
- **AWS SES**: Passwordless magic link authentication for the parent portal.
- **Edge Assets**: Bundled default curriculum voice audio and photos served via Cloudflare Workers Assets.
