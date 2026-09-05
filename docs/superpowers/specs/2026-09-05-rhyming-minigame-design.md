# Design Document: Rhyme Time Mini-Game

- **Date**: 2026-09-05
- **Status**: Approved
- **Topic**: Rhyme recognition mini-game with dual-input controls (Arrow keys or First-letter keypress)

---

## 1. Overview & Objective

"Rhyme Time" is a lightweight, toddler-accessible phonological awareness mini-game. The child is presented with a target word (image, spoken word audio, and label) and two option cards: one that rhymes with the target, and one distractor that does not.

The child identifies the rhyming word using either:
1. **Directional controls**: Left Arrow (`ArrowLeft`) for the left option, Right Arrow (`ArrowRight`) for the right option.
2. **Initial letter phonics keys**: Pressing the first letter of either option (e.g. if the choices are **H**AT and **D**OG, pressing `H` selects HAT, pressing `D` selects DOG).
3. **Mouse / Touch clicks**: Clicking or tapping directly on either option card.

---

## 2. Pedagogy & Audio Sequencing

### Game Flow per Prompt:
1. **Target Display & Prompt Audio**:
   - The target prompt appears in a prominent hero card at the top (e.g. 🐱 `CAT`).
   - Plays audio prompt: target word audio (`/audio/words/cat.webm`), or a gentle prompt cue.
2. **Two Choice Cards**:
   - Left option (e.g. 🧢 `HAT`) and Right option (e.g. 🐶 `DOG`).
   - Each card displays its emoji, word label with the first letter subtly highlighted, and a clear key badge indicator (e.g. `[← or H]` on the left card, `[→ or D]` on the right card).
3. **Audio on Selection**:
   - **Correct Selection**: Plays the selected word audio (`/audio/words/hat.webm`), followed by positive chime celebration / star sparkle, briefly highlighting the card in green. After 1.2s, smoothly advances to the next question.
   - **Incorrect Selection**: Gentle, encouraging wobble/shake on the chosen card with a soft boop sound. Does not penalize or reset progress; the child can try again immediately.
4. **Level Completion**:
   - When 6 questions in a level are completed, a celebratory firework toast (`✨ Rhyme Star! 🎆`) appears and automatically rolls into the next level without blocking input.

---

## 3. Curriculum & Question Sets (Levels 1 & 2)

All words leverage existing words in `LEARNING_WORDS` with recorded audio assets.

### Level 1: Core CVC Rhymes
Each round randomly places the rhyming word on the left or right to avoid position bias.

| # | Target Word | Rhyme (Target) | Distractor | Left / Right Keys | Initial Letter Keys |
|---|-------------|----------------|------------|-------------------|----------------------|
| 1 | `CAT` 🐱 (`-at`) | `HAT` 🧢 | `DOG` 🐶 | `←` / `→` | `H` / `D` |
| 2 | `FROG` 🐸 (`-og`) | `LOG` 🪵 | `BUS` 🚌 | `←` / `→` | `L` / `B` |
| 3 | `RAT` 🐀 (`-at`) | `BAT` 🦇 | `PIG` 🐷 | `←` / `→` | `B` / `P` |
| 4 | `BUG` 🐛 (`-ug`) | `MUG` 🥛 | `SUN` ☀️ | `←` / `→` | `M` / `S` |
| 5 | `PAN` 🍳 (`-an`) | `VAN` 🚐 | `POT` 🍲 | `←` / `→` | `V` / `P` |
| 6 | `FOX` 🦊 (`-ox`) | `BOX` 📦 | `HEN` 🐔 | `←` / `→` | `B` / `H` |

### Level 2: Mixed & Blends Rhymes

| # | Target Word | Rhyme (Target) | Distractor | Left / Right Keys | Initial Letter Keys |
|---|-------------|----------------|------------|-------------------|----------------------|
| 1 | `TRAIN` 🚂 (`-ain`) | `RAIN` 🌧️ | `TRACK` 🚆 | `←` / `→` | `R` / `T` |
| 2 | `CAR` 🚗 (`-ar`) | `STAR` ⭐ | `CUP` ☕ | `←` / `→` | `S` / `C` |
| 3 | `MOON` 🌙 (`-oon`) | `SPOON` 🥄 | `BOOT` 🥾 | `←` / `→` | `S` / `B` |
| 4 | `LOG` 🪵 (`-og`) | `FROG` 🐸 | `PIG` 🐷 | `←` / `→` | `F` / `P` |
| 5 | `BAT` 🦇 (`-at`) | `RAT` 🐀 | `FOX` 🦊 | `←` / `→` | `R` / `F` |
| 6 | `MUG` 🥛 (`-ug`) | `BUG` 🐛 | `NUT` 🥜 | `←` / `→` | `B` / `N` |

---

## 4. Input & Interaction Architecture

### Dual-Input Handler:
- Active keyboard listener in `RhymeGame`:
  - If event key matches `ArrowLeft` or `KeyA`: triggers selection of the left option.
  - If event key matches `ArrowRight` or `KeyD`: triggers selection of the right option.
  - If event key matches `leftOption.word[0].toLowerCase()`: triggers selection of the left option.
  - If event key matches `rightOption.word[0].toLowerCase()`: triggers selection of the right option.
  - Case-insensitive (`event.key.toUpperCase()`).
- Touch / Click targets:
  - Both option cards are `<button role="button">` elements with accessible labels (e.g. `aria-label="Choose Hat"`).

### Audio Playback:
- Leverages the shared `AudioService` / `HTMLAudioElement` cache pattern in `utils/audio.ts`.
- Plays target prompt audio on round load.
- Plays chosen option audio upon selection.

---

## 5. UI Layout & Visual Styling

- Responsive Mantine layout matching the aesthetic of `TypingGame` and `CountGame`.
- **Hero Card**:
  - Target word emoji (e.g. `4rem`), label `CAT`, and a speech bubble or prompt text: *"What rhymes with CAT?"*.
  - Replay button (🔊) allowing toddler to hear the target word again at any time.
- **Two Choice Cards**:
  - Arranged side-by-side (flex row on desktop/tablet, stack/grid on narrow mobile).
  - High-contrast visual cues:
    - Large emoji glyph (`4.5rem`).
    - Word label with first letter colored/emphasized.
    - Floating helper pill at the bottom: e.g. `[ ← or H ]` and `[ → or D ]`.
- **Celebration**:
  - Non-blocking fireworks toast banner matching the Levels 11–16 specification (`pointer-events: none`).
- **Navigation**:
  - Accessible via top navbar (`/rhyme`) alongside Home (`/`), Count (`/count`), Quiz (`/quiz`), and Record (`/record`).

---

## 6. Testing Strategy

1. **Unit & Component Tests (`components/RhymeGame/RhymeGame.test.tsx`)**:
   - Renders target word and two options.
   - Responds to `ArrowLeft` and `ArrowRight`.
   - Responds to initial letter keypresses (`H` or `D`).
   - Advances round upon correct selection.
   - Shows shake animation on incorrect selection without advancing.
   - Tests level transition after 6 correct answers.
2. **Curriculum Constants Test (`constants/rhyme-levels.test.ts`)**:
   - Validates that all target, rhyme, and distractor words exist in `LEARNING_WORDS` and have valid audio slugs.
   - Ensures left/right initial letters are distinct per question (no ambiguous key presses).
