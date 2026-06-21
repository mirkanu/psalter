---
quick_id: 260621-ind
status: completed
date: 2026-06-21
---

# Summary: Resolve All Not-Approved Tunes in Melisma Editor

## Outcome

5 tunes approved, 11 tunes marked not_approved with detailed root-cause comments.
3 code fixes shipped. 4 DB corrections applied.

---

## Code Changes (commit 1fc5e10)

### `src/lib/meter-syllable-shape.ts`
- Fixed run-together digit split to exclude groups containing `'0'`
- Before: `"10 10 10 10 10"` → `[1,0,1,0,1,0,1,0,1,0]` (wrong)
- After: `"10 10 10 10 10"` → `[10,10,10,10,10]` (correct)

### `src/app/dev/melisma-editor/page.tsx`
- Added `doubleLength: boolean` to `TuneOption` interface
- Added `doubleLength: r.doubleLength ?? false` to `out.push()` so the client receives it

### `src/app/dev/melisma-editor/MelismaEditorClient.tsx`
- Updated `effectiveAbc` useMemo to handle DCM tunes:
  - For `doubleLength=true` tunes without ` D` in meter: use doubled shape `[...expected, ...expected]`
  - For tunes with ` D` already in meter (e.g. Aurelia `76 76 D`): use shape as-is (no double-doubling)
  - Re-injects PHRASE_BREAKs even when some already exist, if count < expected-1 (covers DCM tunes with 3 explicit breaks)

---

## DB Changes

| Tune | Change |
|------|--------|
| Darwall (57) | Injected 5 PHRASE_BREAKs for shape `[6,6,6,6,8,8]`; set `double_length=false` (40 notes = 1 stanza) |
| Old 124th (38) | Set `double_length=false` (was wrong — 52 notes ≠ 100 for doubled `10×10`) |
| Clarkeville (136) | Set `double_length=false` (was wrong — 46 notes ≠ 80 for doubled `66 66 88`) |

---

## Decisions

### Approved (5)

| ID | Tune | Reason |
|----|------|--------|
| 57 | Darwall | PHRASE_BREAKs injected; `notes=40 = syllables=40` ✓ |
| 66 | Praetorius | Already correct; CM 28 notes = 28 syllables ✓ |
| 101 | Westminster | Already correct; CM 28 notes = 28 syllables ✓ |
| 26 | Aurelia | `76 76 D` auto-inject works with `isAlreadyDoubled` fix; 52 notes = 52 syllables ✓ |
| 157 | Winchester | CM 28 notes = 28 syllables; `^c'` in phrase 2 is musically correct ✓ |

### Not Approved (11)

| ID | Tune | Root cause |
|----|------|-----------|
| 136 | Clarkeville | 46 notes vs 24 syllables — melisma notes offset phrase boundaries |
| 38 | Old 124th | 52 notes vs 40 syllables; meter ambiguous; last phrase has 12 for 10-syllable line |
| 120 | Shepherd | Phrase 4: 11 notes (expected 7); 4 extra notes need moving to phrase 3 |
| 21 | Naomi | Wrong pitches in ABC — OCR picked up wrong voice (Gb, Db, E♮ in K:Eb) |
| 99 | Carlisle | Wrong pitches in phrases 3-4 |
| 28 | Orlington | 48 notes but DCM needs 56 — last phrase missing from stored ABC |
| 41 | Kingsfold | Stored ABC incomplete (~19 notes); OCR only has 1 CM stanza of DCM tune |
| 71 | Wallace | 12 notes total (stored); appears to be 3/4 time tune not CM |
| 96 | Farrant | Stored ABC has 17 notes (incomplete); no source image for re-OCR |
| 12 | Bays of Harris | No solfège JPEG or score image — cannot re-digitize |
| 3 | Woodworth | LM with minor OCR conversion error; needs note-by-note verification |

---

## What Worked

- `Aurelia` was the key success of the `isAlreadyDoubled` guard — it was at risk of being double-doubled to 16 phrases
- `Darwall` fix was clean: 40 notes distributes perfectly as `[6,6,6,6,8,8]`
- The `10 10 10 10 10` parsing fix unblocks Old 124th from returning `[1,0,1,0,...]`

## What Remains

The 11 not-approved tunes fall into 3 categories:
1. **Data gaps** (Kingsfold, Farrant, Wallace, Bays of Harris, Orlington): need sheet music or re-digitization
2. **Pitch errors** (Naomi, Carlisle): OCR captured wrong voice; need solFaToAbc reconstruction with corrected soprano
3. **Phrase boundary issues** (Clarkeville, Old 124th, Shepherd, Woodworth): phrase break placement needs manual editor work or melody-specific shape override
