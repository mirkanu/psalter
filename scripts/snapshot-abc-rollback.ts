#!/usr/bin/env npx tsx
/**
 * Snapshot the current `tunes.abc_notation` column for all rows to a JSON file,
 * to serve as the pre-phase rollback source-of-truth for Phase 04.11.
 *
 * Per D-01: rollback is a single-column UPDATE; the snapshot must exist in git
 * BEFORE any Wave A DB write. The recovery procedure is documented in
 * `.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-recipe.md`.
 *
 * Usage:
 *   npx tsx scripts/snapshot-abc-rollback.ts
 *
 * Output:
 *   .planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json
 *
 * Read-only. No DB writes.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'

const OUTPUT_PATH =
  '.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
const pgClient = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: pgClient, schema })

async function main() {
  const rows = await db
    .select({
      id: schema.tunes.id,
      name: schema.tunes.name,
      abcNotation: schema.tunes.abcNotation,
    })
    .from(schema.tunes)

  const snapshot = {
    generatedAt: new Date().toISOString(),
    phase: '04.11',
    rowCount: rows.length,
    rows,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2))

  const withAbc = rows.filter((r) => r.abcNotation != null).length
  const nullAbc = rows.length - withAbc
  console.log(`Snapshot written: ${OUTPUT_PATH}`)
  console.log(`  rowCount:        ${rows.length}`)
  console.log(`  with abcNotation: ${withAbc}`)
  console.log(`  null abcNotation: ${nullAbc}`)

  await pgClient.end()
  process.exit(0)
}

main().catch((e) => {
  console.error('Uncaught error:', e)
  process.exit(1)
})
