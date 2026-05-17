---
status: complete
slug: migrate-tunes-double-length
date: 2026-05-17
---

# Quick Task Summary: Migrate `Double length` → `tunes.double_length`

## Outcome

- Added `double_length boolean NOT NULL DEFAULT false` column to `tunes` via `drizzle-kit push`.
- Backfilled from Airtable `Tunes."Double length"` field for all 172 rows.
- **26 tunes flagged `double_length=true`** in Postgres, matching Airtable exactly.

## DCM-flagged tunes (n=26)

| id | name | meter |
|---|---|---|
| 26 | Aurelia | 76 76 D |
| 136 | Clarkeville | 66 66 88 |
| 56 | Communion | LM (long meter, 88 88) |
| 57 | Darwall | 66 66 88 |
| 149 | Desert DONT SING | CM |
| 83 | Eastgate (last line repeat for Ps 133) | CM |
| 18 | Ellacomb | CM |
| 139 | Evangel | CM |
| 172 | Forest Green | CM |
| 41 | Kingsfold | CM |
| 5 | Lennox | 66 66 88 |
| 142 | Leominster | SM |
| 122 | New 136th | CM |
| 38 | Old 124th | 10 10 10 10 10 |
| 119 | Old 44th | CM |
| 28 | Orlington | CM |
| 111 | Ostend | CM |
| 163 | Pembroke | CM |
| 132 | Perfect Way | CM |
| 118 | Petersham (CMD, EPC tune) | CM |
| 158 | Saxony | CM |
| 164 | St. Asaph | CM |
| 62 | St. John | 66 66 88 |
| 71 | Wallace | CM |
| 86 | Walton | LM (long meter, 88 88) |
| 109 | Webb | 76 76 D |

## Insight beyond the canonical doc

`double_length` is **broader than CMD**. Tunes flagged include:
- 4× `66 66 88` (HM) — Clarkeville, Darwall, Lennox, St. John
- 2× `76 76 D` — Aurelia, Webb
- 1× `10 10 10 10 10` — Old 124th
- 1× `SM` — Leominster
- 2× `LM` — Communion, Walton
- 16× `CM` (the actual DCM candidates: Old 44th, Petersham, Ostend, St. Asaph, etc.)

**Functional meaning:** "this tune's score is the length of two normal stanzas; one tune-pass covers two lyric stanzas." This is **independent of underlying meter** — applies to any doubled-stanza tune.

**Implication for the alignment phase:** The DCM-rendering fix should key off `double_length=true`, not off `meter='CMD'` or ABC-length heuristics. The rule is: *if `tune.double_length`, allocate two lyric stanzas per tune-pass; otherwise one.*

**Doc refinement (deferred):** `.planning/research/scottish-psalter-structure.md` §2 currently frames DCM as "doubled CM specifically." A future polish pass should generalise this to "doubled-stanza tunes across all meter families."

## Files changed

- `src/db/schema.ts` — added `doubleLength` column
- `scripts/migrate-double-length.ts` — new throwaway backfill script (idempotent — safe to re-run)
- Postgres: `tunes.double_length` column populated for all 172 rows

## Caveats

- One Airtable `do/use aots` control row may also have been flagged. `Desert DONT SING` is correctly flagged from Airtable; downstream rendering should still skip it via name convention.
- The migration script reported "Updated 0 tunes" due to drizzle's rowCount semantics (rows where the value didn't change). The actual DB state is correct (verified via direct SQL query).
