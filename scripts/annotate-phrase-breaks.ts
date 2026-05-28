#!/usr/bin/env npx tsx
/**
 * Backfill `% PHRASE_BREAK` markers into existing tunes.abc_notation rows
 * (Phase 04.9.2 Plan 02, D-01 / D-02). Per D-01, phrase boundaries are
 * computed ONCE at import time; this script is the import for the existing
 * dataset (Phase 4.9 left ~75 rows un-annotated).
 *
 * Idempotent: rows already containing `% PHRASE_BREAK` are skipped by default.
 *
 * Usage:
 *   npx tsx scripts/annotate-phrase-breaks.ts            # apply all eligible rows
 *   npx tsx scripts/annotate-phrase-breaks.ts --dry-run  # print plan, no writes
 *   npx tsx scripts/annotate-phrase-breaks.ts --overwrite# re-annotate rows that already have a marker
 */

import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, isNotNull, not, like } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { phrasesForMeter } from '../src/lib/abc-phrase-meter-map'

// ─── Pure helper (exported for unit tests) ───────────────────────────────────

/**
 * True iff a body line is an ABC info-field line (e.g. `w:` lyrics, `V:` voice,
 * `K:` key, `M:` meter, …). ABC info fields are single ASCII letters followed
 * by `:` at the start of the line. These lines may contain `|` (notably `w:`
 * lyric lines, where `|` aligns syllables to barlines) so they MUST NOT be
 * counted as music lines for phrase splitting.
 */
function isInfoFieldLine(line: string): boolean {
  return /^\s*[A-Za-z]:/.test(line)
}

/**
 * Count note heads in an ABC music fragment.
 * Excludes rests (z, x, Z), chord brackets (counts each [..] as 1),
 * grace notes {..}, text annotations "...", decorations !...!,
 * and tied continuations (note after '-').
 *
 * Exported so `scripts/audit-phrase-breaks.ts` and Plan 02 migration can re-use it.
 */
export function countNoteHeads(abc: string): number {
  // Strip info fields (w:, V:, K:, etc.)
  const musicOnly = abc
    .split('\n')
    .filter((l) => !isInfoFieldLine(l))
    .join(' ')
  // Strip grace note groups {..}, text annotations "..", decorations !..!
  const stripped = musicOnly
    .replace(/\{[^}]*\}/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/![^!]*!/g, '')
  // Count chord brackets as 1 note head each, then remove them
  // (so letters inside don't double-count)
  const chordCount = (stripped.match(/\[[^\]]+\]/g) ?? []).length
  const noChords = stripped.replace(/\[[^\]]+\]/g, '')
  // Match bare note heads: optional accidentals (=^_), note letter (not z/x/Z),
  // optional octave (',), optional duration
  const notePattern = /[=^_]?[A-Ga-g][',]*\d*/g
  const noteCount = (noChords.match(notePattern) ?? []).length
  // Subtract tied continuation notes: any note immediately following '-'
  const tieCount = (noChords.match(/-(?=[=^_]?[A-Ga-g])/g) ?? []).length
  return chordCount + noteCount - tieCount
}

/**
 * Insert (n-1) `% PHRASE_BREAK` markers into the music body of an ABC string,
 * dividing the music into n roughly-equal phrases.
 *
 * Pure function. No DB, no fs, no env.
 *
 * Algorithm:
 *   1. n <= 1 → return input unchanged.
 *   2. Input already contains `% PHRASE_BREAK` → return unchanged (idempotent).
 *   3. Locate K: line. If absent → return unchanged (cannot annotate safely).
 *   4. Body = lines after K:. Music lines = lines containing '|' that are NOT
 *      ABC info fields (`w:` lyrics, `V:` voice, etc.).
 *   5. If we have >= n music lines: distribute music lines into n chunks
 *      (line-based split — preferred, keeps stave boundaries intact).
 *   6. Else if exactly one music line with enough internal barlines: distribute
 *      barline-delimited measure tokens into n chunks and splice markers
 *      mid-line (single-line-body fallback for compact ABC sources).
 *   7. Else return unchanged (cannot split cleanly).
 *
 * For Scottish Psalter tunes, music lines roughly correspond to staff lines /
 * lyrical lines (D-04). Splitting on music-line boundaries is the simplest
 * approximation of "split where the lyric lines break"; the mid-line fallback
 * applies the same idea (equal measure groups) to tunes whose entire body has
 * been collapsed onto one physical line.
 */
