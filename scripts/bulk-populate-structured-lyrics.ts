/**
 * Populate psalm_versions.lyrics_structured for rows where it's NULL.
 *
 * The existing src/lib/lyrics-structured.ts parser quarantines blobs whose
 * total line count isn't an integer multiple of the meter's expected per-
 * stanza line count (F-6 rule). Tunes like Darwall (66 66 88, expects 6
 * lines/stanza) but Airtable supplies 8 short Bible-verse-broken lines
 * per stanza → 8 % 6 = 2 → quarantine → NULL.
 *
 * This script handles those cases by:
 *   1. Splitting lyrics_imported_raw into stanza BLOCKS on double-newlines
 *      (same as parseLyrics does).
 *   2. For each block: collect lines, then if line_count > expected_count,
 *      greedily regroup adjacent lines until syllable sums match the
 *      meter's expected per-line shape (±2 tolerance).
 *   3. Write the structured result to lyrics_structured.
 *
 * pg_dump backup before write. --apply to commit, dry-run otherwise.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'
import { syllabifyForAbc } from '../src/lib/lyrics'
import { expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'

const APPLY = process.argv.includes('--apply')
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:psalter_secure_2024@localhost:5435/psalter'

interface SourceLine { text: string; verseRef?: number }
interface OutLine { text: string; bibleVerseRef?: number }
interface OutStanza { index: number; lines: OutLine[] }

function backupTables(tag: string): string {
  const dir = resolve(process.cwd(), 'backups')
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, `populate-structured-${tag}.sql`)
  const res = spawnSync('docker', [
    'exec', '-i', 'psalter-db',
    'pg_dump', '-U', 'postgres', '-d', 'psalter',
    '-t', 'psalm_versions',
    '--data-only', '--column-inserts',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (res.status !== 0) throw new Error(`pg_dump failed: ${res.stderr}`)
  writeFileSync(out, res.stdout)
  return out
}

function syllableCount(text: string): number {
  return syllabifyForAbc(text).split(/\s+/).filter(Boolean).length
}

function parseRawBlock(block: string): SourceLine[] {
  const out: SourceLine[] = []
  for (const line of block.split(/\n/)) {
    const trimmed = line.replace(/[ \t]+$/, '').trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) continue  // colophon
    const m = trimmed.match(/^(\d+)\s*(\S.*)$/)
    if (m) out.push({ text: m[2], verseRef: parseInt(m[1], 10) })
    else out.push({ text: trimmed })
  }
  return out
}

function regroupBlock(lines: SourceLine[], expected: number[]): OutLine[] | null {
  if (lines.length === 0) return null
  if (lines.length < expected.length) return null
  // Equal-length fast path: only valid when EACH line's syllable count
  // matches its position in expected (within tolerance). Otherwise we'd
  // accept a verbatim block when the lines actually need merging.
  const TOL_FAST = 2
  if (lines.length === expected.length) {
    const fitsAsIs = lines.every((l, i) => {
      const c = syllableCount(l.text)
      return c >= expected[i] - TOL_FAST && c <= expected[i] + TOL_FAST
    })
    if (fitsAsIs) {
      return lines.map((l) => {
        const o: OutLine = { text: l.text }
        if (l.verseRef !== undefined) o.bibleVerseRef = l.verseRef
        return o
      })
    }
    return null  // force the outer loop to try larger `take`
  }

  const TOL = 2
  const out: OutLine[] = []
  let cursor = 0
  for (let i = 0; i < expected.length; i++) {
    const target = expected[i]
    if (cursor >= lines.length) return null
    const group: SourceLine[] = []
    let sum = 0
    while (cursor < lines.length) {
      const ln = lines[cursor]
      group.push(ln)
      sum += syllableCount(ln.text)
      cursor++
      if (sum >= target - TOL && sum <= target + TOL) break
      if (sum > target + TOL) break
    }
    if (group.length === 1) {
      const o: OutLine = { text: group[0].text }
      if (group[0].verseRef !== undefined) o.bibleVerseRef = group[0].verseRef
      out.push(o)
    } else {
      const merged: OutLine = { text: group.map((g) => g.text).join(' ') }
      if (group[0].verseRef !== undefined) merged.bibleVerseRef = group[0].verseRef
      out.push(merged)
    }
  }
  if (cursor < lines.length) return null
  if (out.length !== expected.length) return null
  return out
}

async function main() {
  const sql = postgres(DB_URL)

  const tag = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = APPLY ? backupTables(tag) : '(dry-run — no backup written)'
  console.log(`Backup: ${backupPath}`)

  const pvRows = await sql<{
    id: number
    meter: string | null
    lyricsImportedRaw: string | null
  }[]>`
    SELECT id, meter, lyrics_imported_raw AS "lyricsImportedRaw"
    FROM psalm_versions
    WHERE lyrics_structured IS NULL
      AND meter IS NOT NULL
      AND lyrics_imported_raw IS NOT NULL
  `

  console.log(`Candidates with NULL lyrics_structured: ${pvRows.length}`)

  let updated = 0
  let skipped = 0
  let failed = 0
  for (const pv of pvRows) {
    const expected = expectedSyllablesByLine(pv.meter)
    if (!expected) { skipped++; continue }
    // Flatten ALL lines across blocks first. Some psalms (Darwall) split a
    // single metrical stanza across MULTIPLE blocks (each Bible-verse-pair
    // gets its own block). The block boundaries don't align with metrical
    // stanza boundaries, so we must work on the flat line stream.
    const allLines: SourceLine[] = []
    for (const block of pv.lyricsImportedRaw!.split(/\n\s*\n/)) {
      for (const l of parseRawBlock(block)) allLines.push(l)
    }
    if (allLines.length === 0) { skipped++; continue }

    // For each metrical stanza, peel off enough source lines that they
    // regroup into exactly `expected.length` output lines.
    const stanzas: OutStanza[] = []
    let allOk = true
    let cursor = 0
    while (cursor < allLines.length) {
      // Determine the minimum number of source lines needed to form one
      // metrical stanza. Try increasing source-line counts until regroupBlock
      // succeeds. Cap at 2× expected.length to avoid runaway consumption.
      let consumed = 0
      let grouped: OutLine[] | null = null
      for (let take = expected.length; take <= Math.min(allLines.length - cursor, expected.length * 2); take++) {
        const slice = allLines.slice(cursor, cursor + take)
        grouped = regroupBlock(slice, expected)
        if (grouped !== null) { consumed = take; break }
      }
      if (grouped === null || consumed === 0) { allOk = false; break }
      stanzas.push({ index: stanzas.length, lines: grouped })
      cursor += consumed
    }
    if (!allOk || stanzas.length === 0) { failed++; continue }
    updated++
    console.log(`pv #${pv.id} (${pv.meter}): ${allLines.length} source lines → ${stanzas.length} stanzas × ${expected.length} lines`)
    if (APPLY) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sql`UPDATE psalm_versions SET lyrics_structured = ${sql.json(stanzas as any)} WHERE id = ${pv.id}`
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────')
  console.log(`${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${updated}`)
  console.log(`skipped (no meter / no raw)   ${skipped}`)
  console.log(`failed (couldn't regroup)     ${failed}`)
  console.log('────────────────────────────────────────────────────')
  if (!APPLY) console.log('\nDry-run — pass --apply to write.')

  await sql.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
