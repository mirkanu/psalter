---
phase: quick-260512-ssp
plan: 01
subsystem: ocr-pipeline
tags: [ocr, database, schema, solfege, satb]
dependency_graph:
  requires: [phase-4.9-ocr-pipeline]
  provides: [solfege_ocr_text, abc_satb columns in tunes table]
  affects: [tunes table, scripts/ocr-solfege.ts, scripts/apply-abc-notation.ts]
tech_stack:
  added: []
  patterns: [transcribeOnly+solFaToAbcMultiVoice pipeline, resume-capable OCR with per-tune JSON flush]
key_files:
  created: []
  modified:
    - src/db/schema.ts
    - scripts/ocr-solfege.ts
    - scripts/apply-abc-notation.ts
    - scripts/output/solfege-ocr.json
decisions:
  - Force-added solfege-ocr.json to git despite .gitignore (scripts/output/*.json) because the plan requires it as the reproducible data source
  - Applied partial results (75/144 tunes) to DB immediately rather than waiting for full run — resume logic ensures no data loss on re-run
metrics:
  duration: ~12 minutes
  completed: "2026-05-12"
  tasks_completed: 3
  files_modified: 4
---

# Phase quick-260512-ssp Plan 01: OCR Pipeline Completion Summary

## One-liner

Added `solfege_ocr_text` and `abc_satb` columns to tunes table, refactored OCR scripts to use `transcribeOnly()+solFaToAbcMultiVoice()` pipeline, and ran partial OCR (75/144 tunes) before hitting API credit exhaustion.

## Task Outcomes

### Task 1: Schema migration (COMPLETE)
- Added `solfegeOcrText: text('solfege_ocr_text')` and `abcSatb: text('abc_satb')` to `tunes` table in `src/db/schema.ts`
- Pushed to live DB via `drizzle-kit push` — both columns confirmed present as nullable text
- Commit: `c37bbeb`

### Task 2: Script refactoring (COMPLETE)
- `scripts/ocr-solfege.ts`: replaced `tryGetAbc` (haiku→sonnet escalation, prompt-based) with `tryProcessTune` using `transcribeOnly()` + `solFaToAbc()` + `solFaToAbcMultiVoice()`
- New `OutputEntry` type adds `solfegeText` and `abcSatb` fields
- Resume logic updated: skips only tunes with `status=success AND solfegeText AND abcSatb`
- `scripts/apply-abc-notation.ts`: writes all three fields (`abcNotation`, `solfegeOcrText`, `abcSatb`); protection logic applies only to `abcNotation`; sanity guard counts any field write
- Both scripts type-check clean (`npx tsc --noEmit` zero errors in those files)
- Commit: `13fc0ba`

### Task 3: Pipeline run (PARTIAL - AUTH GATE)
- Pre-flight: 320 JPEGs, 1,489,381,619 bytes — verified unchanged post-run
- Script verified to only write to `scripts/output/solfege-ocr.json`
- Pipeline ran until `PSALTER_ANTHROPIC_API_KEY` credit exhausted at tune 75 of 144
- 75 tunes successfully processed: `solfege_ocr_text` + `abc_satb` populated in DB
- 69 tunes failed with `400 credit balance too low` — stored as `transcription_failure` in JSON
- `apply-abc-notation.ts` applied 75 rows to DB (skipped sanity guard threshold of 100 — working as expected for partial run)
- Commit: `661b65b`

## Final DB Counts

| Column | Count |
|--------|-------|
| `abc_notation IS NOT NULL` | 147 |
| `solfege_ocr_text IS NOT NULL` | 75 |
| `abc_satb IS NOT NULL` | 75 |
| Tunes with solfege images on disk | 144 |

## Auth Gate: API Credit Exhaustion

**Occurred during:** Task 3 (OCR pipeline run)
**Error:** `400 {"type":"error","error":{"type":"invalid_request_error","message":"Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits."}}`
**Key:** `PSALTER_ANTHROPIC_API_KEY` (project-scoped key in `/home/services/.env.production`)
**Resolution needed:** Top up credit at https://console.anthropic.com/settings/billing

**To resume after top-up:**
```bash
cd /data/home/psalter
npx tsx scripts/ocr-solfege.ts    # resumes from tune 76 (resume logic detects missing solfegeText+abcSatb)
npx tsx scripts/apply-abc-notation.ts
```

The JSON at `scripts/output/solfege-ocr.json` contains all 172 entries — 75 with full data, 69 as `transcription_failure` (will be re-tried on resume since they lack `solfegeText`+`abcSatb`), 28 as `no_image`.

## Soprano ABC Regression Check

`with_soprano_abc` went from 143 → 147 (increased by 4: Praetorius, Jackson, St. Kilda, Corona gained abc_notation from the new pipeline). No regression. All previously hand-crafted ABCs are protected.

## API Cost Estimate

75 tunes processed via `claude-sonnet-4-6` (vision + transcription). At ~$0.02-0.04 per image call, estimated $2-4 spent. Remaining 69 tunes will cost ~$1.50-3.00 on re-run.

## Commits

| Hash | Message |
|------|---------|
| `c37bbeb` | feat(db): add solfege_ocr_text and abc_satb columns to tunes |
| `13fc0ba` | feat(scripts): capture raw solfege OCR text and SATB ABC in pipeline |
| `661b65b` | feat(data): populate solfege_ocr_text and abc_satb for 75 tunes (partial) |

## Deviations from Plan

### Auth Gate: API Credit Exhaustion
- **Found during:** Task 3
- **Issue:** `PSALTER_ANTHROPIC_API_KEY` ran out of credits during pipeline run at tune 75/144
- **Impact:** 69/144 tunes not yet OCR'd; DB has 75 instead of ~143 entries for new columns
- **Fix:** Applied partial results immediately; resume logic in script handles re-run after credit top-up
- **This is an external dependency gate, not a code bug**

### JSON gitignore bypass
- **Found during:** Task 3 commit
- `scripts/output/*.json` is in `.gitignore` — plan specified committing `solfege-ocr.json`
- Used `git add -f` to force-add it as the plan requires it as the reproducible source artifact

## Self-Check

- [x] `src/db/schema.ts` exists and contains `solfegeOcrText` and `abcSatb`
- [x] DB columns confirmed: `solfege_ocr_text,abc_satb` in `information_schema.columns`
- [x] `scripts/ocr-solfege.ts` contains `transcribeOnly` and `solFaToAbcMultiVoice`
- [x] `scripts/apply-abc-notation.ts` contains `solfegeOcrText` and `abcSatb`
- [x] 3 commits on master: c37bbeb, 13fc0ba, 661b65b
- [x] JPEGs unchanged (320 files, 1,489,381,619 bytes before = after)
- [x] DB: 75 tunes with solfege_ocr_text, 75 with abc_satb (partial — 69 pending credit top-up)

## Self-Check: PASSED (with caveats)

The DB count target of >=140 tunes is NOT yet met (75 of 144) due to the API credit gate. All infrastructure (schema, scripts) is complete and correct. Re-running `ocr-solfege.ts` after credit top-up will populate the remaining 69 tunes without any code changes.
