---
title: Staff Display Alignment Bugs — Explore Session Findings
date: 2026-05-28
context: Phase 04.9.8 pre-planning exploration
---

# Staff Display Word Alignment — Root Cause Analysis

## Symptoms (confirmed via Playwright screenshots)

- **Psalm 23 (Crimond, CM):** Rows 3 & 4 have 3 and 2 empty note positions at the right end respectively. Row 3 shows 11 note heads but only 8 syllables in the w: line.
- **Psalm 46 (Stroudwater):** Similar end-of-line cutoff pattern.
- **Psalm 100 (Old 100th, LM):** Milder but present.
- **Psalm 119 (Crediton, CM):** Severe — last row has only 3 words, then ~6 notes with no text at all.

## Pipeline Overview (how ABC is produced)

```
Solfège image (JPG)
  ↓ Claude Vision OCR
solfege_ocr_text (JSON with tonic solfa, including || double-bars)
  ↓ solfege-parser.ts  →  split(/\|+/) ← LOSES || line-break info
abc_satb (flat SATB ABC, all notes on one line per voice)
  ↓ extract-soprano-to-abc-notation.ts → extractMelodyVoice()
abc_notation (soprano only, still flat — no internal line breaks)
  ↓ annotate-phrase-breaks.ts → insertPhraseBreaks(abc, n=2 for CM)
abc_notation (with ONE % PHRASE_BREAK at ~midpoint of bar count)
```

## Root Cause 1 — splitMusicIntoSubLines uses bar-count heuristic

`NotationRenderer.tsx` calls `splitMusicIntoSubLines(phraseBody, targetSubdivisions)` to divide each phrase into sub-staves (one per CM metrical line). The function splits by counting `|` bar dividers and halving them.

**For Crimond phrase 1** (6 bars after PHRASE_BREAK):
```
per = ceil(6/2) = 3
sub-staff 0: bars 1-3 → 11 note heads  vs  CM line 3 = 8 syllables → 3 empty notes
sub-staff 1: bars 4-6 → 8 note heads   vs  CM line 4 = 6 syllables → 2 empty notes
```

The 8/6 natural break is at bar 2 (after 8 note heads), not bar 3.

## Root Cause 2 — Trailing z2 rest counted as a phantom bar (Crediton)

Crediton phrase 1 ends with `... | c'bc'6 | z2` (no trailing barline on `z2`). The `splitMusicIntoSubLines` accumulator collects `z2` as a 5th "measure":

```
realMeasures = 5  →  per = ceil(5/2) = 3  (should be 2)
sub-staff 0: bars 0-2 → 15 note heads  vs  CM line 3 = 8 syllables → 7 empty!
sub-staff 1: bars 3-4 → 3 note heads   vs  CM line 4 = 6 syllables → only 3 words shown
```

This is the most severe visual bug — the last row of Psalm 119 is nearly blank.

## Root Cause 3 — Archaic words miss NLP syllabification

Words like "leadeth", "maketh", "cometh" are counted as 1 syllable by `nlp-syllables` but the tune expects 2 note positions. This shifts all subsequent words left by 1, dropping the final syllable off the right edge. Fix: add to `PSALM_SYLLABLE_OVERRIDES` in `src/lib/lyrics.ts`.

## Key Architecture Finding — Line breaks NOT preserved in pipeline

The solfège image has **2 physical staff lines**: each line contains CM lines (8+6) notes.
The solfège OCR text marks these with `||` (double-bar).
BUT `solfege-parser.ts` uses `split(/\|+/)` — treats `||` identically to `|`.
**Result: the physical line boundary information is lost. The ABC is always flat (one continuous note sequence per phrase).**

The ONE existing `% PHRASE_BREAK` was placed by `annotate-phrase-breaks.ts` using an equal-barline-count heuristic. It correctly marks the boundary between the 2 physical image lines. But the INTERNAL 8/6 break within each image line is nowhere in the data.

## Proposed Fix: 4 PHRASE_BREAKs per CM tune (instead of 1)

**Current:** 1 PHRASE_BREAK → 2 phrases (each 8+6 syllables)  
→ `splitMusicIntoSubLines` tries to split each phrase in half by bar count → wrong

**Proposed:** 3 PHRASE_BREAKs → 4 phrases (each covering exactly 1 CM metrical line)  
→ `phrasesForMeter("CM") = 4`, `linesPerPhrase = 1`, no splitting needed → correct by construction

Placement of the 3 additional PHRASE_BREAKs requires **note-head counting** on the ABC:
- Phrase 0 → line 1 (8 syllables): count note heads left-to-right, split after reaching 8
- Phrase 1 → line 2 (6 syllables): rest of original phrase 0
- Phrase 2 → line 3 (8 syllables): from original phrase 1 up to 8 note heads
- Phrase 3 → line 4 (6 syllables): remainder

## Phase 04.9.8 Plan (to be written)

**Scope:** Staff display alignment fixes — complete, tested, future-proof  
**Insert before:** Phase 5 (Precentor Portal)  
**No new versifications will ever be added** (psalm text is frozen). Tunes may be added in future.

### Planned work (4 plans):
1. **Audit** — Query all tune ABCs, count phrases per tune, map current vs expected structure. Identify all affected meters (CM, LM, SM, DCM, others). Produce audit report.
2. **Migration script** — Write + run script that re-annotates all tune ABCs: for each CM tune, insert correct PHRASE_BREAKs using note-head counting to find the 8/6 boundary. Update `phrasesForMeter` to return 4 for CM (and equivalently for LM/SM). Fix the trailing `z2` rest bug in `splitMusicIntoSubLines`. Remove `splitMusicIntoSubLines` dependency for non-chromeless desktop path (or keep as no-op when targetSubdivisions=1).
3. **Archaic word overrides** — Audit all psalm text for archaic verb forms (leadeth, maketh, cometh, dwelleth, goeth, etc.), add batch overrides to `PSALM_SYLLABLE_OVERRIDES` in `src/lib/lyrics.ts`.
4. **E2E verification** — Playwright tests for all 150 psalms in staff view. Screenshot + programmatically verify no empty note positions at row ends. Gate phase completion on zero regressions.

### Key meter mappings to update:
| Meter | Current phrasesForMeter | Target |
|---|---|---|
| CM | 2 | 4 |
| LM | 2 | 4 |
| SM | 2 | 4 |
| DCM | 4 | 8 |
| DLM | 4 | 8 |
| DSM | 4 | 8 |
| 8.7.8.7 | 2 | 4 |
| 7.6.7.6 | 2 | 4 |

### ABC convention for future tune additions:
Every CM tune should have 3 `% PHRASE_BREAK` markers, one between each successive metrical line pair:
```
[line 1 notes - 8 syllables]
% PHRASE_BREAK
[line 2 notes - 6 syllables]
% PHRASE_BREAK
[line 3 notes - 8 syllables]
% PHRASE_BREAK
[line 4 notes - 6 syllables]
```
