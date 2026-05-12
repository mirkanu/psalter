/**
 * Bulk OCR text extraction for all Hymnary tunes that don't yet have results.
 * Runs Claude Vision transcription and saves directly to DB.
 *
 * Usage: set -a; . .env; set +a; npx tsx scripts/bulk-ocr-text.ts
 */

import * as fs from 'node:fs'
import * as path from 'node:path'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq, inArray } from 'drizzle-orm'
import { tunes, tuneOcrResults } from '../src/db/schema'
import { transcribeOnly } from '../src/lib/ocr-solfege-v2'
import { HYMNARY_FETCH_IDS } from '../src/lib/hymnary-lookup'

const sql = postgres(process.env.DATABASE_URL!)
const db  = drizzle(sql)

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function collectPages(dir: string, slug: string, type: 'solfege' | 'staff'): string[] {
  const pages: string[] = []
  for (let i = 0; ; i++) {
    const p = path.join(dir, `${slug}-${type}-${i}.jpg`)
    if (fs.existsSync(p)) pages.push(p)
    else break
  }
  return pages
}

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const tuneDir = path.join(process.cwd(), 'public/tunes')
  const hymnaryNames = Object.keys(HYMNARY_FETCH_IDS)

  const allTunes = await db.select({ id: tunes.id, name: tunes.name })
    .from(tunes)
    .where(inArray(tunes.name, hymnaryNames))

  const tuneByName = new Map(allTunes.map(t => [t.name, t.id]))

  const existing = await db.select({ tuneId: tuneOcrResults.tuneId })
    .from(tuneOcrResults)
    .where(eq(tuneOcrResults.mode, 'ocr-text'))

  const doneIds = new Set(existing.map(r => r.tuneId))

  type WorkItem = { name: string; id: number; pages: string[] }
  const todo: WorkItem[] = []
  const skipped: string[] = []

  for (const name of hymnaryNames) {
    const id = tuneByName.get(name)
    if (!id) { skipped.push(`${name} — not in DB`); continue }
    if (doneIds.has(id)) { skipped.push(`${name} — already done`); continue }

    const slug = slugify(name)
    const solfegePages = collectPages(tuneDir, slug, 'solfege')
    const staffPages   = collectPages(tuneDir, slug, 'staff')
    const pages = solfegePages.length > 0 ? solfegePages : staffPages

    if (pages.length === 0) { skipped.push(`${name} — no images`); continue }
    todo.push({ name, id, pages })
  }

  console.log(`\n=== Bulk OCR Text Extraction ===`)
  console.log(`Skipping ${skipped.length} tunes:`)
  skipped.forEach(s => console.log(`  - ${s}`))
  console.log(`\nRunning OCR on ${todo.length} tunes:\n`)

  let done = 0, failed = 0

  for (const { name, id, pages } of todo) {
    process.stdout.write(`[${done + failed + 1}/${todo.length}] ${name} (${pages.length} page${pages.length > 1 ? 's' : ''})… `)

    try {
      const result = await transcribeOnly(name, pages)

      await db.insert(tuneOcrResults)
        .values({ tuneId: id, mode: 'ocr-text', result: result as unknown as Record<string, unknown> })
        .onConflictDoUpdate({
          target: [tuneOcrResults.tuneId, tuneOcrResults.mode],
          set: { result: result as unknown as Record<string, unknown>, updatedAt: new Date() },
        })

      console.log(`✓  doh=${result.doh} time=${result.time}`)
      done++
    } catch (err) {
      console.log(`✗  ${String(err).slice(0, 150)}`)
      failed++
    }

    if (done + failed < todo.length) await sleep(1500)
  }

  console.log(`\n=== Done: ${done} succeeded, ${failed} failed ===`)
  await sql.end()
}

main().catch(err => { console.error(err); process.exit(1) })
