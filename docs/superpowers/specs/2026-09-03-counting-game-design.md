# Counting minigame

## Goal

Give James a counting round that sits next to words and quiz. He sees some number of a familiar object, hears the count spoken, and types the numeral. If he waits, the numeral fades into the answer box so he can see what the glyph looks like.

The first version reuses the existing word set as the objects. Easy rounds ask only for the digit. Later difficulties ask for two-digit numbers, then the number followed by the word.

## Product scope

### Included

- A `count` game mode, always available from the start (no unlock).
- A **Count** control next to Quiz on `GameControls`.
- Objects taken from `LEARNING_WORDS` (emoji or photo, repeated).
- Three count difficulties:
  - **Easy:** counts 1–9. Type the single digit.
  - **Medium:** counts 10–20. Type both digits, left to right. Objects shown as ten-and-ones: a ten-group (two rows of five) on the left, leftover ones in a row on the right. Count 10 is one ten-group; count 20 is two ten-groups.
  - **Hard:** counts 1–20. Type the digit(s), then the word (e.g. `2` then `DADDY`). Objects shown as a full even grid of equal copies, never ten-and-ones. Word tiles appear only after the number is complete.
- Spoken audio at round start: number name, then the singular or plural object name (“two”, then “daddies”).
- An empty number tile (or two tiles for 10–20). After **14 seconds**, if the number is still incomplete, the remaining digit(s) fade in as a faint glyph.
- Wrong keys wobble the play area and do not advance. No penalty sound.
- Same celebration, auto-advance, and **New word** behaviour as quiz.
- Recorder and `/api/audio` support for number names (1–20) and per-word plurals.
- Behavioral tests for progression, layout, the 14-second hint, mode switching, and audio sequencing.

### Excluded

- A separate app or route. Count is a mode of `TypingGame`, like quiz.
- Unlock gating.
- Touch/on-screen keypad.
- Scores, timers-as-challenge, lives, or leaderboards.
- New object artwork. Existing `promptImage` / `promptPhoto` only.
- Combined “two daddies” clips. Number clip + plural clip, played in order.
- Counts above 20.
- Changing how words mode or quiz mode work, except adding the Count control.

## Approaches considered

1. **Mode on `TypingGame` plus a `CountPrompt` component (chosen).** Quiz already works this way: `GameMode` grows from `'words' | 'quiz'` to `'words' | 'quiz' | 'count'`. Shared keyboard listener, celebration, and controls. Isolated prompt for the new layout.
2. **A standalone `CountingGame` page.** Cleaner isolation, but duplicates keyboard, feedback, and controls, and splits the kiosk into two homes.
3. **Fold counting into words mode.** Mixing letter spelling with object counts on one screen confuses the prompt.

## User experience

James (or an adult) taps **Count**. The words prompt and letter tiles go away. He sees a cluster of the current word’s pictures, an empty number box, and nothing that writes the answer in words.

The round speaks “two daddies” (number clip, then plural clip). He is expected to press `2`. A correct press fills the box, celebrates, replays the spoken phrase, and moves on. A wrong press shakes the cluster.

If he has not finished the number after 14 seconds, the digit fades into the empty box as a faint glyph — the same idea as letter-reveal, but slower, so he can match the shape on the keyboard.

**New word** starts a new count round (next word, a new count in the current band). Switching back to words or quiz leaves count difficulty remembered for next time.

While Count is active, the existing Faint/Reveal control is replaced by Easy / Medium / Hard. Words difficulty is restored when leaving Count.

```
Easy (count 2)

    👨     👨

         [  ]

    (after 14s the 2 fades into the box)
```

```
Medium (count 12) — ten-and-ones

    👨👨👨👨👨          👨👨
    👨👨👨👨👨

         [  ] [  ]
```

```
Hard (count 2) — even grid; word tiles appear after the digit

    👨     👨

         [  ]
```

