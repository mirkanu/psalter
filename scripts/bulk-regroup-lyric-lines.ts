/**
 * Bulk-regroup psalm_versions stanzas whose line count exceeds the meter's
 * expected line count. Mirrors the editor's runtime regroupLinesToMeter
 * helper, but persists the result so the public NotationRenderer + audio
 * playback also see the meter-aligned structure.
 *
 * Algorithm per stanza:
 *   - Skip if line count <= expected line count
 *   - Syllabify each line; accumulate adjacent lines greedily until the
 *     syllable sum is within ±2 of expected[i]
 *   - Merge text via " " join; preserve bibleVerseRef of the FIRST source
 *     line in each merged group; preserve any pre-existing per-line
 *     syllables override only if the merged group is a 1-to-1 (no-op).
 *
 * pg_dump backup before write. Dry-run by default; pass --apply to write.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'
import { syllabifyForAbc } from '../src/lib/lyrics'
import { expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'

const APPLY = process.argv.includes('--apply')
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:psalter_secure_2024@localhost:5435/psalter'

interface RawLine { text?: string; syllables?: string[]; bibleVerseRef?: number }
interface RawStanza { index?: number; lines?: RawLine[] }

function backupTables(tag: string): string {
  const dir = resolve(process.cwd(), 'backups')
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, `bulk-regroup-${tag}.sql`)
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

function lineSylCount(line: RawLine): number {
  if (Array.isArray(line.syllables) && line.syllables.length > 0) return line.syllables.length
  return syllabifyForAbc(line.text ?? '').split(/\s+/).filter(Boolean).length
}

function regroupStanza(stanza: RawStanza, expected: number[]): RawStanza | null {
  if (!Array.isArray(stanza.lines)) return null
  if (stanza.lines.length <= expected.length) return null

  const TOL = 2
  const merged: RawLine[] = []
  let cursor = 0
  for (let i = 0; i < expected.length; i++) {
    const target = expected[i]
    if (cursor >= stanza.lines.length) return null
    const group: RawLine[] = []
    let sum = 0
    while (cursor < stanza.lines.length) {
      const line = stanza.lines[cursor]
      group.push(line)
      sum += lineSylCount(line)
      cursor++
      if (sum >= target - TOL && sum <= target + TOL) break
      if (sum > target + TOL) break
    }
    if (group.length === 1) {
      merged.push(group[0])
    } else {
      merged.push({
        text: group.map((l) => (l.text ?? '').trim()).filter(Boolean).join(' '),
        ...(group[0].bibleVerseRef !== undefined ? { bibleVerseRef: group[0].bibleVerseRef } : {}),
        // Per-line syllables don't carry over cleanly on merge — drop.
      })
    }
  }
  if (cursor < stanza.lines.length) return null
  if (merged.length !== expected.length) return null
  return { ...stanza, lines: merged }
}

async function main() {
  const sql = postgres(DB_URL)

  const tag = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = APPLY ? backupTables(tag) : '(dry-run — no backup written)'
  console.log(`Backup: ${backupPath}`)

  const pvRows = await sql<{
    id: number
    meter: string | null
    lyricsStructured: RawStanza[] | null
  }[]>`
    SELECT id, meter, lyrics_structured AS "lyricsStructured"
    FROM psalm_versions
    WHERE meter IS NOT NULL AND lyrics_structured IS NOT NULL
  `

  let pvTouched = 0
  let stanzasTouched = 0
  let pvSkipped = 0
  for (const pv of pvRows) {
    const expected = expectedSyllablesByLine(pv.meter)
    if (!expected) { pvSkipped++; continue }
    const ls = pv.lyricsStructured
    if (!Array.isArray(ls) || ls.length === 0) { pvSkipped++; continue }

    let touched = false
    const newStanzas: RawStanza[] = ls.map((stanza) => {
      const r = regroupStanza(stanza, expected)
      if (r === null) return stanza
      touched = true
      stanzasTouched++
      return r
    })
    if (!touched) continue
    pvTouched++
    if (APPLY) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sql`UPDATE psalm_versions SET lyrics_structured = ${sql.json(newStanzas as any)} WHERE id = ${pv.id}`
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────')
  console.log(`psalm_versions  ${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${pvTouched}  (${stanzasTouched} stanzas regrouped)`)
  console.log(`                skipped (no meter/data)        ${pvSkipped}`)
  console.log('────────────────────────────────────────────────────')
  if (!APPLY) console.log('\nDry-run — pass --apply to actually write.')

  await sql.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
