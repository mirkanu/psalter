#!/usr/bin/env npx tsx
/**
 * One-time migration: extract embedded w: lines from approved tunes, convert
 * to melismaPositions number[][], strip w: lines from abc_notation, write both
 * back to DB.
 *
 * Usage:
 *   npx tsx scripts/migrate/extract-melisma-positions.ts            # dry-run (default)
 *   npx tsx scripts/migrate/extract-melisma-positions.ts --dry-run  # explicit dry-run
 *   npx tsx scripts/migrate/extract-melisma-positions.ts --apply    # write to DB
 *
 * Idempotency: skips tunes where melisma_positions is already set AND
 * abc_notation has no embedded w: lines.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../../src/db/schema'
import { tunes } from '../../src/db/schema'
import { splitOnPhraseBreaks } from '../../src/lib/abc-phrases'
import { extractEmbeddedWLines } from '../../src/lib/abc-embedded-lyrics'

// ─── DB setup ────────────────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is not set')
  process.exit(1)
}

const pgClient = postgres(process.env.DATABASE_URL, { max: 1 })
const db = drizzle({ client: pgClient, schema })

// ─── Types ───────────────────────────────────────────────────────────────────

interface TuneRow {
  id: number
  name: string
  abcNotation: string | null
  melismaPositions: number[][] | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns true if the ABC string has any embedded w: lines.
 */
function hasWLines(abc: string): boolean {
  return /^\s*w:/m.test(abc)
}

/**
 * Extract melisma positions from an ABC string.
 * Returns a number[][] — one sub-array per phrase, each containing the 0-based
 * token indices where `_` (hold/melisma) appears in that phrase's w: line(s).
 */
function extractPositions(abc: string): number[][] {
  const { phrases } = splitOnPhraseBreaks(abc)
  return phrases.map((phraseBody) => {
    const wLines = extractEmbeddedWLines(phraseBody)
    if (wLines.length === 0) return []
    // Concatenate all w: lines for this phrase with space separator
    const content = wLines.join(' ')
    const tokens = content.trim().split(/\s+/).filter(Boolean)
    const positions: number[] = []
    tokens.forEach((token, idx) => {
      if (token === '_') positions.push(idx)
    })
    return positions
  })
}

/**
 * Strip all w: lines from an ABC string, globally.
 */
function stripWLines(abc: string): string {
  return abc
    .split('\n')
    .filter((line) => !/^\s*w:/.test(line))
    .join('\n')
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const applyMode = args.includes('--apply')
  const mode = applyMode ? 'APPLY' : 'DRY-RUN'
  console.log(`\n=== extract-melisma-positions [${mode}] ===\n`)

  // Query approved tunes (latest decision per tune where status='approved')
  // Using raw postgres.js for DISTINCT ON query (not supported in Drizzle ORM syntax)
  const rows = await pgClient<TuneRow[]>`
    SELECT DISTINCT ON (d.tune_id)
      t.id,
      t.name,
      t.abc_notation   AS "abcNotation",
      t.melisma_positions AS "melismaPositions"
    FROM tune_melisma_decisions d
    JOIN tunes t ON t.id = d.tune_id
    WHERE d.status = 'approved'
    ORDER BY d.tune_id, d.id DESC
  `

  const approvedTunes: TuneRow[] = rows

  console.log(`Found ${approvedTunes.length} approved tunes\n`)

  let processed = 0
  let skipped = 0
  let errors = 0

  for (const tune of approvedTunes) {
    const label = `${tune.name} (id=${tune.id})`

    // Error: no abc_notation
    if (!tune.abcNotation) {
      console.log(`[SKIP] Tune: ${label} — no abc_notation`)
      skipped++
      continue
    }

    // Idempotency: already migrated (positions set and no w: lines in ABC)
    if (tune.melismaPositions !== null && !hasWLines(tune.abcNotation)) {
      console.log(`[SKIP] Tune: ${label} — already migrated`)
      skipped++
      continue
    }

    // Extract positions
    const melismaPositions = extractPositions(tune.abcNotation)

    // Strip w: lines
    const strippedAbc = stripWLines(tune.abcNotation)

    // Sanity check: stripped ABC must still contain K: header
    if (!/^K:/m.test(strippedAbc)) {
      console.error(`[ERROR] Tune: ${label} — stripped ABC lost K: header, refusing to write`)
      errors++
      continue
    }

    // Count how many phrases had w: content
    const { phrases } = splitOnPhraseBreaks(tune.abcNotation)
    const phrasesWithWContent = phrases.filter(
      (phraseBody) => extractEmbeddedWLines(phraseBody).length > 0
    ).length

    // Count total _ tokens across all phrases
    const totalUnderscores = melismaPositions.flat().length

    console.log(`[${mode}] Tune: ${label}`)
    console.log(`  Phrases: ${melismaPositions.length}`)
    console.log(`  Positions: ${JSON.stringify(melismaPositions)}`)
    console.log(`  Stripped ABC: w-lines removed, ${phrasesWithWContent} phrase(s) had w: content, ${totalUnderscores} melisma position(s)`)
    console.log(`  Would update: abcNotation (stripped) + melismaPositions`)

    if (applyMode) {
      try {
        await db.transaction(async (tx) => {
          await tx
            .update(tunes)
            .set({
              abcNotation: strippedAbc,
              melismaPositions: melismaPositions,
            })
            .where(eq(tunes.id, tune.id))
        })
        console.log(`  [WRITTEN]`)
      } catch (err) {
        console.error(`  [ERROR] Failed to write tune ${label}:`, err)
        errors++
        continue
      }
    }

    processed++
    console.log()
  }

  console.log(`\nDone. Processed: ${processed}, Skipped (already migrated): ${skipped}, Errors: ${errors}`)

  await pgClient.end()
  process.exit(errors > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
