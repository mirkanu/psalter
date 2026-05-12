---
name: Automated Tune Ingestion Tool
description: Productise the one-shot solfège OCR → ABC migration script into an admin-accessible converter for adding new tunes post-launch
type: seed
trigger_condition: When new tunes are added to the psalter post-launch and need ABC notation generated
planted_date: 2026-05-11
---

When new tunes are added to the psalter, the congregation currently relies on manual ABC entry or re-running the one-shot migration script from Phase 4.9. This seed tracks turning that script into a proper admin tool.

## What this would look like

- Admin UI page (or CLI command) that accepts a solfège JPEG upload
- Calls the same vision LLM OCR + sol-fa parser pipeline from Phase 4.9
- Previews the generated ABC string rendered via abcjs before saving
- On confirm, writes the ABC string to `tunes.abc_notation` in the DB

## Why not now

Phase 4.9 delivers the one-shot migration for the existing ~163 tunes. New tune additions are infrequent (the 1979 Psalter is fixed), so an admin UI is not worth the investment until there is a demonstrated need.

## Trigger

Pick this up when: (a) new tunes are being added regularly, or (b) Phase 5 Precentor Portal admin UI is being built and this can be added as a low-cost extension.
