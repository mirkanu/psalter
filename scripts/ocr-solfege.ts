#!/usr/bin/env npx tsx
/**
 * OCR solfège JPEGs via Claude vision → scripts/output/solfege-ocr.json
 *
 * Usage:
 *   npx tsx scripts/ocr-solfege.ts             # Process all tunes
 *   npx tsx scripts/ocr-solfege.ts --limit=5   # Process first 5 (testing)
 *
 * Resume: Re-run after interruption — tunes with status=success AND solfegeText AND abcSatb are skipped.
 *
 * Acceptance bar (D-09): 95% of tunes WITH solfège images on disk (≥137 of 144).
 * 28 tunes have no solfège images — logged as status=no_image, not counted in failure rate.
 * Maximum physical coverage: 144/172 = 83.7% of all tunes.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'
import * as abcjsModule from 'abcjs'
import { transcribeOnly, type TranscriptionResult } from '../src/lib/ocr-solfege-v2'
import { solFaToAbc, solFaToAbcMultiVoice } from '../src/lib/solfege-parser'
import { slugifyTuneName } from './download-tunes'

// ─── Constants ────────────────────────────────────────────────────────────────

const TUNES_DIR = path.join(process.cwd(), 'public/tunes')
const OUTPUT_PATH = path.join(process.cwd(), 'scripts/output/solfege-ocr.json')
const DELAY_MS = 1200 // ~50 RPM Tier 1 safe

// ─── Environment guards ───────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
if (!process.env.PSALTER_ANTHROPIC_API_KEY) throw new Error('PSALTER_ANTHROPIC_API_KEY not set')

// ─── Client init ──────────────────────────────────────────────────────────────

const pgClient = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: pgClient, schema })
const abcjs = (abcjsModule as any).default ?? abcjsModule

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutputEntry {
  id: number
  name: string
  slug: string
  status: 'success' | 'no_image' | 'validation_failure' | 'transcription_failure'
  // legacy field (kept for compat with apply-abc-notation.ts existing reads):
  abc: string | null              // soprano-only ABC (from solFaToAbc)
  // new fields:
  solfegeText: string | null      // JSON.stringify(TranscriptionResult) — raw transcribed voices
  abcSatb: string | null          // 4-voice ABC from solFaToAbcMultiVoice
  model: 'claude-sonnet-4-6' | null
  warningCount?: number
  pageCount?: number
}

// ─── Helper functions ─────────────────────────────────────────────────────────

function findSolfegePages(slug: string): string[] {
  const pages: string[] = []
  let i = 0
  while (true) {
    const p = path.join(TUNES_DIR, `${slug}-solfege-${i}.jpg`)
    if (!fs.existsSync(p)) break
    pages.push(p)
    i++
  }
  return pages
}

/**
 * Post-process LLM ABC output to fix common errors before validation.
 */
