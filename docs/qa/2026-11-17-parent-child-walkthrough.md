# Foxwords dev walkthrough: what exists vs what should (2026-11-17)

Walked https://foxwords-dev.tdobson.net in Firefox as a brand-new parent (td+foxwordsdev@tdobson.net),
created a child "Juniper" (play code 86DJS6), went through the studio, the child play link and the games.

North star: a parent who has never heard of Foxwords signs up, sets up their child and has the child
playing in their own family's voices within a few minutes, on a laptop, phone or tablet, without help.
Every step is smooth, obvious, tested, and free of leftovers from the single-family prototype.

## Blocking defects (P0)

1. **Games ignore the child's profile.** `/play/86DJS6` greets "Hi Juniper!" but Words opens on "James".
   `app/play/[token]/page.tsx` keeps only `custom_*` items from the server payload, then
   `mergeProfileWithCurriculum` re-adds the full starter list (James, Sarah). The server already
   returns the finished list; the client must use it as-is.
2. **Family recordings are never played.** The studio saves `phoneme_*`, `letter_*`, `number_*`,
   `plural_*`, `praise_*` overrides, but `audioOverrides` is unused in every game
   (`components/TypingGame/TypingGame.tsx:74` destructures and drops it).
3. **Children cannot play on phones or tablets.** Games only listen to `window` keydown, so iPad and
   Android pop-up keyboards never appear. Clock input has the same problem.
4. **Browser speech synthesis is used** (`utils/clock-audio.ts`): the robotic "one o'clock" voice. Remove
   completely; never use Web Speech.
5. **Studio dead-ends.** After prompt 98 there is no Finish, no play code, no "start playing";
   progress shows "100% complete" with nothing recorded; a failed upload is shown as recorded; re-recording
   a family word creates a duplicate word.

## Onboarding and polish (P1)

6. Sign-up: if SES suppresses or bounces an address the parent still sees "check your email" with no
   way to resend. Add resend (with cooldown), show the address used, "check spam", and "use a different
   email".
7. Studio pre-flight: sibling added via keypad was lost; prose shouts the name ("Does JUNIPER have...");
   only Mum/Dad/Grandad, no Grandma, pets or "someone else"; family members are not saved as words until
   recorded, so they never appear in the game if the parent skips recording.
8. Studio prompts: plural prompts show "CAT" instead of "cats"; letter-sound prompts give no example
   ("as in apple") and no way to hear the sound first; counting goes to 20 but the studio stops at 10.
9. Leftovers from the one-family prototype: "Try Tim's starter game", "Tim's voice plays automatically",
   "Tim Dobson's friendly voice", "TIM DEFAULT"; `/record` is the old local recorder posting to an
   endpoint that now returns 410.
10. Parent forms show a custom on-screen keypad everywhere. Rule (Tim): only show it on touch devices
    that are not Android, iPhone or iPad. Android and iOS pop up their own keyboard; desktops have one.
11. Profile page lists only a "Great job!" override; no setup checklist, no recording progress, no clear
    "play now on this device" or "connect a tablet" step. Connect page should show a big code, a link,
    a QR code and "open on this device".
12. Accessibility: several controls are unnamed `div`/`span` trees; add roles, labels and `data-testid`
    so screen readers, Playwright and agents can find everything.

## Audio (P2, least important per Tim)

13. Missing default clips: letter names 0/26, numbers 0/20, plurals 0, clock 0, praise 0, words 32/~110.
    Generate with OpenRouter `openai/gpt-audio`, voice `ballad`, British RP prompt (the voice Tim uses for
    the Migrating Dragons demo videos), each clip checked by a Groq Whisper round-trip. Keep Tim's
    recorded phonemes: pure letter sounds do not synthesise well.
14. Names typed by parents (child, siblings, pets, custom words) need a voice before anyone records
    them: the Worker voices them on demand with the same model and caches the clip in R2.

Audio order everywhere: family recording, then bundled default, then generated name clip, then silence
with the word shown. Never Web Speech.
