#!/usr/bin/env npx tsx
/**
 * Audit PHRASE_BREAK counts vs expected for all tunes with abc_notation.
 * Writes scripts/output/phrase-break-audit.json and prints a table.
 *
 * Usage:
 *   npx tsx scripts/audit-phrase-breaks.ts
 *   npx tsx scripts/audit-phrase-breaks.ts --json
 */
import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import { realpathSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { isNotNull } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { phrasesForMeter } from '../src/lib/abc-phrase-meter-map'
import { countNoteHeads } from './annotate-phrase-breaks'

const Z2_BUG_TUNES = new Set(['Arnold', 'Crediton', 'New Britain', 'St. Andrew', 'St. Mary'])

export function auditTune(t: { name: string; meter: string | null; abcNotation: string }) {
  const expected = Math.max(0, phrasesForMeter(t.meter) - 1) // CURRENT phrasesForMeter
  const actual = (t.abcNotation.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
  // Split body on PHRASE_BREAK and count note heads per phrase
  const phrases = t.abcNotation.split(/^\s*%\s*PHRASE_BREAK\s*$/m)
  const noteHeadsPerPhrase = phrases.map((p) => countNoteHeads(p))
  const totalNoteHeads = noteHeadsPerPhrase.reduce((a, b) => a + b, 0)
  const hasZ2TrailingRest = /\bz\d+\s*$/m.test(t.abcNotation.split(/^\s*%\s*PHRASE_BREAK\s*$/m).pop() ?? '')
  const status = actual === expected ? 'OK' : 'MISMATCH'
  return {
    name: t.name,
    meter: t.meter,
    expected,
    actual,
    status,
    noteHeadsPerPhrase,
    totalNoteHeads,
    hasZ2TrailingRest,
    isKnownZ2Bug: Z2_BUG_TUNES.has(t.name),
  }
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const pgClient = postgres(process.env.DATABASE_URL!)
  const db = drizzle({ client: pgClient, schema })
  const rows = await db
    .select()
    .from(schema.tunes)
    .where(isNotNull(schema.tunes.abcNotation))

  const results = rows
    .filter((r) => r.abcNotation)
    .map((r) => auditTune({ name: r.name, meter: r.meter, abcNotation: r.abcNotation! }))

  // Sort: MISMATCH first, then by meter, then by name
  results.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'MISMATCH' ? -1 : 1
    if ((a.meter ?? '') !== (b.meter ?? '')) return (a.meter ?? '').localeCompare(b.meter ?? '')
    return a.name.localeCompare(b.name)
  })

  // Summary by meter
  const byMeter: Record<string, { total: number; mismatch: number; zeroPhraseBreaks: number }> = {}
  for (const r of results) {
    const k = r.meter ?? '(null)'
    byMeter[k] ??= { total: 0, mismatch: 0, zeroPhraseBreaks: 0 }
    byMeter[k].total++
    if (r.status === 'MISMATCH') byMeter[k].mismatch++
    if (r.actual === 0) byMeter[k].zeroPhraseBreaks++
  }

  // Write JSON
  const outPath = join(process.cwd(), 'scripts/output/phrase-break-audit.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), byMeter, tunes: results }, null, 2))

  // Print table
  console.log('Status\tName\tMeter\texpected\tactual\tnoteHeadsPerPhrase\tz2?')
  for (const r of results) {
    const z2 = r.isKnownZ2Bug ? 'KNOWN-Z2' : r.hasZ2TrailingRest ? 'z2-detected' : ''
    console.log(`${r.status}\t${r.name}\t${r.meter}\t${r.expected}\t${r.actual}\t[${r.noteHeadsPerPhrase.join(',')}]\t${z2}`)
  }
  console.log('\nBy meter:')
  for (const [meter, s] of Object.entries(byMeter)) {
    console.log(`  ${meter}: total=${s.total} mismatch=${s.mismatch} zeroPhraseBreaks=${s.zeroPhraseBreaks}`)
  }
  console.log(`\nWrote ${outPath}`)
  await pgClient.end()
}

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
