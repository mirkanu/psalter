---
slug: ps60-azmon-phrase-breaks
status: complete
completed: 2026-06-07
commit: aef849e
---

# Summary: Azmon/Denfield PHRASE_BREAK fix

## What was wrong
Azmon/Denfield's ABC in the DB had no `% PHRASE_BREAK` markers. The migration
script extracted positions as one phrase `[[]]` because the original ABC also
had no breaks. The melisma editor auto-injects breaks via
`injectPhraseBreaksAtCounts`, so Live Preview was fine. NotationRenderer uses
the raw DB ABC, so prod rendered 28 notes as one mega-staff with garbled lyrics.

## Fix applied
- Added PHRASE_BREAKs at cumulative note counts [8, 14, 22] (CM = 8+6+8+6)
- Updated `melisma_positions` from `[[]]` to `[[], [], [], []]`
- Script: `scripts/fix-azmon-phrase-breaks.ts`

## Verified
Playwright screenshot of psalter.gsdlabs.dev/psalms/60 shows 4 staff lines with
28 lyric elements correctly aligned across 4 stanzas.
