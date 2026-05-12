---
slug: notation-ocr-persist-feedback
title: Persist OCR results to DB + tune notation feedback form
status: in-progress
created: 2026-05-12
---

# Persist OCR Results + Notation Feedback Form

## Goal
1. All OCR results clicked in the /dev/notation-compare UI are saved permanently to the DB (not just localStorage)
2. A feedback panel lets the user select which ABC version to use per tune (or "none") with a free-text comment — stored permanently in DB

## Tasks

### 1. DB schema — two new tables
Add to `src/db/schema.ts`:
- `tune_ocr_results`: PK (tune_id, mode), stores result as JSONB, timestamps
- `tune_notation_feedback`: PK tune_id, selected_version text, comment text, updated_at

Run `drizzle-kit push` to apply.

### 2. API route — OCR results persistence
`src/app/api/dev/tune-ocr-result/route.ts`
- GET `?tuneId=X&mode=Y` → return result from DB (null if missing)
- POST body `{tuneId, mode, result}` → upsert

### 3. API route — tune feedback
`src/app/api/dev/tune-feedback/route.ts`
- GET `?tuneId=X` → return {selectedVersion, comment} from DB
- POST body `{tuneId, selectedVersion, comment}` → upsert

### 4. NotationCompareClient — save OCR to DB after each run
- After `saveCache()` in `OcrPanel.run()` and `OcrTextPanel.run()`, fire a background POST to `/api/dev/tune-ocr-result`
- On load: if localStorage miss, try GET from DB and populate

### 5. TuneFeedbackPanel component
- Loaded below all OCR panels for the selected tune
- Shows current DB feedback if any (fetched on tune selection)
- Selector: "none" | "hymnary" | "staff" | "solfege" | "audiveris" | "ocr-text"
- Textarea for comment
- Save button — POSTs to `/api/dev/tune-feedback`
- Shows saved timestamp

## Files to create/modify
- `src/db/schema.ts` — add 2 tables + relations
- `src/app/api/dev/tune-ocr-result/route.ts` — NEW
- `src/app/api/dev/tune-feedback/route.ts` — NEW
- `src/app/dev/notation-compare/NotationCompareClient.tsx` — persist OCR + feedback panel

## Verification
- Run OCR on a tune → check DB record exists via psql
- Submit feedback → check DB record via psql
- Reload page / clear localStorage → OCR result still loads from DB
