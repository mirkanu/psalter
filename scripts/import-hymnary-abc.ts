#!/usr/bin/env npx tsx
/**
 * Fetch MusicXML from Hymnary.org for all 47 known tunes, convert to ABC (soprano voice),
 * and write to tunes.abc_notation in the DB.
 *
 * Usage:
 *   npx tsx scripts/import-hymnary-abc.ts            # Import all, skip tunes already updated
 *   npx tsx scripts/import-hymnary-abc.ts --dry-run  # Show conversions without writing to DB
 *   npx tsx scripts/import-hymnary-abc.ts --overwrite # Re-import even if abc_notation exists
 *
 * Output: scripts/output/hymnary-import.json  (ABC results for review)
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { execSync } from 'node:child_process'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import { tunes } from '../src/db/schema'
import { HYMNARY_FETCH_IDS } from '../src/lib/hymnary-lookup'

const DRY_RUN  = process.argv.includes('--dry-run')
const OVERWRITE = process.argv.includes('--overwrite')

const sql = postgres(process.env.DATABASE_URL!)
const db = drizzle(sql)

const XML2ABC = path.join(process.cwd(), 'scripts/xml2abc.py')
const OUT_DIR  = path.join(process.cwd(), 'scripts/output')

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractMelodyVoice(fullAbc: string): string {
  const lines = fullAbc.split('\n')
  const output: string[] = []
  let inHeader = true
  let inV1Content = false

  for (const line of lines) {
    const t = line.trim()
    if (inHeader) {
      if (['X:', 'T:', 'L:', 'Q:'].some(p => t.startsWith(p))) output.push(line)
      else if (t.startsWith('M:')) output.push(t === 'M:none' ? 'M:4/4' : line)
      else if (t.startsWith('K:')) output.push(t === 'K:none' ? 'K:C' : line)
      else if (t.startsWith('V:1 ') || t === 'V:1') {
        output.push(line)
        if (t === 'V:1') { inHeader = false; inV1Content = true }
      }
    } else {
      if (t === 'V:1' || (t.startsWith('V:1') && !t.startsWith('V:1 '))) {
        output.push(line); inV1Content = true
      } else if (t.startsWith('V:')) {
        inV1Content = false
      } else if (inV1Content) {
        output.push(line)
      }
    }
  }
  return output.join('\n')
}

async function fetchAndConvert(tuneName: string, fetchId: number): Promise<{ abc: string; rawAbc: string }> {
  const res = await fetch(`https://hymnary.org/media/fetch/${fetchId}`)
  if (!res.ok) throw new Error(`Hymnary ${res.status} for fetch/${fetchId}`)
  const buf = Buffer.from(await res.arrayBuffer())

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hymnary-'))
  try {
    const xmlPath = path.join(tmpDir, 'score.xml')
    const isMxl = buf[0] === 0x50 && buf[1] === 0x4b
    let xmlContent: string

    if (isMxl) {
      const mxlPath = path.join(tmpDir, 'score.mxl')
      fs.writeFileSync(mxlPath, buf)
      const extractScript = path.join(tmpDir, 'extract.py')
      fs.writeFileSync(extractScript, [
        'import zipfile, sys',
        'with zipfile.ZipFile(sys.argv[1]) as z:',
        '    xml_files = [n for n in z.namelist() if n.endswith(".xml") and "META" not in n]',
        '    sys.stdout.buffer.write(z.read(xml_files[0]))',
      ].join('\n'))
      xmlContent = execSync(`python3 "${extractScript}" "${mxlPath}"`, { stdio: 'pipe', timeout: 10_000 }).toString('utf-8')
    } else {
      xmlContent = buf.toString('utf-8')
    }

    fs.writeFileSync(xmlPath, xmlContent)
    const rawAbc = execSync(`python3 "${XML2ABC}" "${xmlPath}"`, { stdio: 'pipe', timeout: 15_000 }).toString('utf-8')
    if (!rawAbc.includes('X:')) throw new Error('xml2abc produced no output')
    const abc = extractMelodyVoice(rawAbc)
    return { abc, rawAbc }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const tuneNames = Object.keys(HYMNARY_FETCH_IDS)
  console.log(`\nHymnary import — ${tuneNames.length} tunes${DRY_RUN ? ' [DRY RUN]' : ''}${OVERWRITE ? ' [OVERWRITE]' : ''}\n`)

  const results: Record<string, { fetchId: number; abc: string; status: string; error?: string }> = {}
  let imported = 0, skipped = 0, failed = 0

  for (const tuneName of tuneNames) {
    const fetchId = HYMNARY_FETCH_IDS[tuneName]
    process.stdout.write(`  ${tuneName.padEnd(24)} (fetch/${fetchId}) … `)

    // Look up tune in DB
    const rows = await db.select({ id: tunes.id, abcNotation: tunes.abcNotation })
      .from(tunes).where(eq(tunes.name, tuneName))
    if (!rows.length) {
      console.log('NOT IN DB')
      results[tuneName] = { fetchId, abc: '', status: 'not-in-db' }
      skipped++
      continue
    }
    const tune = rows[0]

    if (!OVERWRITE && tune.abcNotation) {
      console.log('skip (already has ABC)')
      results[tuneName] = { fetchId, abc: tune.abcNotation, status: 'skipped' }
      skipped++
      continue
    }

    try {
      const { abc } = await fetchAndConvert(tuneName, fetchId)
      results[tuneName] = { fetchId, abc, status: DRY_RUN ? 'dry-run' : 'imported' }

      if (!DRY_RUN) {
        await db.update(tunes).set({ abcNotation: abc }).where(eq(tunes.id, tune.id))
      }

      console.log(`OK  (${abc.split('\n').filter(l => l && !l.startsWith('%')).length} lines)`)
      imported++
    } catch (err) {
      const msg = String(err).slice(0, 120)
      console.log(`FAIL: ${msg}`)
      results[tuneName] = { fetchId, abc: '', status: 'error', error: msg }
      failed++
    }
  }

  const outPath = path.join(OUT_DIR, 'hymnary-import.json')
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2))

  console.log(`\n  Imported: ${imported}  Skipped: ${skipped}  Failed: ${failed}`)
  console.log(`  Results saved to ${outPath}\n`)
  await sql.end()
}

main().catch(e => { console.error(e); process.exit(1) })
