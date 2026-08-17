# Typing-and-spelling learning game prototype

## Goal

Build a single-user web application for toddlers learning to type and spell. A child sees a familiar prompt, such as a photo or illustration of James, and completes the matching word by pressing the letters on a physical keyboard in order.

The first prototype focuses on the core learning loop: visual prompt, letter-by-letter keyboard input, immediate positive feedback, and progressively reduced visual scaffolding.

## Product scope

### Included

- Next.js App Router application based on `~/dev/next-app-template`.
- Mantine for the interface and theme.
- Local, typed word data with a small starter set: `JAMES`, `GRANDMA`, `MUM`, `DAD`, and `CAT`.
- A single game screen with a prompt card, word tiles, progress indicator, difficulty selector, and new-word control.
- Physical keyboard input while the game screen is active.
- Uppercase matching, independent of whether Caps Lock is enabled.
- Correct keys fill the next letter and advance the sequence.
- Incorrect keys do not advance and produce a gentle visual wobble.
- Completion feedback followed by a new round.
- Four visual scaffold levels:
  1. Full outline for every unfinished letter.
  2. Completed letters become solid; unfinished letters remain outlined.
  3. Unfinished outlines are faint.
  4. Unfinished letters are hidden initially, then fade into view one at a time after a five-second delay.
- Responsive desktop layout suitable for a child using a physical keyboard.
- Behavioral tests for progression, incorrect input, completion, reset, and scaffold visibility.

### Excluded from the prototype

- Authentication, accounts, cloud persistence, database, or server API.
- H5P packaging or LMS integration.
- Word-management or parent-admin screens.
- Touch keyboard input.
- Audio recording or playback. The word model may reserve an optional audio path for a later iteration.
- Production photography. Prompt cards use local illustration/photo-style placeholders so the prototype works without external assets.
- Lowercase mode, timed scoring, lives, penalties, or a leaderboard.

## User experience

The game opens directly on a round. A large prompt card shows the current word's image-style illustration and label. Beneath it, the target word appears as individual, generously spaced letter tiles.

The next expected letter is visually clear. A correct physical key fills that tile and moves the child to the next letter. A wrong key leaves progress unchanged and briefly wobbles the word area; it does not play a negative sound, remove progress, or show a failure state.

When the final letter is entered, the completed word receives a short celebration treatment. The next round starts from the beginning after the celebration, using the next starter word. A visible `New word` control lets an adult or child skip to the next round and resets progress.

A compact difficulty selector allows the prototype's four scaffold levels to be compared without a separate settings page. The selected level applies to the current round and remains selected when a new round starts.

## Difficulty behavior

The word is represented as ordered letter tiles. Completed tiles always remain solid. Unfinished tiles vary by scaffold level:

- **Full outline:** each unfinished tile shows its complete uppercase letter with a strong outline.
- **Outline:** each unfinished tile shows its complete uppercase letter with a lighter outline. This level preserves the original idea as a separate intermediate step while making the progression explicit.
- **Faint outline:** each unfinished tile remains visible with a low-contrast outline.
- **Reveal:** unfinished letters are hidden at round start. Letter `n` becomes visible as a faint outline after `n * 5` seconds, where `n` is one-based; when the child completes a tile, the next hidden letter's reveal timer begins. This keeps the final level usable while removing the need for a long, idle five-second wait for every letter.

The visual state must remain understandable without color alone. Completed letters use a filled treatment, and the active letter has a distinct border or glow. Motion is brief and optional for users who prefer reduced motion.

## Technical design

### Structure

Use the template's App Router structure, with application code organized around these boundaries:

- `app/` — route and global layout.
- `components/` — focused React components using PascalCase filenames.
- `constants/` — difficulty definitions and starter word data.
- `types/` — exported interfaces and finite unions in `.types.ts` files.
- `utils/` — pure keyboard and progression functions.
- `tests/` — tests that cover behavior, with source-adjacent tests where that fits the template.

Use kebab-case for non-component filenames and explicit TypeScript types. Avoid `any`. Keep functions small and use object parameters when a function needs more than three values.

### State

The game screen owns the current word, the index of the next expected letter, the selected scaffold level, the round completion state, the wrong-key feedback state, and reveal timing. The progression decision itself lives in a pure utility so it can be tested without rendering React.

Keyboard listeners are attached only by the active client game component and are removed on cleanup. Letter input is normalized to uppercase. Non-letter keys are ignored. The UI exposes an accessible status message for progress and completion.

No external state-management library is needed for this local state. No persistence is needed for the first prototype.

### Visual language

Use a warm, high-contrast, playful interface with large typography, rounded cards, generous spacing, and restrained animation. Keep the target word as the visual focus. Use Mantine primitives and a small theme override rather than bespoke layout infrastructure.

Use semantic labels and keyboard focus styles. Decorative prompt imagery must have appropriate alternate text. Avoid small text and avoid relying on red/green alone to communicate state.

## Error handling and edge cases

- Ignore non-letter keyboard events.
- Normalize keyboard input and word data to uppercase before comparison.
- Ignore additional keys after completion until the next round begins.
- Reset the letter index, completion state, wrong-key feedback, and reveal timers when the word changes or `New word` is selected.
- If a word has no prompt image, render a stable fallback illustration block rather than breaking the round.
- Respect `prefers-reduced-motion` for wobble and celebration transitions.

## Testing strategy

Follow red-green-refactor and the template's Jest plus React Testing Library setup.

Test pure progression behavior for:

- matching the expected key advances one position;
- a wrong letter leaves the position unchanged;
- non-letter input is ignored;
- the final matching key reports completion;
- input after completion does not advance.

Test the rendered game behavior for:

- the starter prompt and outlined word appearing initially;
- physical keyboard input filling the next letter;
- incorrect input leaving the word incomplete;
- completion feedback appearing after the final key;
- `New word` resetting the round and moving to the next word;
- each scaffold level producing its intended unfinished-letter presentation.

Run the template's format, lint, typecheck, and Jest checks before declaring the prototype complete.

## Future extension points

The word interface can later add `audioSrc`, `imageSrc`, categories, and per-word difficulty metadata without changing the progression API. A later parent mode can provide editing and progress reporting, but those features remain outside this prototype.
