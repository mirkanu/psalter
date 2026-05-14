---
quick_task: 260514-qa-soprano-from-satb
date: 2026-05-14
related_phase: 04.9.2
related_quick: 260512-ssp-phase-4-9-ocr-pipeline-completion
---

# Quick task 260514 — Soprano-from-SATB replacement for tunes.abc_notation

## Why

Phase 04.9.2 closed with the notation renderer correctly architected but
displaying the old `extractTuneV2` pipeline output in `tunes.abc_notation`.
The good pipeline (`solFaToAbcMultiVoice` over Claude's `solfege_ocr_text`,
landed by quick task `260512-ssp`) had been writing to `tunes.abc_satb` but
its soprano voice was never promoted to the column the renderer reads.

Spot-check on Bangor (id=47) confirmed the divergence: the legacy
`abc_notation` for Bangor was titled "According to Thy Gracious Word"
(a hymn in Eb), not Bangor. The SATB-extracted soprano is Bangor proper in Dm.

## Approach

1. Back up the existing `abc_notation` to a new column `abc_notation_legacy`.
2. Replace `abc_notation` with the soprano voice extracted from `abc_satb`
   (via `extractMelodyVoice`).
3. Re-annotate the new content with `% PHRASE_BREAK` markers using the
   existing Plan 02 script (`annotate-phrase-breaks.ts --overwrite`).

## Files

Added:
- `src/lib/abc-voice-extract.ts`
- `scripts/validate-soprano-extract.ts`
- `scripts/extract-soprano-to-abc-notation.ts`
- `scripts/uat/260514-soprano-screenshots.js`

Modified:
- `src/db/schema.ts` (`abcNotationLegacy` column)

DB: `ALTER TABLE tunes ADD COLUMN abc_notation_legacy text`

Screenshots refreshed: `psalm-23-*`, `tune-30-*`, `tune-126-*` (new)

## Counts

`abc_notation` replacement: 148 backed up, 144 replaced (had `abc_satb`),
4 unchanged (no `abc_satb`), 0 SATB rows still equal to legacy.

Phrase-break re-annotation: 137 annotated, 11 skipped (matches Plan 02 original).
Idempotency: re-run without `--overwrite` shows 0 annotated.

## Commits

- `828628e` feat(quick): add abc_notation_legacy backup column to tunes
- `5717f1b` feat(quick): script to replace abc_notation with SATB-extracted soprano
- `7be468d` docs(quick): UAT screenshots + capture script for soprano-from-SATB
- (this) docs(quick): SUMMARY for soprano-from-SATB extraction quick task

## Follow-ups

- 4 tunes still have legacy `abc_notation` (`abc_satb IS NULL`). Re-run the
  SATB pipeline to cover them.
- `abc_notation_legacy` preserved indefinitely as a safety net.
