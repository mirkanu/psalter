/**
 * One-shot backfill: parse every `psalm_versions.lyrics_imported_raw` into
 * `lyrics_structured` (Phase 04.9.6 Plan 03 Task 3/4, D-04 / D-05 / D-15).
 *
 * Per-row gate:
 *   1. parseLyrics() returns ok → continue
 *   2. serialiseLyrics(parsed) round-trips back to the raw blob (modulo
 *      whitespace) → continue. Strict gate per D-05.
 *   3. UPDATE lyrics_structured.
 *
 * Any failure at step 1 or 2 is quarantined and appended to
 *   .planning/phases/04.9.6-psalter-alignment-implementation/parse-failures.md
 * Quarantined rows keep their NULL lyrics_structured — the renderer continues
 * to use the legacy `lyrics_imported_raw` path for them (D-15).
 *
 * Usage:
 *   npx tsx scripts/parse-lyrics-structured.ts            # apply
 *   npx tsx scripts/parse-lyrics-structured.ts --dry-run  # report, no writes
 */
import 'dotenv/config'
import { writeFileSync, mkdirSync, realpathSync } from 'fs'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { eq, isNotNull } from 'drizzle-orm'
import { db } from '../src/db'
import { psalmVersions } from '../src/db/schema'
import {
  parseLyrics,
  serialiseLyrics,
  type StructuredLyrics,
} from '../src/lib/lyrics-structured'

/**
 * Whitespace-normalising comparator used for the round-trip equivalence check.
 *
 * Mirrors the asymmetric whitespace rule documented on `parseLyrics` (RESEARCH
 * §"Whitespace tolerance is asymmetric"): parser tolerates `\d+\s*` on input,
 * serialiser emits `\d+\S`. Both sides are normalised through this function
 * so trailing whitespace, blank-line runs, and `digit-space-letter` vs
 * `digit-letter` reduce to the same canonical form.
 *
 * Exported for the sibling unit test (D-05 corpus round-trip).
 */
export function normalise(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .replace(/\n\s*\n+/g, '\n\n')
    .replace(/[ \t]+$/gm, '')
    .replace(/(\d+)\s+(?=[A-Za-z])/g, '$1')
    .trim()
}

export interface ParseFailure {
  id: number
  psalterNumber: string | null
  reason: string
  line?: number
}

const REPORT_PATH =
  '.planning/phases/04.9.6-psalter-alignment-implementation/parse-failures.md'

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  const rows = await db
    .select()
    .from(psalmVersions)
    .where(isNotNull(psalmVersions.lyricsImportedRaw))

  let parsed = 0
  let quarantined = 0
  const failures: ParseFailure[] = []

  for (const r of rows) {
    const blob = r.lyricsImportedRaw ?? ''
    const result = parseLyrics(blob, r.meter)

    if (!result.ok) {
      failures.push({
        id: r.id,
        psalterNumber: r.psalterNumber,
        reason: result.reason,
        line: result.line,
      })
      quarantined++
      continue
    }

    // Strict round-trip gate (D-05) — modulo whitespace normalisation only.
    const reSerialised = serialiseLyrics(result.stanzas)
    if (normalise(reSerialised) !== normalise(blob)) {
      failures.push({
        id: r.id,
        psalterNumber: r.psalterNumber,
        reason: 'round-trip mismatch',
      })
      quarantined++
      continue
    }

    if (!dryRun) {
      await db
        .update(psalmVersions)
        .set({ lyricsStructured: result.stanzas as StructuredLyrics })
        .where(eq(psalmVersions.id, r.id))
    }
    parsed++
  }

  // Emit parse-failures.md (overwrite every run — single canonical report).
  mkdirSync(dirname(REPORT_PATH), { recursive: true })
  const header = [
    `# Parse Failures — Phase 04.9.6`,
    ``,
    `Generated: ${new Date().toISOString()}`,
    `Mode: ${dryRun ? 'DRY-RUN (no DB writes)' : 'LIVE'}`,
    `Total rows: ${rows.length}`,
    `Parsed: ${parsed}`,
    `Quarantined: ${quarantined}`,
    ``,
    `## Quarantined psalm-versions`,
    ``,
  ]
  const body = failures.length
    ? failures.map(
        (f) =>
          `### Parse failure: psalm-version id=${f.id} (Psalm ${f.psalterNumber ?? '?'})\n\n- Reason: ${f.reason}${f.line !== undefined ? `\n- Offending line index: ${f.line}` : ''}\n`,
      )
    : [`_None — every row round-tripped cleanly._\n`]
  writeFileSync(REPORT_PATH, [...header, ...body].join('\n'))

  console.log(
    `Parse complete: ${parsed} parsed, ${quarantined} quarantined.${dryRun ? ' (DRY-RUN — no DB writes)' : ''}`,
  )
  console.log(`Report: ${REPORT_PATH}`)
  process.exit(0)
}

// Run guard — only invoke main() when this file is the entry script. This
// mirrors `scripts/annotate-phrase-breaks.ts` so the unit test can import
// `normalise` without triggering a DB connection.
const invokedDirectly = (() => {
  try {
    return (
      realpathSync(fileURLToPath(import.meta.url)) ===
      realpathSync(process.argv[1] ?? '')
    )
  } catch {
    return false
  }
})()

if (invokedDirectly) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