The spoken phrase is audio only. The screen must not print “two” or “2” until the 14-second hint (or a correct key). Do not show a title such as “Two daddies”.

## Round data

Each round is one `LearningWord` plus an integer `count`.

- Cycle words in the same order as words mode (`LEARNING_WORDS`).
- Pick `count` uniformly in the difficulty band (easy 1–9, medium 10–20, hard 1–20).
- Do not repeat the same `count` on two consecutive rounds.

People and slightly awkward nouns stay in the set (two Daddies, two Milks). Tim asked to reuse the existing words, not a filtered countable subset.

### Labels for speech

A small helper returns the spoken object token:

- count 1 → singular `promptLabel` (“daddy”)
- count 2+ → plural (“daddies”)

Irregulars live in a map keyed by word id. Needed at least: daddy/daddies, mummy/mummies, baby/babies, granny/grannies, fox/foxes, splash/splashes, orange/oranges. `games` stays “games”. Everything else appends `s`.

The helper is display- and recorder-facing. The typed word in hard mode is still `LearningWord.word` (e.g. `DADDY`), not the plural spelling.

## Count difficulties

| Level  | Counts | What James types        | Object layout                         | Number hint      |
|--------|--------|-------------------------|---------------------------------------|------------------|
| Easy   | 1–9    | one digit               | `count` copies, even spacing          | 14s fade-in      |
| Medium | 10–20  | two digits, left to right | ten-group (two rows of five) on the left; leftover ones in a row on the right. 10 = one ten; 20 = two tens | 14s fade-in on any still-empty digit |
| Hard   | 1–20   | digit(s), then the word | even grid of `count` equal copies; never ten-and-ones | 14s fade-in on empty number tiles only. Word tiles are not on screen until the number is complete; they then use words-mode reveal (hidden until active) |

Medium uses ten-and-ones even for 10 and 20 (two tens for 20). Hard never uses ten-and-ones.

Switching Easy/Medium/Hard starts a fresh round at the new band.

## Input

Physical keyboard only, same listener as today.

- Easy/medium: only `0`–`9` count. `event.key` so the number row and the numpad both work. Letters are ignored (not a shake).
- Compare against the decimal string (`'2'`, `'10'`, `'20'`). First key of `12` must be `1`; a `2` at the start is incorrect and shakes.
- After the number is complete in easy/medium, ignore further keys until auto-advance.
- Hard: once the number is complete, letter keys use the existing `getProgressionResult` against `currentWord.word`. Digit keys are ignored during the word. The number tiles stay filled.
- Ignore key repeat, Ctrl/Meta/Alt, and input after the whole round is complete.
- Wrong expected key: shake, no advance.

Put number-string matching in a pure util (`utils/count-progression.ts`) rather than stretching `getProgressionResult` (that helper rejects non-letters by design).

## Number hint

- Timer starts when the round starts. Completing the number (or the whole hard round’s number stage) cancels it.
- At 14 seconds, any still-empty number tile moves from hidden to faint and shows its digit. The fade is a CSS opacity transition (~1s). `prefers-reduced-motion`: snap to faint, still at 14 seconds, no fade.
- Do not reveal digits James has already typed.
- Do not reveal word letters via this timer; hard-mode letters follow words-mode reveal.

## Audio

Play at round start, and again on a correct finish (same pattern as quiz replaying the word):

1. `/audio/numbers/{slug}.webm` for 1–20 (`one` … `twenty`, hyphenless slugs: `twenty` not `20`)
2. then `/audio/words/{id}.webm` if count is 1, else `/audio/plurals/{id}.webm`

If a clip is missing, `playAudio` already swallows the error; the round still works.

### Recorder and API

Extend recording kinds from `phoneme | letter-name | word` to also `number | plural`.

