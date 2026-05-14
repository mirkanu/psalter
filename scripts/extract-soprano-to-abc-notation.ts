#!/usr/bin/env npx tsx
/**
 * Replace tunes.abc_notation (old extractTuneV2 pipeline output) with the
 * soprano voice extracted from tunes.abc_satb (good solFaToAbcMultiVoice
 * pipeline output). Backs up the current abc_notation to abc_notation_legacy
 * first so nothing is lost.
 *
 * Quick task 260514: see .planning/quick/260514-... directory SUMMARY.
 *
 * Idempotent: if abc_notation_legacy is already populated for a row, the
 * backup step is skipped for that row (the legacy snapshot is the canonical
 * pre-replacement value). The replacement step is always re-applied where
 * abc_satb is non-null — so re-running after edits to abc_satb is safe.
 *
 * Usage:
 *   npx tsx scripts/extract-soprano-to-abc-notation.ts --dry-run
 *   npx tsx scripts/extract-soprano-to-abc-notation.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, isNotNull } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { extractMelodyVoice } from '../src/lib/abc-voice-extract'

const DRY_RUN = process.argv.includes('--dry-run')
const SAMPLE_IDS = [126, 30, 47] // Franconia, Crimond, Bangor

function diffSummary(before: string | null, after: string): string {
  const b = (before ?? '').split('\n')
  const a = after.split('\n')
  return [
    `   before: ${b.length} lines, ${(before ?? '').length} chars`,
    `   after:  ${a.length} lines, ${after.length} chars`,
    `   before first line: ${b[0] ?? '(empty)'}`,
    `   after first line:  ${a[0] ?? '(empty)'}`,
  ].join('\n')
}

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })

  const allTunes = await db.select().from(schema.tunes).where(isNotNull(schema.tunes.abcNotation))
  console.log(`Found ${allTunes.length} tunes with abc_notation set.`)

  let backedUp = 0, skippedBackup = 0, replaced = 0, unchanged = 0
  const sampleDiffs: Array<{ id: number, name: string, before: string | null, after: string }> = []

  for (const t of allTunes) {
    const alreadyBackedUp = t.abcNotationLegacy != null
    if (!alreadyBackedUp) {
      if (!DRY_RUN) {
        await db.update(schema.tunes).set({ abcNotationLegacy: t.abcNotation }).where(eq(schema.tunes.id, t.id))
      }
      backedUp++
    } else {
      skippedBackup++
    }

    if (t.abcSatb) {
      const soprano = extractMelodyVoice(t.abcSatb)
      if (!DRY_RUN) {
        await db.update(schema.tunes).set({ abcNotation: soprano }).where(eq(schema.tunes.id, t.id))
      }
      replaced++
      if (SAMPLE_IDS.includes(t.id)) {
        sampleDiffs.push({ id: t.id, name: t.name, before: t.abcNotation, after: soprano })
      }
    } else {
      unchanged++
    }
  }

  console.log(`\nResults (${DRY_RUN ? 'DRY RUN — no writes' : 'LIVE'}):`)
  console.log(`  backed up:        ${backedUp}`)
  console.log(`  skipped backup:   ${skippedBackup} (legacy already populated)`)
  console.log(`  replaced:         ${replaced} (had abc_satb)`)
  console.log(`  unchanged abc:    ${unchanged} (no abc_satb — kept old abc_notation)`)

  console.log(`\nSample diffs (${sampleDiffs.length} of ${SAMPLE_IDS.length} expected):`)
  for (const d of sampleDiffs) {
    console.log(`\n--- Tune #${d.id}: ${d.name} ---`)
    console.log(diffSummary(d.before, d.after))
    console.log(`   --- AFTER (soprano) ---`)
    console.log(d.after.split('\n').map(l => `   ${l}`).join('\n'))
  }

  await sql.end()
}
main().catch((e) => { console.error(e); process.exit(1) })
