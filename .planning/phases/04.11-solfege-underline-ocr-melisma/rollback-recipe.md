# Phase 04.11 — Rollback Recipe

**Snapshot source-of-truth:** `.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json` (committed in Plan 01, Task 1).

This document contains the exact commands a future operator runs to restore `tunes.abc_notation` from the pre-phase snapshot if any wave of 04.11 fails validation.

---

## 1. When to roll back

If Wave A sing-test fails on any tune, or if Wave B `verify-staff-alignment.js` produces > 0 fails (TOLERANCE=0), run the procedure below.

---

## 2. Full restoration (all rows)

Per D-01 the rollback is a single-column UPDATE per row. Embed the following one-shot script (do NOT commit it alongside — create, run, delete):

```typescript
// scripts/restore-from-rollback.ts (one-shot, do not commit alongside)
import 'dotenv/config'
import * as fs from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const snap = JSON.parse(fs.readFileSync('.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json', 'utf-8'))
const pgClient = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: pgClient, schema })
for (const r of snap.rows) {
  await db.update(schema.tunes).set({ abcNotation: r.abcNotation }).where(eq(schema.tunes.id, r.id))
}
await pgClient.end()
```

Run it, then rebuild + restart:

```bash
npx tsx scripts/restore-from-rollback.ts
npm run build && pm2 restart psalter
```

---

## 3. Single-tune restoration

For a targeted recovery (e.g. one tune failed Wave A sing-test, the rest are good), restore only that row from `rollback-snapshot.json`:

```bash
# Restore one tune by name (e.g. Crimond)
npx tsx -e "
import 'dotenv/config'; import * as fs from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js'; import postgres from 'postgres';
import { eq } from 'drizzle-orm'; import * as schema from './src/db/schema';
const snap = JSON.parse(fs.readFileSync('.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json','utf-8'));
const target = process.argv.pop();
const row = snap.rows.find((r:any) => r.name === target);
if (!row) { console.error('not in snapshot'); process.exit(1); }
const pg = postgres(process.env.DATABASE_URL!); const db = drizzle({client: pg, schema});
await db.update(schema.tunes).set({ abcNotation: row.abcNotation }).where(eq(schema.tunes.id, row.id));
await pg.end();
" -- 'Crimond'
```

Then `npm run build && pm2 restart psalter`.

---

## 4. Post-rollback verification

After running either restoration path, confirm the population is back to its pre-phase state:

```bash
TOLERANCE=0 node scripts/uat/verify-staff-alignment.js
```

Expected: pass count matches the pre-phase pass count recorded in
`.planning/phases/04.10-verified-musicxml-pilot-crimond/04.10-FINDINGS.md`
(per RESEARCH Pitfall 6 — TOLERANCE=0 is mandatory; any drift indicates the
restoration did not complete cleanly or another mutation has occurred since).

---

## 5. Pre-Wave-B gate (operator MUST verify before `--apply`)

Before running Wave B (`scripts/ocr-melisma-batch.ts --apply --wave-a-passed`), the operator MUST confirm all of the following:

- [ ] Wave A sing-test sign-off recorded in this phase's SUMMARY.
- [ ] `git log` shows the Wave A commit landed and was tested on production (`psalter.gsdlabs.dev`).
- [ ] `scripts/ocr-melisma-batch.ts --apply --wave-a-passed` is invoked ONLY when Wave A is signed off; the script will throw if the `--wave-a-passed` flag is absent.

The `rollback-snapshot.json` referenced throughout this recipe is the only sanctioned recovery source — do not attempt to reconstruct from older backups or partial dumps.