- Numbers: ids `one`–`twenty`, files `public/audio/numbers/{id}.webm`. Prompt: the number word.
- Plurals: one item per `LEARNING_WORDS` id, files `public/audio/plurals/{id}.webm`. Prompt: the plural token from the helper (“daddies”). Skip a dedicated plural item when singular and plural are the same (`games`) — reuse the word clip at play time.

`GET /api/audio` lists `numbers` and `plurals` next to the existing arrays. `POST` allowlists those ids. Static export is unchanged: files live under `public/`.

The recorder continues from the first missing item across all kinds, including the new ones.

## Technical design

### Structure

- `types/learning-word.types.ts` — `GameMode` includes `'count'`. Add `CountDifficulty = 'easy' | 'medium' | 'hard'`.
- `constants/count-difficulties.ts` — labels and count bands.
- `constants/count-plurals.ts` — irregular plural map + `getObjectSpokenLabel({ word, count })`.
- `constants/count-numbers.ts` — 1–20 slugs and spoken names for the recorder.
- `utils/count-progression.ts` — pure matcher for the digit string.
- `utils/audio.ts` — `getNumberAudioPath`, `getPluralAudioPath`.
- `components/CountPrompt/CountPrompt.tsx` — object cluster + number tiles. Accepts `word`, `count`, `layout: 'row' | 'tens' | 'grid'`, `numberNextIndex`, `hintRevealed`, `numberCompleted`.
- `components/WordTiles` — hard mode only, and only after the number is complete. Until then the screen shows objects and number tiles, not letter tiles.
- `components/TypingGame/TypingGame.tsx` — owns count state; branches render like quiz.
- `components/GameControls/GameControls.tsx` — Count button always enabled; when `mode === 'count'`, show Easy/Medium/Hard instead of Faint/Reveal.
- `app/record/RecordPage.tsx` and `app/api/audio/route.ts` — new kinds.

No new route. `app/page.tsx` still renders `TypingGame`.

### State in `TypingGame`

When `mode === 'count'`:

- `countDifficulty`
- `count` (the integer for this round)
- `numberNextIndex` (progress through the digit string)
- `hintRevealed` (boolean, set at 14s)
- existing `nextIndex` used for the hard-mode word once the number is done
- existing `isCompleted` / `feedback` / `wordIndex`

Leaving Count does not reset `wordIndex`. Entering Count picks a count for the current word.

### Visual language

Same warm, large, high-contrast style as quiz. Object copies use the existing photo size or emoji size, shrinking as `count` grows so twenty copies still fit the 720px game column. The ten-group in medium has a light grouped background so the ten is readable as one ten.

Number tiles reuse the WordTiles visual states: hidden (empty box), faint (hint), active (expecting this digit), completed (filled).

## Error handling and edge cases

- Count 20 in medium: two ten-groups, no leftovers.
- Count 10 in medium: one ten-group, no leftovers.
- Count 1 in easy/hard: one object, singular audio, one number tile.
- Hard with a two-digit count: two number tiles, then the word tiles.
- Switching mode mid-round drops in-progress letters/digits and starts the other mode cleanly (quiz already does this by changing the render tree).
- Missing photos fall back to `promptImage`, same as `PromptCard`.
- `GAMES` typed in hard mode is still `GAMES`.

## Testing strategy

Pure tests for count progression (advance, incorrect, ignore, two-digit order, completion) and for spoken labels (singular, regular plural, irregulars, games).

Rendered tests:

- Count is enabled with zero words completed.
- Easy round of 2: two copies, one empty tile; `2` completes; `3` shakes.
- After 14s, the digit appears in the faint state; typing it still completes.
- Completing before 14s never shows the hint.
- Medium 12: tens layout; `1` then `2` completes; `2` first shakes.
- Hard: after the digit, letter keys spell the word; a letter before the digit is ignored.
- Easy/Medium/Hard control is visible only in count mode.
- Round start attempts number audio then object audio.

## Future extension points

A later pass can add a countable-only subset, photo-specific counting art, combined phrase recordings, or counts above 20. None of that is in this spec.
