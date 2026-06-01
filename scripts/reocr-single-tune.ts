/**
 * One-shot re-OCR for a single tune. Usage:
 *   npx tsx scripts/reocr-single-tune.ts <TuneName>
 *   npx tsx scripts/reocr-single-tune.ts <TuneName> --apply
 *
 * Without --apply: dry-run, prints new OCR JSON + new ABC, no DB write.
 * With --apply:    backs up the tune row to ./backups/, then writes new
 *                  solfege_ocr_text and abc_notation to the DB.
 *
 * Skips tunes that have manual editor saves (embedded w-lines in ABC).
 */

import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import * as path from 'node:path'
import { eq } from 'drizzle-orm'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { transcribeOnly } from '../src/lib/ocr-solfege-v2'
import { solFaToAbc } from '../src/lib/solfege-parser'
import { slugifyTuneName } from './download-tunes'

const TUNES_DIR = path.join(process.cwd(), 'public/tunes')

function findSolfegePages(slug: string): string[] {
  const pages: string[] = []
  let i = 0
  while (true) {
    const p = path.join(TUNES_DIR, `${slug}-solfege-${i}.jpg`)
    if (!existsSync(p)) break
    pages.push(p)
    i++
  }
  return pages
}

function backupTune(name: string, tag: string): string {
  const dir = path.resolve(process.cwd(), 'backups')
  mkdirSync(dir, { recursive: true })
  const out = path.resolve(dir, `reocr-${slugifyTuneName(name)}-${tag}.sql`)
  const res = spawnSync('docker', [
    'exec', '-i', 'psalter-db',
    'pg_dump', '-U', 'postgres', '-d', 'psalter',
    '-t', 'tunes', '--data-only', '--column-inserts',
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (res.status !== 0) throw new Error(`pg_dump failed: ${res.stderr}`)
  writeFileSync(out, res.stdout)
  return out
}

async function main() {
  const args = process.argv.slice(2)
  const APPLY = args.includes('--apply')
  const modelArg = args.find((a) => a.startsWith('--model='))
  const MODEL = modelArg ? modelArg.split('=')[1] : undefined
  const tuneName = args.find((a) => !a.startsWith('--'))
  if (!tuneName) {
    console.error('Usage: npx tsx scripts/reocr-single-tune.ts <TuneName> [--apply]')
    process.exit(1)
  }

  const rows = await db.select().from(tunes).where(eq(tunes.name, tuneName))
  if (rows.length === 0) {
    console.error(`Tune "${tuneName}" not found`)
    process.exit(1)
  }
  const tune = rows[0]
  console.log(`Tune: ${tune.name} (id=${tune.id}, meter=${tune.meter})`)

  if (tune.abcNotation && /^\s*w:/m.test(tune.abcNotation)) {
    console.error('Refusing to re-OCR: this tune has embedded w-lines (manual editor saves would be lost). Clear them via the editor first.')
    process.exit(1)
  }

  const slug = slugifyTuneName(tune.name)
  const pages = findSolfegePages(slug)
  if (pages.length === 0) {
    console.error(`No solfège JPG found at ${TUNES_DIR}/${slug}-solfege-*.jpg`)
    process.exit(1)
  }
  console.log(`Found ${pages.length} solfège page(s):`)
  for (const p of pages) console.log(`  ${p}`)

  console.log(`\nCalling Claude Vision (${MODEL ?? 'haiku-4-5 default'})…`)
  const result = await transcribeOnly(tune.name, pages, MODEL ? { model: MODEL } : {})
  const newOcrJson = JSON.stringify({
    doh: result.doh,
    time: result.time,
    soprano: result.soprano,
    alto: result.alto,
    tenor: result.tenor,
    bass: result.bass,
    ...(result.lah ? { lah: result.lah } : {}),
    ...(result.mode ? { mode: result.mode } : {}),
  })
  console.log('\n--- New OCR JSON ---')
  console.log(newOcrJson)

  console.log('\n--- Re-deriving ABC from soprano ---')
  const abcRes = solFaToAbc(result.soprano, result.doh, result.time, tune.name, result.lah, result.mode)
  console.log(abcRes.abc)
  if (abcRes.warnings.length > 0) {
    console.log('\nABC warnings:', abcRes.warnings)
  }

  if (!APPLY) {
    console.log('\n(dry-run — pass --apply to write to DB)')
    process.exit(0)
  }

  const tag = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = backupTune(tune.name, tag)
  console.log(`\nBackup: ${backupPath}`)

  await db
    .update(tunes)
    .set({ solfegeOcrText: newOcrJson, abcNotation: abcRes.abc })
    .where(eq(tunes.id, tune.id))
  console.log(`✓ Updated tune "${tune.name}".`)
}

main().catch((e) => { console.error(e); process.exit(1) })
