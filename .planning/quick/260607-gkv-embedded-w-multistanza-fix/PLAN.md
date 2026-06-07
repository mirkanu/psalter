---
slug: embedded-w-multistanza-fix
created: 2026-06-07
status: in-progress
---

# Fix: Melisma-approved tunes show only stanza 1; syllable overflow on French/Psalm 91

## Problem
1. All 17 melisma-approved tunes (Crimond, Ballerma, Dennis, etc.) show only stanza 1
2. "French" on Psalm 91 shows 7 syllables on a 6-note phrase (truncating the last syllable)

## Root causes
1. NotationRenderer's embedded-w branch emits cycle 0 verbatim and `continue`s (skipping cycles 1+)
2. `wLineForSyllables` doesn't apply `forceMatchMeterShape`, so overflow goes uncorrected

## Fix scope (renderer-only, no DB changes)

### Task 1: wLineForSyllables — apply forceMatchMeterShape
- Import `forceMatchMeterShape` and `expectedSyllablesByLine`
- After syllabifying, get expected count from meter for this phrase index
- Apply forceMatchMeterShape to merge/split to exact count

### Task 2: embedded-w branch — render cycles 1+
- Import `extractEmbeddedWLines` (already in abc-embedded-lyrics.ts)
- After emitting cycle0Lines, extract _ positions from stored w: line
- For each cycle 1+, syllabify the cycle's text, force-fit to nonMelismaCount slots, rebuild w: line preserving _ positions
- Push additional `w: ...` lines (abcjs stacks multiple w: lines under same staff)

## Key files
- src/components/notation/NotationRenderer.tsx — wLineForSyllables (~760), embedded-w branch (~816)
- src/lib/abc-embedded-lyrics.ts — extractEmbeddedWLines
- src/lib/force-match-meter-shape.ts — forceMatchMeterShape
- src/lib/meter-syllable-shape.ts — expectedSyllablesByLine
