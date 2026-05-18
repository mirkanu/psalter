# Parse Failures — Phase 04.9.6

Generated: 2026-05-18T10:03:50.789Z
Mode: LIVE
Total rows: 184
Parsed: 178
Quarantined: 6

## Quarantined psalm-versions

### Parse failure: psalm-version id=138 (Psalm 124 (Second Version, Recommended))

- Reason: round-trip mismatch

### Parse failure: psalm-version id=66 (Psalm 72)

- Reason: colophon line detected (F-5)
- Offending line index: 91

### Parse failure: psalm-version id=85 (Psalm 148 (Second Version, Recommended))

- Reason: line count 40 not a multiple of 6 (meter F-6)

### Parse failure: psalm-version id=101 (Psalm 143 (Second Version, Recommended))

- Reason: unknown meter: 66 66 D (not in METRICAL_LINES)

### Parse failure: psalm-version id=167 (Psalm 136 (Second Version))

- Reason: line count 128 not a multiple of 6 (meter F-6)

### Parse failure: psalm-version id=181 (Psalm 136 (First Version, Recommended))

- Reason: unknown meter: 87 87 (not in METRICAL_LINES)

## Tune-quality issues

Surfaced by `tests/tune-quality-phrase-count.test.ts` (Plan 04.9.6-07 Task 2,
Open-Question-3 option (b)). Every tune with `double_length=true` is expected
to carry exactly 4 `% PHRASE_BREAK` markers in its `abc_notation` (4 phrases =
8 metrical-line slots when rendered per DCM/DLM/DSM cycle, matching the
renderer's `phrasesPerCycle = 4`).

The following 25 tunes violate that invariant (live DB, captured 2026-05-18):

- tune id=5 (Lennox): 1 phrases
- tune id=26 (Aurelia): 1 phrases
- tune id=28 (Orlington): 2 phrases
- tune id=38 (Old 124th): 1 phrases
- tune id=41 (Kingsfold): 2 phrases
- tune id=56 (Communion): 2 phrases
- tune id=57 (Darwall): 1 phrases
- tune id=62 (St. John): 1 phrases
- tune id=71 (Wallace): 2 phrases
- tune id=83 (Eastgate (last line repeat for Ps 133)): 2 phrases
- tune id=86 (Walton): 2 phrases
- tune id=109 (Webb): 1 phrases
- tune id=111 (Ostend): 2 phrases
- tune id=118 (Petersham (CMD, EPC tune)): 2 phrases
- tune id=119 (Old 44th): 2 phrases
- tune id=122 (New 136th): 2 phrases
- tune id=132 (Perfect Way): 2 phrases
- tune id=136 (Clarkeville): 1 phrases
- tune id=139 (Evangel): 2 phrases
- tune id=142 (Leominster): 2 phrases
- tune id=149 (Desert DONT SING): 2 phrases
- tune id=158 (Saxony): 2 phrases
- tune id=163 (Pembroke): 2 phrases
- tune id=164 (St. Asaph): 2 phrases
- tune id=172 (Forest Green): 2 phrases

These tunes are missing 2-3 of the expected 4 phrase-break markers. The
renderer's `mapCycleToPhraseSyllableLines` under-fills the missing slots
with empty strings (the B1 shape contract is preserved), so playback does
not crash — but DCM alignment is visually wrong for these tunes until a
human re-annotates each ABC with the correct phrase boundaries.

Resolution path: hand-edit each tune's `abc_notation` to add the missing
`% PHRASE_BREAK` markers, then re-run `npm run test -- --run
tests/tune-quality-phrase-count.test.ts`. This is out of scope for Plan 07
(the test exists to surface the work, not to do it); it should be picked up
as a follow-on tune-curation pass.