function postProcessAbc(abcStr: string): string {
  let s = abcStr.trim()

  // 1. Strip markdown code fences
  s = s.replace(/^```[a-z]*\n?/i, '').replace(/\n?```\s*$/i, '').trim()

  // 2. Extract first X:1 block only (remove duplicate attempts the LLM sometimes appends)
  const secondXMatch = s.match(/\n(X:\d+\n)/)
  if (secondXMatch) {
    s = s.slice(0, secondXMatch.index!).trim()
  }

  // 3. Fix # → ^ sharp notation in music lines (not in header lines like K:F#)
  s = s.replace(/([A-Ga-g])([',]*)#(\d*)/g, (_m, note, octave, duration) => {
    return `^${note}${octave}${duration}`
  })

  // 4. Remove tonic sol-fa beat markers (:-) that leaked into ABC music lines
  const lines = s.split('\n')
  const fixed = lines.map(line => {
    if (/^[A-Za-z]:/.test(line)) return line
    return line.replace(/ ?:- ?/g, ' ').replace(/ ?: ?/g, ' ').trim()
  })
  s = fixed.join('\n')

  // 5. Remove isolated solfège note letters that leaked into ABC music lines.
  const solfegePattern = /(?<![A-Ga-gz^_])([rlsmt][',]?\d*)(?=[^A-Ga-z']|\s|$|\|)/g
  s = s.split('\n').map(line => {
    if (/^[A-Za-z]:/.test(line)) return line
    return line.replace(solfegePattern, 'z').trim()
  }).join('\n')

  return s.trim()
}

function validateAbc(abcStr: string): { valid: boolean; warningCount: number } {
  const result = abcjs.parseOnly(abcStr)
  const tune = result[0]
  const hasNotes = tune.lines?.some((l: any) =>
    l.staff?.some((s: any) => s.voices?.some((v: any) => v.length > 0))
  )
  const warnings = tune.warnings ?? []
  return { valid: hasNotes && warnings.length === 0, warningCount: warnings.length }
}

async function tryProcessTune(
  pages: string[],
  tuneName: string,
): Promise<Pick<OutputEntry, 'status' | 'abc' | 'solfegeText' | 'abcSatb' | 'model' | 'warningCount' | 'pageCount'>> {
  const pageCount = pages.length

  // Stage 1: transcribe via Claude vision
  let transcription: TranscriptionResult & { rawResponse: string }
  try {
    transcription = await transcribeOnly(tuneName, pages)
  } catch (err) {
    console.warn(`  transcription failed for "${tuneName}": ${err instanceof Error ? err.message : String(err)}`)
    return { status: 'transcription_failure', abc: null, solfegeText: null, abcSatb: null, model: 'claude-sonnet-4-6', pageCount }
  }

  const { doh, time, soprano, alto, tenor, bass, lah, mode } = transcription
  const solfegeText = JSON.stringify({ doh, time, soprano, alto, tenor, bass, lah, mode })

  // Stage 2a: soprano-only ABC
  let sopranoAbc: string | null = null
  let sopranoStatus: 'success' | 'validation_failure' = 'success'
  let warningCount = 0
  try {
    const { abc: rawSoprano } = solFaToAbc(soprano, doh, time, tuneName, lah, mode)
    const processed = postProcessAbc(rawSoprano)
    const validation = validateAbc(processed)
    warningCount = validation.warningCount
    if (validation.valid) {
      sopranoAbc = processed
    } else {
      sopranoStatus = 'validation_failure'
      sopranoAbc = processed // keep it anyway — callers can decide
      console.warn(`  soprano ABC validation failed (${validation.warningCount} warnings): "${tuneName}"`)
    }
  } catch (err) {
    sopranoStatus = 'validation_failure'
    console.warn(`  soprano ABC parse error for "${tuneName}": ${err instanceof Error ? err.message : String(err)}`)
  }

  // Stage 2b: 4-voice SATB ABC (best-effort — never blocks success)
  let abcSatb: string | null = null
  try {
    const multiResult = solFaToAbcMultiVoice({ soprano, alto, tenor, bass }, doh, time, tuneName, lah, mode)
    abcSatb = multiResult.abc
    if (multiResult.warnings.length > 0) {
      console.log(`  SATB warnings for "${tuneName}": ${multiResult.warnings.slice(0, 2).join('; ')}`)
    }
  } catch (err) {
    console.warn(`  SATB ABC parse error for "${tuneName}": ${err instanceof Error ? err.message : String(err)}`)
  }

  return {
    status: sopranoStatus,
    abc: sopranoAbc,
    solfegeText,
    abcSatb,
    model: 'claude-sonnet-4-6',
    warningCount,
    pageCount,
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const limitArg = args.find(a => a.startsWith('--limit='))
  const LIMIT = limitArg ? parseInt(limitArg.split('=')[1]) : Infinity

  // Load existing output for resume
  const existing: Record<number, OutputEntry> = {}
  if (fs.existsSync(OUTPUT_PATH)) {
    const entries = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8')) as OutputEntry[]
    entries.forEach(e => { existing[e.id] = e })
    console.log(`Resuming — ${Object.keys(existing).length} entries already in JSON`)
  }

  const allTunes = await db
    .select({ id: schema.tunes.id, name: schema.tunes.name })
    .from(schema.tunes)
    .orderBy(schema.tunes.id)
  console.log(`Processing ${Math.min(allTunes.length, LIMIT === Infinity ? allTunes.length : LIMIT)} of ${allTunes.length} tunes`)

  const results: OutputEntry[] = []
  let processed = 0

  for (const tune of allTunes) {
    if (processed >= LIMIT) break

    // Resume: a tune is done only when it has all three new artefacts
    const ex = existing[tune.id]
    if (ex?.status === 'success' && ex.solfegeText && ex.abcSatb) {
      results.push(ex)
      continue
    }

    const slug = slugifyTuneName(tune.name)
    const pages = findSolfegePages(slug)

    if (pages.length === 0) {
      console.log(`  MISSING: "${tune.name}" (slug: ${slug}) — no solfège file found`)
      results.push({ id: tune.id, name: tune.name, slug, status: 'no_image', abc: null, solfegeText: null, abcSatb: null, model: null })
    } else {
      console.log(`  [${tune.id}] "${tune.name}" — ${pages.length} page(s)`)
      const result = await tryProcessTune(pages, tune.name)
      results.push({ id: tune.id, name: tune.name, slug, ...result })
      processed++

      // Rate limiting: stay within Tier 1 ITPM limits
      await new Promise(r => setTimeout(r, DELAY_MS))
    }

    // Write after every tune for crash recovery (per D-03)
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2))
  }

  // Summary table
  const successes = results.filter(r => r.status === 'success')
  const noImage = results.filter(r => r.status === 'no_image')
  const failures = results.filter(r => r.status === 'validation_failure' || r.status === 'transcription_failure')
  const withSolfegeText = results.filter(r => r.solfegeText !== null)
  const withAbcSatb = results.filter(r => r.abcSatb !== null)

  console.log('\n── Summary ──────────────────────────────────────────────────────')
  console.log(`Total tunes in DB:      ${allTunes.length}`)
  console.log(`With solfège images:    ${successes.length + failures.length}`)
  console.log(`Successful soprano ABC: ${successes.length}`)
  console.log(`With solfege OCR text:  ${withSolfegeText.length}`)
  console.log(`With SATB ABC:          ${withAbcSatb.length}`)
  console.log(`No solfège image:       ${noImage.length}`)
  console.log(`Failures:               ${failures.length}`)
  console.log('────────────────────────────────────────────────────────────────')
  const withImages = successes.length + failures.length
  const successRate = withImages > 0 ? ((successes.length / withImages) * 100).toFixed(1) : '0'
  console.log(`Success rate (of tunes with images): ${successRate}%`)
  console.log(`Acceptance bar: ≥95% of ${withImages} tunes with images = ≥${Math.ceil(withImages * 0.95)} tunes`)
  if (successes.length < Math.ceil(withImages * 0.95)) {
    console.error('FAIL: below 95% acceptance bar — check solfege-ocr.json for failures')
    process.exit(1)
  }
  console.log('PASS: acceptance bar met')

  if (failures.length > 0) {
    const failPath = path.join(process.cwd(), 'scripts/output/solfege-failures.json')
    fs.writeFileSync(failPath, JSON.stringify(failures, null, 2))
    console.log(`Failures written to ${failPath}`)
  }

  await pgClient.end()
  process.exit(0)
}

main().catch(e => {
  console.error('Uncaught error:', e)
  process.exit(1)
})
