#!/usr/bin/env npx tsx
/**
 * Step 0 validator for the soprano-from-SATB quick task.
 *
 * Extracts the V:1 voice from `abc_satb` for 3 sample tunes (Franconia,
 * Crimond, Bangor) and prints structural sanity checks. Run BEFORE any DML.
 *
 * Usage: npx tsx scripts/validate-soprano-extract.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { inArray } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { extractMelodyVoice } from '../src/lib/abc-voice-extract'

async function main() {
  const sql = postgres(process.env.DATABASE_URL!)
  const db = drizzle(sql, { schema })
  const rows = await db.select().from(schema.tunes).where(inArray(schema.tunes.id, [126, 30, 47]))
  let allOk = true
  for (const r of rows) {
    console.log('======================================')
    console.log(`Tune #${r.id}: ${r.name} (meter=${r.meter})`)
    console.log('--- abc_satb (input) ---')
    console.log(r.abcSatb ?? '(null)')
    const soprano = r.abcSatb ? extractMelodyVoice(r.abcSatb) : ''
    console.log('--- soprano extracted ---')
    console.log(soprano)
    console.log('--- existing abc_notation (current value) ---')
    console.log(r.abcNotation ?? '(null)')

    const bodyAfterK = soprano.split(/^\s*K:[^\n]*\n/m)[1] || ''
    const checks = {
      hasX: /^\s*X:/m.test(soprano),
      hasT: /^\s*T:/m.test(soprano),
      hasM: /^\s*M:/m.test(soprano),
      hasL: /^\s*L:/m.test(soprano),
      hasK: /^\s*K:/m.test(soprano),
      hasV1: /V:1/m.test(soprano),
      noV2Body: !/^\s*\[V:[234]\]/m.test(bodyAfterK),
      hasNotes: /[a-gA-Gz][,'0-9]*/.test(bodyAfterK),
      barCount: (bodyAfterK.match(/\|/g) || []).length,
      bodyLen: bodyAfterK.length,
    }
    console.log('--- structural checks ---')
    console.log(JSON.stringify(checks, null, 2))
    const ok = checks.hasX && checks.hasT && checks.hasM && checks.hasL && checks.hasK
      && checks.hasV1 && checks.noV2Body && checks.hasNotes && checks.barCount >= 4
      && checks.bodyLen > 30
    if (!ok) {
      console.log(`!!! FAIL for tune ${r.name} !!!`)
      allOk = false
    }
  }
  await sql.end()
  console.log('======================================')
  console.log(allOk ? 'ALL 3 SAMPLES STRUCTURALLY OK' : 'SAMPLES FAILED — DO NOT PROCEED')
  process.exit(allOk ? 0 : 1)
}
main().catch((e) => { console.error(e); process.exit(1) })
