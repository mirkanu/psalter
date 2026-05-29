#!/usr/bin/env npx tsx
/**
 * Fix Stracathro and Rimington: append || to soprano solfège (if missing),
 * regenerate abc_notation from the complete solfège, then save to DB.
 * The PHRASE_BREAK re-annotation is handled separately by annotate-phrase-breaks.ts.
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, inArray, sql } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { solFaToAbc } from '../src/lib/solfege-parser'

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('DRY RUN — no DB writes')

const pgClient = postgres(process.env.DATABASE_URL)
const db = drizzle({ client: pgClient, schema })

const TUNE_NAMES = ['Stracathro', 'Rimington']

async function main() {
  const tunes = await db.select().from(schema.tunes)
    .where(inArray(sql`lower(${schema.tunes.name})`, TUNE_NAMES.map(n => n.toLowerCase())))

  for (const t of tunes) {
    if (!t.solfegeOcrText) {
      console.log(`${t.name}: no solfège OCR text — skip`)
      continue
    }

    const ocr: Record<string, string> = typeof t.solfegeOcrText === 'string'
      ? JSON.parse(t.solfegeOcrText)
      : (t.solfegeOcrText as unknown as Record<string, string>)
    const soprano = ocr.soprano ?? ''
    const doh = ocr.doh ?? 'C'
    const time = ocr.time ?? 'C'

    console.log(`\n${t.name}: soprano_len=${soprano.length}, ends_with_||=${soprano.trimEnd().endsWith('||')}`)
    console.log(`  soprano: ${soprano}`)

    // Fix: ensure soprano ends with ||
    const fixedSoprano = soprano.trimEnd().endsWith('||')
      ? soprano
      : soprano.trimEnd() + '||'

    if (fixedSoprano !== soprano) {
      console.log(`  FIXED soprano: ${fixedSoprano}`)
    }

    // Regenerate ABC
    const { abc, warnings } = solFaToAbc(fixedSoprano, doh, time, t.name)
    console.log(`  New ABC (${abc.length} chars):`)
    console.log(abc)

    // Count note heads roughly
    const musicLines = abc.split('\n').slice(6).join(' ')
    const noteCount = (musicLines.match(/[A-Ga-g]/g) ?? []).length
    console.log(`  Approx note heads: ~${noteCount}`)

    if (warnings.length > 0) {
      console.log(`  Warnings: ${warnings.join(', ')}`)
    }

    if (!DRY_RUN) {
      // Update solfège OCR text with fixed soprano + new ABC
      const updatedOcr = { ...ocr, soprano: fixedSoprano }
      await db.update(schema.tunes).set({
        solfegeOcrText: JSON.stringify(updatedOcr),
        abcNotation: abc,
      }).where(eq(schema.tunes.id, t.id))
      console.log(`  ✓ Updated DB`)
    }
  }

  await pgClient.end()
  console.log('\nDone.')
}

main().catch(e => { console.error(e); process.exit(1) })