export function insertPhraseBreaks(abc: string, n: number): string {
  if (n <= 1) return abc
  if (abc.includes('% PHRASE_BREAK')) return abc

  const lines = abc.split('\n')
  const kIdx = lines.findIndex((l) => /^K:/.test(l.trim()))
  if (kIdx === -1) return abc

  const header = lines.slice(0, kIdx + 1)
  const body = lines.slice(kIdx + 1)

  // Music line = contains a bar separator AND is not an ABC info field
  // (w:, V:, etc. — these can contain `|` for lyric alignment).
  const musicLineIndices = body
    .map((l, i) => (l.includes('|') && !isInfoFieldLine(l) ? i : -1))
    .filter((i) => i !== -1)

  // ─── Path A: multi-music-line body — split on music-line boundaries ────────
  if (musicLineIndices.length >= n) {
    const chunkSize = Math.floor(musicLineIndices.length / n)
    const remainder = musicLineIndices.length % n
    const breakIndices: number[] = []
    let consumed = 0
    for (let k = 0; k < n - 1; k++) {
      consumed += chunkSize + (k < remainder ? 1 : 0)
      breakIndices.push(musicLineIndices[consumed - 1])
    }

    const newBody: string[] = []
    for (let i = 0; i < body.length; i++) {
      newBody.push(body[i])
      if (breakIndices.includes(i)) newBody.push('% PHRASE_BREAK')
    }
    return [...header, ...newBody].join('\n')
  }

  // ─── Path B: single-music-line body — mid-line barline split (fallback) ────
  // Some Airtable-sourced tunes (e.g. Old 100th, Effingham, Walton) have their
  // entire music body on one physical line. We split that line at internal
  // barline positions so the must-have ("every eligible row gets >=1 marker")
  // can still be satisfied. Phrase-break markers MUST sit on their own line
  // (the consumer regex uses /m flag), so we wrap the splice in newlines.
  if (musicLineIndices.length !== 1) return abc

  const musicLineIdx = musicLineIndices[0]
  const musicLine = body[musicLineIdx]

  // Find candidate split positions: positions of `|` characters that are NOT
  // followed/preceded by `|` (so we treat `||` as a single separator), and not
  // the trailing end-of-piece marker `|]`. Each `|` is a measure boundary; we
  // pick (n-1) positions roughly evenly spaced across them.
  const barPositions: number[] = []
  for (let i = 0; i < musicLine.length; i++) {
    if (musicLine[i] !== '|') continue
    // Skip second char of a `||` pair (we keep the first).
    if (i > 0 && musicLine[i - 1] === '|') continue
    // Skip trailing `|]` end-of-piece marker.
    if (musicLine[i + 1] === ']') continue
    barPositions.push(i)
  }
  // The leading bar (if the line starts with `|`) is not a measure boundary,
  // and the very last bar (if followed only by whitespace / end-of-line) is
  // the closing barline — drop both as splice candidates.
  const internalBars = barPositions.filter((p, idx) => {
    if (idx === 0 && /^\s*$/.test(musicLine.slice(0, p))) return false
    if (/^[|\s]*$/.test(musicLine.slice(p + 1))) return false
    return true
  })
  if (internalBars.length < n - 1) return abc

  // Distribute splice points across internal bar positions.
  // We want (n-1) markers at roughly equal positions: pick indices
  // floor(internalBars.length * k / n) for k = 1..n-1.
  const splicePositions: number[] = []
  for (let k = 1; k < n; k++) {
    const idx = Math.floor((internalBars.length * k) / n) - 1
    const clamped = Math.max(0, Math.min(internalBars.length - 1, idx))
    // Splice AFTER the chosen barline character (so the bar belongs to the
    // preceding phrase). Position is `internalBars[clamped] + 1`.
    splicePositions.push(internalBars[clamped] + 1)
  }
  // De-duplicate (cheap guard in case rounding collides) and sort.
  const unique = Array.from(new Set(splicePositions)).sort((a, b) => a - b)
  if (unique.length < n - 1) return abc

  // Build the spliced line: walk left-to-right, inserting `\n% PHRASE_BREAK\n`
  // at each splice position.
  let spliced = ''
  let cursor = 0
  for (const pos of unique) {
    spliced += musicLine.slice(cursor, pos) + '\n% PHRASE_BREAK\n'
    cursor = pos
    // Trim leading whitespace on the next chunk so the marker doesn't sit
    // immediately before a leading space that visually disconnects it.
    while (cursor < musicLine.length && musicLine[cursor] === ' ') cursor++
  }
  spliced += musicLine.slice(cursor)

  const newBody = [...body]
  // Replace the single music line with the spliced multi-line block.
  newBody.splice(musicLineIdx, 1, ...spliced.split('\n'))
  return [...header, ...newBody].join('\n')
}

