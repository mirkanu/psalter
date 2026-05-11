#!/usr/bin/env npx tsx
/**
 * Apply validated ABC notation strings from solfege-ocr.json to tunes.abc_notation in DB.
 *
 * Usage:
 *   npx tsx scripts/apply-abc-notation.ts           # Apply all passing entries
 *   npx tsx scripts/apply-abc-notation.ts --dry-run  # Show what would be updated (no DB writes)
 *   npx tsx scripts/apply-abc-notation.ts --overwrite # Also replace tunes that already have abc_notation
 *
 * Prerequisites: scripts/output/solfege-ocr.json must exist (produced by ocr-solfege.ts)
 *
 * Protection: By default, tunes where abcNotation IS NOT NULL are skipped (protecting
 * the 5 hand-crafted ABCs seeded in Phase 4). Use --overwrite to replace them.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, isNotNull } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import * as abcjsModule from 'abcjs'

// ─── Constants and CLI args ───────────────────────────────────────────────────

const OUTPUT_PATH = path.join(process.cwd(), 'scripts/output/solfege-ocr.json')

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const OVERWRITE = args.includes('--overwrite')

if (DRY_RUN) console.log('DRY RUN — no DB writes will occur')
if (OVERWRITE) console.log('OVERWRITE mode — existing abc_notation values will be replaced')

// ─── Environment guard and DB init ───────────────────────────────────────────

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
const pgClient = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: pgClient, schema })
const abcjs = (abcjsModule as any).default ?? abcjsModule

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutputEntry {
  id: number
  name: string
  slug: string
  status: 'success' | 'no_image' | 'validation_failure'
  abc: string | null
  model: string | null
  warningCount?: number
  pageCount?: number
}

// ─── ABC validation (defensive re-validation before every DB write) ───────────

function validateAbc(abcStr: string): { valid: boolean; warningCount: number } {
  const result = abcjs.parseOnly(abcStr)
  const tune = result[0]
  const hasNotes = tune.lines?.some((l: any) =>
    l.staff?.some((s: any) => s.voices?.some((v: any) => v.length > 0))
  )
  const warnings = tune.warnings ?? []
  return { valid: hasNotes && warnings.length === 0, warningCount: warnings.length }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Load JSON
  if (!fs.existsSync(OUTPUT_PATH)) {
    throw new Error(`${OUTPUT_PATH} not found — run ocr-solfege.ts first`)
  }
  const entries: OutputEntry[] = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'))
  console.log(`Loaded ${entries.length} entries from solfege-ocr.json`)

  let updated = 0
  let skipped = 0
  let protected_ = 0
  let failed = 0

  // 2. Process each entry
  for (const entry of entries) {
    // Only process successful OCR entries with non-null ABC
    if (entry.status !== 'success' || !entry.abc) {
      skipped++
      continue
    }

    // Re-validate ABC string (defensive — JSON may be from a prior run with different prompt)
    const validation = validateAbc(entry.abc)
    if (!validation.valid) {
      console.warn(`  SKIP (re-validation failed, ${validation.warningCount} warnings): "${entry.name}"`)
      failed++
      continue
    }

    // Check if tune already has abc_notation in DB (protect hand-crafted values)
    if (!OVERWRITE) {
      const [existing] = await db
        .select({ abcNotation: schema.tunes.abcNotation })
        .from(schema.tunes)
        .where(eq(schema.tunes.id, entry.id))
      if (existing?.abcNotation) {
        console.log(`  PROTECTED (use --overwrite to replace): "${entry.name}"`)
        protected_++
        continue
      }
    }

    // Write to DB
    if (!DRY_RUN) {
      const result = await db
        .update(schema.tunes)
        .set({ abcNotation: entry.abc })
        .where(eq(schema.tunes.id, entry.id))
        .returning({ id: schema.tunes.id })
      if (result.length > 0) {
        console.log(`  + Updated: "${entry.name}" (model: ${entry.model})`)
        updated++
      } else {
        console.warn(`  ! No row updated for "${entry.name}" — id ${entry.id} not found in DB`)
        failed++
      }
    } else {
      console.log(`  [DRY] Would update: "${entry.name}"`)
      updated++
    }
  }

  // 3. Summary
  console.log('\n── Summary ──────────────────────────────────────────────────────')
  console.log(`Updated:   ${updated}${DRY_RUN ? ' (dry run — no DB writes)' : ''}`)
  console.log(`Skipped:   ${skipped}  (no_image or validation_failure status)`)
  console.log(`Protected: ${protected_}  (already had abc_notation; use --overwrite to replace)`)
  console.log(`Failed:    ${failed}  (re-validation failure or DB mismatch)`)
  console.log('────────────────────────────────────────────────────────────────')

  // 4. Sanity guard — fail if too few updates (indicates something is wrong)
  if (!DRY_RUN && updated < 100) {
    console.error('FAIL: fewer than 100 tunes updated — check solfege-ocr.json and DB connectivity')
    await pgClient.end()
    process.exit(1)
  }
  console.log('PASS')

  // 5. DB count check
  if (!DRY_RUN) {
    try {
      const countResult = await pgClient`SELECT COUNT(*) as count FROM tunes WHERE abc_notation IS NOT NULL`
      const count = countResult[0]?.count ?? '?'
      console.log(`\nDB: tunes with abc_notation IS NOT NULL: ${count}`)
    } catch (e) {
      console.warn('Could not query DB count:', e)
    }
  }

  await pgClient.end()
  process.exit(0)
}

main().catch(e => {
  console.error('Uncaught error:', e)
  process.exit(1)
})
