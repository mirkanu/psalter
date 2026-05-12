---
slug: notation-ocr-persist-feedback
status: complete
completed: 2026-05-12
commit: a02418b
---

## What was built

- `tune_ocr_results` DB table — composite PK (tune_id, mode), jsonb result, timestamps
- `tune_notation_feedback` DB table — PK tune_id, selected_version, comment, updated_at
- `GET/POST /api/dev/tune-ocr-result` — load/upsert OCR results per tune+mode
- `GET/POST /api/dev/tune-feedback` — load/upsert feedback per tune
- `NotationCompareClient`: OCR runs now fire-and-forget POST to DB; useEffect falls back to DB when localStorage empty
- `TuneFeedbackPanel`: version dropdown (none/hymnary/staff/solfege/ocr-text/audiveris) + comment textarea + save button, loads existing feedback on tune change

## Verified
- Build clean
- DB tables present
- Playwright: feedback saves, "Saved ✓" shown, psql confirms record
