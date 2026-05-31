/**
 * One-time backfill of tunes.abc_notation_ocr from the Phase 04.11 rollback
 * snapshot. The snapshot captures the OCR-imported ABC for every tune
 * BEFORE any manual edits via /dev/melisma-editor — that's the canonical
 * "original OCR" the user is paying to preserve.
 *
 * Idempotent: skips rows that already have abc_notation_ocr set.
 */

import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, isNull } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const SNAPSHOT_PATH = path.join(
  process.cwd(),
  '.planning/phases/04.11-solfege-underline-ocr-melisma/rollback-snapshot.json',
)

interface SnapshotRow {
  id: number
  name: string
  abcNotation: string | null
}

interface Snapshot {
  generatedAt: string
  phase: string
  rowCount: number
  rows: SnapshotRow[]
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing — source /data/home/psalter/.env first')
  }
  if (!fs.existsSync(SNAPSHOT_PATH)) {
    throw new Error(`Snapshot not found at ${SNAPSHOT_PATH}`)
  }

  const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8')) as Snapshot
  console.log(`Loaded snapshot from ${snapshot.generatedAt}: ${snapshot.rowCount} rows`)

  const sql = postgres(process.env.DATABASE_URL, { max: 2 })
  const db = drizzle(sql, { schema })

  let filled = 0
  let skipped = 0
  let missingFromSnapshot = 0

  // For every row in the live tunes table that has abc_notation_ocr IS NULL,
  // look up its snapshot value by id and write it.
  const rowsNeedingBackfill = await db
    .select({ id: schema.tunes.id, name: schema.tunes.name })
    .from(schema.tunes)
    .where(isNull(schema.tunes.abcNotationOcr))

  console.log(`${rowsNeedingBackfill.length} rows need backfill`)

  for (const r of rowsNeedingBackfill) {
    const snap = snapshot.rows.find(s => s.id === r.id)
    if (!snap) {
      console.warn(`  ⚠ no snapshot row for tune id=${r.id} name="${r.name}"`)
      missingFromSnapshot++
      continue
    }
    if (snap.abcNotation === null || snap.abcNotation === '') {
      // Nothing to preserve — leave column NULL
      skipped++
      continue
    }
    await db
      .update(schema.tunes)
      .set({ abcNotationOcr: snap.abcNotation })
      .where(eq(schema.tunes.id, r.id))
    filled++
  }

  console.log(`Done. filled=${filled} skipped(empty snapshot)=${skipped} missing-in-snapshot=${missingFromSnapshot}`)
  await sql.end()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
