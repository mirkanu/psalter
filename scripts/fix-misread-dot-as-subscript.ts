/**
 * Fix OCR misreads where a rhythmic-subdivision dot was transcribed as a
 * subscript "_1" — e.g., the JPG shows `l.,s` (l short, s next) but the
 * OCR produced `l_1,s` (interpreted as: lah-octave-down, then s).
 *
 * Heuristic: `[a-z]_1,[a-z]` is almost certainly a misread dot. A real
 * `_1` octave-shift appears at the END of a token (followed by colon /
 * bar / whitespace), never immediately before a comma+letter.
 *
 * Two-step: (1) strip the `_1` from solfege_ocr_text in all four voices
 * for matching tunes, (2) re-run solFaToAbc to regenerate abc_notation
 * (only for tunes without saved w-lines — manual edits are preserved).
 *
 * Backup: writes pg_dump to ./backups/fix-dot-subscript-{ISO}.sql before
 * any UPDATE. Dry-run by default; pass --apply to write.
 */

import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import postgres from 'postgres'
import { solFaToAbc } from '../src/lib/solfege-parser'

const APPLY = process.argv.includes('--apply')
const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:psalter_secure_2024@localhost:5435/psalter'

function backupTables(tag: string): string {
  const dir = resolve(process.cwd(), 'backups')
  mkdirSync(dir, { recursive: true })
  const out = resolve(dir, `fix-dot-subscript-${tag}.sql`)
  const res = spawnSync('docker', [
    'exec', '-i', 'psalter-db',
    'pg_dump', '-U', 'postgres', '-d', 'psalter',
    '-t', 'tunes',
    '--data-only', '--column-inserts',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (res.status !== 0) throw new Error(`pg_dump failed: ${res.stderr}`)
  writeFileSync(out, res.stdout)
  return out
}

// Strip `_1` (or `_2`, etc.) when it appears immediately before `,<letter>`.
// Conservative: keep the `_N` when it's at end of token (real octave shift).
function fixMisreadDots(ocrText: string): { fixed: string; changes: number } {
  let changes = 0
  const fixed = ocrText.replace(/([a-z])_\d+,([a-z])/g, (_m, before, after) => {
    changes++
    return `${before},${after}`
  })
  return { fixed, changes }
}

async function main() {
  const sql = postgres(DB_URL)

  const tag = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = APPLY ? backupTables(tag) : '(dry-run — no backup written)'
  console.log(`Backup: ${backupPath}`)

  const rows = await sql<{
    id: number
    name: string
    solfegeOcrText: string | null
    abcNotation: string | null
  }[]>`
    SELECT id, name, solfege_ocr_text AS "solfegeOcrText", abc_notation AS "abcNotation"
    FROM tunes
    WHERE solfege_ocr_text ~ '[a-z]_[0-9]+,[a-z]'
  `

  let ocrUpdated = 0
  let abcUpdated = 0
  let abcSkipped = 0
  let totalChanges = 0
  for (const r of rows) {
    if (!r.solfegeOcrText) continue
    const { fixed: fixedOcrJson, changes } = fixMisreadDots(r.solfegeOcrText)
    if (changes === 0) continue
    totalChanges += changes
    ocrUpdated++
    console.log(`${r.name}: ${changes} misreads found`)
    if (!APPLY) continue
    await sql`UPDATE tunes SET solfege_ocr_text = ${fixedOcrJson} WHERE id = ${r.id}`

    // Re-render ABC if (a) the tune has no embedded w-lines (no manual saves)
    // AND (b) we can parse the OCR JSON. Manual edits via the editor get
    // preserved.
    if (r.abcNotation && /^\s*w:/m.test(r.abcNotation)) { abcSkipped++; continue }
    try {
      const ocr = JSON.parse(fixedOcrJson) as {
        doh?: string; time?: string; lah?: string; mode?: string; soprano?: string
      }
      if (!ocr.soprano) { abcSkipped++; continue }
      const res = solFaToAbc(ocr.soprano, ocr.doh ?? 'C', ocr.time ?? 'C', r.name, ocr.lah, ocr.mode)
      if (!res.abc || res.abc.length < 10) { abcSkipped++; continue }
      await sql`UPDATE tunes SET abc_notation = ${res.abc} WHERE id = ${r.id}`
      abcUpdated++
    } catch (err) {
      console.error(`[error] ${r.name}: ${err instanceof Error ? err.message : err}`)
      abcSkipped++
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────')
  console.log(`OCR text  ${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${ocrUpdated}  (${totalChanges} misreads)`)
  console.log(`ABC       ${APPLY ? 'UPDATED' : 'WOULD UPDATE'}    ${abcUpdated}  (skipped ${abcSkipped})`)
  console.log('────────────────────────────────────────────────────')
  if (!APPLY) console.log('\nDry-run — pass --apply to actually write.')

  await sql.end()
}

main().catch((e) => { console.error(e); process.exit(1) })
