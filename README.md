# Foxwords

Foxwords is a personalised, joyful early-learning web application designed for young children (ages ~2–6). It combines multi-sensory phonics spelling, counting practice, interactive teaching clock games, and personalized vocabulary practice.

Children hear the people they love: parents record their own voices for names, letter sounds, numbers and praise in a short guided studio, and anything not recorded falls back to bundled default clips.

- Grown-ups sign in with an email link (no password), add their child's name, brothers and sisters, and who else is in the family.
- The Voice Studio walks through the recordings one prompt at a time. Everything can be skipped and finished later.
- Children never need an account. A tablet opens the child's game with a six-letter family code, a play link or a QR code.
- Works with a keyboard, the pop-up keyboard on iPads, iPhones and Android tablets, and a big on-screen keypad on other touch screens.

## Try it

The test site is https://foxwords-dev.tdobson.net

1. Tap **Set up for my child** and sign in with the link we email you.
2. Type your child's first name, add the family, and record a few prompts (or skip them).
3. Tap **Play now on this device**, or **Connect a tablet** and scan the QR code.

Bugs and rough edges are very welcome as [GitHub issues](https://github.com/tdobson/foxwords/issues). Saying which device and browser you used helps a lot.

## Licensing

- **Code:** GNU Affero General Public License v3.0 (`AGPL-3.0`): see [LICENSE](LICENSE).
- **Educational Content & Media:** Creative Commons Attribution-ShareAlike 3.0 Unported (`CC-BY-SA-3.0`): see [CONTENT-LICENSE](CONTENT-LICENSE), [NOTICE](NOTICE), and [docs/content-manifest.md](docs/content-manifest.md).

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
