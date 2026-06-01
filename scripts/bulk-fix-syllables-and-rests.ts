/**
 * Bulk-fix pipeline for Phase 04.11 syllable + z-rest issues.
 *
 * Two corrections in one pass (one DB backup):
 *
 *   A) psalm_versions.syllables_override — for each version whose
 *      syllabifyForAbc output disagrees with its meter's per-line shape,
 *      run forceMatchMeterShape and persist the result.
 *
 *   B) tunes.abc_notation — for each tune whose ABC contains z-rests AND
 *      has NO embedded w-lines (i.e. no manual editor saves to preserve),
 *      re-run solFaToAbc on the OCR raw soprano and replace the ABC.
 *      The parser's comma-subdivision bug (commit b9ebe18) produced
 *      spurious z2 rests; this re-renders affected tunes from the OCR.
 *
 * Backup: writes a pg_dump of `psalm_versions` and `tunes` to
 * ./backups/bulk-fix-{ISO}.sql before any UPDATE. Restore = psql.
 *
 * Dry-run by default. Pass --apply to actually write.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'
import { syllabifyForAbc } from '../src/lib/lyrics'
import { checkAgainstMeter, expectedSyllablesByLine } from '../src/lib/meter-syllable-shape'
import { forceMatchMeterShape } from '../src/lib/force-match-meter-shape'
import { solFaToAbc } from '../src/lib/solfege-parser'

interface LyricsStructured {
  number?: string
  lines?: Array<{ text?: string }>
}

const APPLY = process.argv.includes('--apply')
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:psalter_secure_2024@localhost:5435/psalter'

function backupTables(tag: string): string {
  const dir = resolve(process.cwd(), 'backups')
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, `bulk-fix-${tag}.sql`)
  // Use pg_dump via the docker container to avoid client/server version mismatch
  const res = spawnSync('docker', [
    'exec', '-i', 'psalter-db',
    'pg_dump', '-U', 'postgres', '-d', 'psalter',
    '-t', 'psalm_versions', '-t', 'tunes',
    '--data-only', '--column-inserts',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (res.status !== 0) {
    throw new Error(`pg_dump failed (exit ${res.status}): ${res.stderr}`)
  }
  writeFileSync(out, res.stdout)
  return out
}

async function main() {
  const sql = postgres(DB_URL)

  const tag = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = APPLY ? backupTables(tag) : '(dry-run — no backup written)'
  console.log(`Backup: ${backupPath}`)

  // ─────────────────────────────────────────────────────────────────────
  // A) Write per-line syllable hand-overrides into lyrics_structured.
  //    For each line in each stanza whose syllabifier output doesn't match
  //    the meter's expected count, set line.syllables to a force-fitted
  //    array. The renderer (stanza-cycles.ts) already prefers line.syllables
  //    over syllabifyForAbc(line.text), so this propagates everywhere.
  //    Lines that already have a manual syllables override are left alone.
  // ─────────────────────────────────────────────────────────────────────
  interface RawLine { text?: string; syllables?: string[]; bibleVerseRef?: number }
  interface RawStanza { index?: number; lines?: RawLine[] }
  const pvRows = await sql<{
    id: number
    meter: string | null
    lyricsStructured: RawStanza[] | null
  }[]>`
    SELECT id, meter, lyrics_structured AS "lyricsStructured"
    FROM psalm_versions
    WHERE meter IS NOT NULL AND lyrics_structured IS NOT NULL
  `

  let pvFixed = 0
  let pvLinesFixed = 0
  let pvAlreadyOk = 0
  let pvNoExpected = 0
  let pvSkipped = 0
  for (const pv of pvRows) {
    const ls = pv.lyricsStructured
    if (!Array.isArray(ls) || ls.length === 0) { pvSkipped++; continue }
    const expected = expectedSyllablesByLine(pv.meter)
    if (!expected) { pvNoExpected++; continue }
    let touched = false
    let linesTouchedHere = 0
    const updatedStanzas: RawStanza[] = ls.map((stanza) => {
      if (!Array.isArray(stanza?.lines)) return stanza
      const newLines: RawLine[] = stanza.lines.map((line, lineIdx) => {
        if (Array.isArray(line.syllables) && line.syllables.length > 0) return line
        const text = (line?.text ?? '').trim()
        if (text.length === 0) return line
        const expCount = expected[lineIdx]
        if (expCount === undefined) return line
        const actualSyll = syllabifyForAbc(text).split(/\s+/).filter(Boolean)
        if (actualSyll.length === expCount) return line
        // Run force-match on a single-line array; pluck back the fixed line.
        const { fixed, adjusted } = forceMatchMeterShape([actualSyll], [expCount])
        if (!adjusted[0]) return line
        touched = true
        linesTouchedHere++
        return { ...line, syllables: fixed[0] }
      })
      return { ...stanza, lines: newLines }
    })
    if (!touched) { pvAlreadyOk++; continue }
    pvFixed++
    pvLinesFixed += linesTouchedHere
    if (APPLY) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await sql`UPDATE psalm_versions SET lyrics_structured = ${sql.json(updatedStanzas as any)} WHERE id = ${pv.id}`
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // B) tunes ABC re-render for z-rest tunes without embedded w-lines
  // ─────────────────────────────────────────────────────────────────────
  const tuneRows = await sql<{
    id: number
    name: string
    abcNotation: string
    solfegeOcrText: string | null
  }[]>`
    SELECT id, name, abc_notation AS "abcNotation", solfege_ocr_text AS "solfegeOcrText"
    FROM tunes
    WHERE abc_notation IS NOT NULL
      AND abc_notation ~ 'z[0-9]*'
      AND abc_notation !~ E'^\\\\s*w:'
  `

  let tunesFixed = 0
  let tunesSkipped = 0
  let tunesError = 0
  for (const t of tuneRows) {
    // Defensive: confirm no w-lines (the SQL regex is anchored differently).
    if (/^\s*w:/m.test(t.abcNotation)) { tunesSkipped++; continue }
    if (!t.solfegeOcrText) { tunesSkipped++; continue }
    try {
      const ocr = JSON.parse(t.solfegeOcrText) as {
        doh?: string; time?: string; lah?: string; mode?: string; soprano?: string
      }
      if (!ocr.soprano) { tunesSkipped++; continue }
      const result = solFaToAbc(
        ocr.soprano,
        ocr.doh ?? 'C',
        ocr.time ?? 'C',
        t.name,
        ocr.lah,
        ocr.mode,
      )
      if (!result.abc || result.abc.length < 10) { tunesError++; continue }
      // Only update if z-rests actually disappear
      if (/z[0-9]*/.test(result.abc.replace(/^[A-Za-z]:.*$/gm, ''))) {
        // Still has rests after re-rendering — leave alone (likely legitimate rests).
        tunesSkipped++
        continue
      }
      tunesFixed++
      if (APPLY) {
        await sql`UPDATE tunes SET abc_notation = ${result.abc} WHERE id = ${t.id}`
      }
    } catch (err) {
      console.error(`[error] ${t.name}: ${err instanceof Error ? err.message : err}`)
      tunesError++
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────')
  console.log(`psalm_versions:  ${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${pvFixed}  (${pvLinesFixed} lines touched)`)
  console.log(`                 already-ok            ${pvAlreadyOk}`)
  console.log(`                 no expected shape     ${pvNoExpected}`)
  console.log(`                 skipped (no stanzas)  ${pvSkipped}`)
  console.log(`tunes ABC:       ${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${tunesFixed}`)
  console.log(`                 skipped               ${tunesSkipped}`)
  console.log(`                 errors                ${tunesError}`)
  console.log('────────────────────────────────────────────────────')
  if (!APPLY) console.log('\nDry-run — pass --apply to actually write.')

  await sql.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
