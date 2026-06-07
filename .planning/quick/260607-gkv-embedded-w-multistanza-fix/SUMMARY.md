---
slug: embedded-w-multistanza-fix
status: complete
completed: 2026-06-07
commit: b3eecc0
---

# Summary

Two renderer-only fixes to NotationRenderer.tsx. No DB changes.

## Fix 1 — Multi-stanza for melisma-approved tunes ✅
Stanzas 2+ now render for all 17 melisma-approved tunes (Crimond, Ballerma, Dennis, etc.). On the first stanza page (stanzas 1-3), all three stanzas correctly display their lyrics under the shared staff.

Algorithm: extract `_` positions from stored w: line → get cycle's psalm text via `wLinesForPhrase` → syllabify → force-fit syllable count to non-_ slot count → rebuild w: line preserving _ positions → push as additional `w:` line (abcjs stacks them natively).

**Known limitation (deferred to Phase 4.9.11):** On stanza page 2+ (stanzas 4-6 for a 6-stanza psalm), position 0 still shows stanza 1 text (verbatim from stored w: line). Only positions 1+ are regenerated. Root cause: `renderEmbeddedWPhrase` always marks cycle 0 as verbatim; when `cyclePage > 0` all cycles need regeneration.

## Fix 2 — Syllable overflow ✅
`wLineForSyllables` now applies `forceMatchMeterShape(expectedSyllablesByLine(tuneMeter))` after syllabifying. Fixes French on Psalm 91 showing 7 syllables on a 6-note phrase (phrases 1 and 3 of CM expect 6 syllables).

## Files changed
- `src/components/notation/NotationRenderer.tsx` — imports + wLineForSyllables + embedded-w branch