// ─── CLI / main loop ─────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const OVERWRITE = args.includes('--overwrite')

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const pgClient = postgres(process.env.DATABASE_URL!)
  const db = drizzle({ client: pgClient, schema })

  console.log(`Running ${DRY_RUN ? '[DRY RUN]' : '[LIVE]'}${OVERWRITE ? ' [OVERWRITE]' : ''}`)

  // Build query: always require abc_notation; default mode also excludes rows
  // that already contain the marker (idempotency).
  const whereClause = OVERWRITE
    ? isNotNull(schema.tunes.abcNotation)
    : and(
        isNotNull(schema.tunes.abcNotation),
        not(like(schema.tunes.abcNotation, '%% PHRASE_BREAK%')),
      )

  const rows = await db.select().from(schema.tunes).where(whereClause)
  console.log(`Found ${rows.length} candidate row(s)`)

  let updated = 0
  let skipped = 0

  for (const t of rows) {
    const n = phrasesForMeter(t.meter)
    if (n <= 1) {
      console.log(`  - skip ${t.name} (${t.meter ?? 'no meter'}): n=1`)
      skipped++
      continue
    }

    let source = t.abcNotation!
    if (OVERWRITE) {
      // Strip any existing markers + collapse the resulting blank lines so the
      // pure helper re-annotates from a clean slate.
      source = source.replace(/^\s*%\s*PHRASE_BREAK\s*$/gm, '').replace(/\n\n+/g, '\n')
    }

    const updatedAbc = insertPhraseBreaks(source, n)
    if (updatedAbc === source) {
      console.log(`  - skip ${t.name} (${t.meter}): annotation unsafe (no K:, too few measures, or already marked)`)
      skipped++
      continue
    }

    if (DRY_RUN) {
      console.log(`  ✓ [dry] ${t.name} (${t.meter}) -> ${n} phrases`)
    } else {
      await db
        .update(schema.tunes)
        .set({ abcNotation: updatedAbc })
        .where(eq(schema.tunes.id, t.id))
      console.log(`  ✓ ${t.name} (${t.meter}) -> ${n} phrases`)
    }
    updated++
  }

  console.log(
    `\nSummary: ${updated} annotated, ${skipped} skipped, ${rows.length} total candidates`,
  )
  await pgClient.end()
}

// Only run main() when invoked directly (not when imported by tests). Compare
// the resolved entry script path to this module's path.
const isEntry = (() => {
  try {
    const thisFile = realpathSync(fileURLToPath(import.meta.url))
    const argvFile = process.argv[1] ? realpathSync(process.argv[1]) : ''
    return thisFile === argvFile
  } catch {
    return false
  }
})()

if (isEntry) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
