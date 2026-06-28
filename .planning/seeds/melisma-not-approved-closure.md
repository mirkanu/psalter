# Seed: Close out Not Approved melisma decisions + backfill melisma_positions

## What

Resolve all 6 currently "Not Approved" melisma decisions in `/dev/melisma-editor`, fix the systemic `melisma_positions` null gap for approved-but-empty tunes, and audit the full 66 66 88 meter family for systematic phrase-break issues.

## Why

6 tunes are stuck in "Not Approved" status. 4 of them have fixable ABC issues (missing phrase breaks, wrong-meter psalm link, alignment bugs). 2 need source material that doesn't exist yet (deferred). Separately, 13 approved tunes have `melisma_positions = NULL` in the DB, which means they skip the stanza-2+ lyric text fix in NotationRenderer — a silent regression for multi-stanza psalms.

## Context

### Data model

- `tunes.melisma_positions` (jsonb, nullable): per-phrase melisma note indices. `NULL` = use heuristic path (parse embedded `w:` lines from `abc_notation`).
- `tune_melisma_decisions` (append-only log): each row has `status` ('approved'|'not_approved'|null) + `comment`. Latest non-null status row = current state.
- Production page (`/psalms/[id]`) passes `melismaPositions` from `tunes.melisma_positions` to `NotationRenderer`. When NULL, the heuristic path runs — which works for "no melisma" tunes but **skips the stanza-2+ cycle text fix** (NotationRenderer.tsx:818-902).

### Current state (2026-06-28)

**Not Approved (6 tunes):**

| Tune | Meter | Latest Comment | Category |
|------|-------|---------------|----------|
| Old 124th | 10 10 10 10 10 | stanza-1 syllables only 4 phrases; prod doesn't render at all | A — fix in editor |
| Clarkeville | 66 66 88 | needs psalm of correct meter linked | A — fix link + verify |
| Darwall | 66 66 88 | prod doesn't show lyrics | A — fix phrase alignment |
| Praetorius | CM | prod cuts off last syllable of 1st line | A — fix w: alignment |
| Kingsfold | CM (DCM) | OCR incomplete (~24 notes, needs ~56) | B — defer, no source |
| Bays of Harris | CM | no solfège JPEG, OCR too few notes | B — defer, no source |

**Approved but melisma_positions = NULL (13 tunes):**
All CM, 3 PHRASE_BREAKs, 0 w-lines, no melismas. The save route never wrote `[]` for "no melisma" approvals. These tunes work on cycle 1 but may have wrong lyrics on cycle 2+ (stanza 2+ text not injected via positions path).

**66 66 88 meter family (4 tunes):**
- Clarkeville (5 breaks, not_approved)
- Darwall (5 breaks, not_approved)
- Lennox (0 breaks, DCM, double_length=true — auto-injects client-side, never reviewed)
- St. John (0 breaks, DCM, double_length=true — same)

Lennox and St. John have full ABC but 0 stored PHRASE_BREAKs. DCM auto-inject handles them client-side in the editor. They should be audited for correct phrase shape [6,6,6,6,8,8] when run through the editor.

### Root cause for "prod doesn't render / wrong lyrics"

The production page reads `melisma_positions` from the DB. When NULL, it falls back to parsing `w:` lines from `abc_notation`. But the melisma editor **strips w-lines** when saving (it stores positions separately). So tunes that were edited and approved without melisma_positions being written have no w-lines AND no positions — prod has no melisma data at all.

### Files involved

- `src/app/dev/melisma-editor/page.tsx` — server loader, decision status resolution
- `src/app/dev/melisma-editor/MelismaEditorClient.tsx` — editor UI, save logic
- `src/app/api/dev/melisma-save/route.ts` — writes melisma_positions to DB
- `src/app/api/dev/melisma-decision/route.ts` — writes decision log
- `src/components/notation/NotationRenderer.tsx` — production rendering, positions vs heuristic branch
- `src/app/psalms/[id]/page.tsx` — production page, passes melismaPositions

## Scope

### In scope
1. Fix Old 124th: add missing 4th PHRASE_BREAK in editor, approve
2. Fix Darwall: verify [6,6,6,6,8,8] phrase shape, re-place PHRASE_BREAKs, approve
3. Fix Clarkeville: link correct 66 66 88 psalm, verify shape, approve
4. Fix Praetorius: fix last-syllable cutoff (w: line alignment), approve
5. Audit Lennox and St. John (66 66 88 DCM) for correct phrase shape
6. Backfill `melisma_positions = []` for the 13 approved-but-null CM tunes
7. Fix melisma-save route to write `[]` (not null) when a tune is approved with zero melismas

### Out of scope
- Kingsfold and Bays of Harris (no source material — defer to Phase 6 or manual digitization)
- Tunes with no decision at all (63 untouched tunes) — normal review flow

## Key decisions

- **Empty positions = `[]` not null**: A tune with zero melismas should have `melisma_positions = []` so the positions branch runs (enabling stanza-2+ text fix). Distinguish "no data" (null) from "confirmed no melismas" ([]).
- **66 66 88 phrase shape is [6,6,6,6,8,8]**: 6 phrases, not 5. Clarkeville and Darwall both have 5 PHRASE_BREAKs (6 segments) which is correct. Verify syllable counts match.
- **DCM tunes (Lennox, St. John)**: Don't need stored PHRASE_BREAKs — editor auto-injects 8 via double_length flag. Audit only for note/syllable count correctness.

## Success criteria

- 0 tunes in "Not Approved" status (all 4 fixable ones approved, 2 deferred with comment)
- All 13 approved-but-null tunes have `melisma_positions = []`
- melisma-save route writes `[]` for zero-melisma approvals
- Lennox and St. John either approved or flagged with specific issue
- Old 124th renders correctly on prod (5 phrases, [10,10,10,10,10])
