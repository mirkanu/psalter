#!/usr/bin/env npx tsx
/**
 * Apply validated ABC notation strings from solfege-ocr.json to tunes in DB.
 *
 * Writes: abc_notation (soprano), solfege_ocr_text (raw transcription JSON), abc_satb (4-voice)
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
 * solfege_ocr_text and abc_satb are always safe to overwrite — no hand-crafted values.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
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
  status: 'success' | 'no_image' | 'validation_failure' | 'transcription_failure'
  abc: string | null
  solfegeText: string | null
  abcSatb: string | null
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
    // Skip entries with nothing useful to write
    const hasSopranoAbc = entry.status === 'success' && !!entry.abc
    const hasSolfegeText = !!entry.solfegeText
    const hasAbcSatb = !!entry.abcSatb

    if (!hasSopranoAbc && !hasSolfegeText && !hasAbcSatb) {
      skipped++
      continue
    }

    const setObj: Partial<typeof schema.tunes.$inferInsert> = {}

    // soprano abc_notation — re-validate before writing; respect protection unless --overwrite
    if (hasSopranoAbc) {
      const validation = validateAbc(entry.abc!)
      if (!validation.valid) {
        console.warn(`  SKIP abc_notation (re-validation failed, ${validation.warningCount} warnings): "${entry.name}"`)
      } else {
        // Check if tune already has abc_notation in DB (protect hand-crafted values)
        if (!OVERWRITE) {
          const [existing] = await db
            .select({ abcNotation: schema.tunes.abcNotation })
            .from(schema.tunes)
            .where(eq(schema.tunes.id, entry.id))
          if (existing?.abcNotation) {
            console.log(`  PROTECTED abc_notation (use --overwrite to replace): "${entry.name}"`)
            protected_++
          } else {
            setObj.abcNotation = entry.abc!
          }
        } else {
          setObj.abcNotation = entry.abc!
        }
      }
    }

    // solfege_ocr_text and abc_satb — always safe to write (new fields, no hand-crafted values)
    if (hasSolfegeText) setObj.solfegeOcrText = entry.solfegeText!
    if (hasAbcSatb) setObj.abcSatb = entry.abcSatb!

    if (Object.keys(setObj).length === 0) {
      skipped++
      continue
    }

    // Write to DB
    if (!DRY_RUN) {
      const result = await db
        .update(schema.tunes)
        .set(setObj)
        .where(eq(schema.tunes.id, entry.id))
        .returning({ id: schema.tunes.id })
      if (result.length > 0) {
        const fields = Object.keys(setObj).join(', ')
        console.log(`  + Updated: "${entry.name}" [${fields}]`)
        updated++
      } else {
        console.warn(`  ! No row updated for "${entry.name}" — id ${entry.id} not found in DB`)
        failed++
      }
    } else {
      const fields = Object.keys(setObj).join(', ')
      console.log(`  [DRY] Would update: "${entry.name}" [${fields}]`)
      updated++
    }
  }

  // 3. Summary
  console.log('\n── Summary ──────────────────────────────────────────────────────')
  console.log(`Updated:   ${updated}${DRY_RUN ? ' (dry run — no DB writes)' : ''}`)
  console.log(`Skipped:   ${skipped}  (no_image, transcription_failure, or nothing to write)`)
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

  // 5. DB count check for all three fields
  if (!DRY_RUN) {
    try {
      const countResult = await pgClient`
        SELECT
          COUNT(*) FILTER (WHERE abc_notation IS NOT NULL)        AS with_abc,
          COUNT(*) FILTER (WHERE solfege_ocr_text IS NOT NULL)    AS with_ocr_text,
          COUNT(*) FILTER (WHERE abc_satb IS NOT NULL)            AS with_satb
        FROM tunes`
      const row = countResult[0]
      console.log(`\nDB tunes counts:`)
      console.log(`  with abc_notation:    ${row?.with_abc ?? '?'}`)
      console.log(`  with solfege_ocr_text: ${row?.with_ocr_text ?? '?'}`)
      console.log(`  with abc_satb:         ${row?.with_satb ?? '?'}`)
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
