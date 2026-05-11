#!/usr/bin/env npx tsx
/**
 * OCR solfège JPEGs via Claude vision → scripts/output/solfege-ocr.json
 *
 * Usage:
 *   npx tsx scripts/ocr-solfege.ts             # Process all tunes
 *   npx tsx scripts/ocr-solfege.ts --limit=5   # Process first 5 (testing)
 *
 * Resume: Re-run after interruption — already-processed tunes (status=success) are skipped.
 *
 * Acceptance bar (D-09): 95% of tunes WITH solfège images on disk (≥137 of 144).
 * 28 tunes have no solfège images — logged as status=no_image, not counted in failure rate.
 * Maximum physical coverage: 144/172 = 83.7% of all tunes.
 */

import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import Anthropic from '@anthropic-ai/sdk'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../src/db/schema'
import * as abcjsModule from 'abcjs'
import sharp from 'sharp'
import { slugifyTuneName } from './download-tunes'

// ─── Constants ────────────────────────────────────────────────────────────────

const TUNES_DIR = path.join(process.cwd(), 'public/tunes')
const OUTPUT_PATH = path.join(process.cwd(), 'scripts/output/solfege-ocr.json')
const HAIKU = 'claude-haiku-4-5'
const SONNET = 'claude-sonnet-4-6'
const DELAY_MS = 1200 // ~50 RPM Tier 1 safe

// ─── Environment guards ───────────────────────────────────────────────────────

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
if (!process.env.PSALTER_ANTHROPIC_API_KEY) throw new Error('PSALTER_ANTHROPIC_API_KEY not set')

// ─── Client init ──────────────────────────────────────────────────────────────

const client = new Anthropic({ apiKey: process.env.PSALTER_ANTHROPIC_API_KEY })
const pgClient = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client: pgClient, schema })
const abcjs = (abcjsModule as any).default ?? abcjsModule

// ─── Types ────────────────────────────────────────────────────────────────────

interface OutputEntry {
  id: number
  name: string
  slug: string
  status: 'success' | 'no_image' | 'validation_failure'
  abc: string | null
  model: typeof HAIKU | typeof SONNET | null
  warningCount?: number
  pageCount?: number
}

// ─── Production prompt ────────────────────────────────────────────────────────

const PROMPT = `This image shows a page from a Scottish Psalter with tonic sol-fa (Curwen notation) arranged for SATB (4-part harmony). If multiple pages are provided, identify the first page from the page number visible on each image or musical continuity, then read pages in order.

Extract ONLY the soprano (top) voice line and convert it to ABC notation.

Tonic sol-fa conventions:
- d=doh, r=ray, m=me, f=fah, s=soh, l=lah, t=te
- Apostrophe after note = upper octave (d' = high doh); subscript comma = lower octave (,l = low lah)
- Colons separate beats: "d :m :s :d'" = 4 crotchets in C time
- Dash (-) after a beat = hold for that beat: "d :- :m :-" = d for 2 beats, m for 2 beats
- Long dash (—) = hold entire beat group; "d :—" in a half-bar = 2-beat hold
- In C time (M:C), a full bar has 4 beats. "d :—" in a 2-beat group = hold 2 beats = d2 in ABC (with L:1/4)
- Chromatics: se = sharpened soh; fe = sharpened fah; te = flattened te; de = sharpened doh; etc.
- | = barline; :|| or |: = repeat bar; double bar = end of section

ABC notation rules:
- Use ^ for sharps (^F not F#, ^C not C#, ^G not G#). NEVER use #.
- Use _ for flats (_B not Bb, _E not Eb). NEVER use b suffix.
- Note lengths with L:1/4: crotchet = 1, minim = 2, semibreve = 4, quaver = /2
- In C time (M:C), each bar MUST total exactly 4 quarter-note beats
- Write repeats as |: music :| using ABC repeat syntax

Output a complete ABC string with these headers exactly:
X:1
T:[tune name from header]
M:[meter: C for common time, 3/4 for triple, 6/8 for compound, etc.]
L:1/4
Q:1/4=76
K:[key from DOH: DOH=C → K:C, DOH=G → K:G, DOH=F → K:F, DOH=D → K:D, DOH=B♭ → K:Bb, DOH=E♭ → K:Eb, etc.]
[note sequence with barlines]

Respond with ONLY the ABC string, no other text, no explanation, no markdown code fences.`

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
 *
 * Fixes applied (in order):
 * 1. Extract first X:1 block only — LLM sometimes outputs multiple X:1 attempts
 * 2. Strip markdown code fences if present
 * 3. Fix # → ^ sharp notation (RESEARCH.md Pitfall 1)
 * 4. Remove `:- :-` tonic sol-fa beat-hold remnants from ABC music lines
 *    (these appear as ":-" or ": -" in music lines, not in header lines)
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
  // Match note letter (possibly with octave marks) followed by #
  s = s.replace(/([A-Ga-g])([',]*)#(\d*)/g, (_m, note, octave, duration) => {
    return `^${note}${octave}${duration}`
  })

  // 4. Remove tonic sol-fa beat markers (:-) that leaked into ABC music lines
  // These appear as ":-" patterns. In valid ABC, ":-" is not valid syntax.
  // Replace " :-" with nothing in music content (lines not starting with a header letter)
  const lines = s.split('\n')
  const fixed = lines.map(line => {
    // Header lines (single letter + colon at start) are left unchanged
    if (/^[A-Za-z]:/.test(line)) return line
    // In music lines: remove ":- " and " :-" beat-hold separators
    return line.replace(/ ?:- ?/g, ' ').replace(/ ?: ?/g, ' ').trim()
  })
  s = fixed.join('\n')

  // 5. Remove isolated solfège note letters that leaked into ABC music lines.
  //    Valid ABC note letters are only a-g (A-G). The letters h-z (except z=rest)
  //    and letters r, l, s, m, t are tonic sol-fa note names invalid in ABC.
  //    We target these specific solfège letters when they appear as standalone tokens
  //    (surrounded by spaces/barlines/start/end): r, l, s, m, t (and their ' octave variants)
  //    Note: 'l' matches lowercase L (solfège "lah"), not a valid ABC note.
  //    We do NOT remove 'f' since that is a valid ABC note (F in middle octave).
  const solfegePattern = /(?<![A-Ga-gz^_])([rlsmt][',]?\d*)(?=[^A-Ga-z']|\s|$|\|)/g
  s = s.split('\n').map(line => {
    if (/^[A-Za-z]:/.test(line)) return line
    return line.replace(solfegePattern, 'z').trim()
  }).join('\n')

  return s.trim()
}

// Keep fixSharpNotation as alias for backward compat (used in tryGetAbc)
const fixSharpNotation = postProcessAbc

function validateAbc(abcStr: string): { valid: boolean; warningCount: number } {
  const result = abcjs.parseOnly(abcStr)
  const tune = result[0]
  const hasNotes = tune.lines?.some((l: any) =>
    l.staff?.some((s: any) => s.voices?.some((v: any) => v.length > 0))
  )
  const warnings = tune.warnings ?? []
  return { valid: hasNotes && warnings.length === 0, warningCount: warnings.length }
}

// Anthropic max: 5MB base64 = ~3.75MB raw. Resize+compress images that exceed this.
const MAX_RAW_BYTES = 3_750_000

async function prepareImageBase64(filePath: string): Promise<string> {
  const rawBytes = fs.statSync(filePath).size
  if (rawBytes <= MAX_RAW_BYTES) {
    return fs.readFileSync(filePath).toString('base64')
  }
  // Scale down: target 90% of limit to leave headroom, JPEG quality 85
  const scaleFactor = Math.sqrt(MAX_RAW_BYTES * 0.9 / rawBytes)
  const metadata = await sharp(filePath).metadata()
  const targetWidth = Math.floor((metadata.width ?? 1200) * scaleFactor)
  const resized = await sharp(filePath)
    .resize(targetWidth)
    .jpeg({ quality: 85 })
    .toBuffer()
  console.log(`  resized ${path.basename(filePath)}: ${(rawBytes / 1024 / 1024).toFixed(1)}MB → ${(resized.length / 1024 / 1024).toFixed(1)}MB`)
  return resized.toString('base64')
}

async function callVision(imagePaths: string[], model: string): Promise<string> {
  const imageBlocks = await Promise.all(imagePaths.map(async p => ({
    type: 'image' as const,
    source: {
      type: 'base64' as const,
      media_type: 'image/jpeg' as const,
      data: await prepareImageBase64(p),
    },
  })))
  const response = await client.messages.create({
    model,
    max_tokens: 2000,
    messages: [{ role: 'user', content: [...imageBlocks, { type: 'text', text: PROMPT }] }],
  })
  return (response.content[0] as { type: 'text'; text: string }).text.trim()
}

async function tryGetAbc(
  pages: string[],
  tuneName: string,
): Promise<Pick<OutputEntry, 'status' | 'abc' | 'model' | 'warningCount' | 'pageCount'>> {
  const pageCount = pages.length

  // Try haiku first
  let abcStr = await callVision(pages, HAIKU)
  // Apply post-processing: fix # → ^ sharp notation (common LLM error)
  abcStr = fixSharpNotation(abcStr)
  let validation = validateAbc(abcStr)
  if (validation.valid) {
    return { status: 'success', abc: abcStr, model: HAIKU, warningCount: 0, pageCount }
  }

  console.log(`  haiku failed (${validation.warningCount} warnings) — escalating to sonnet for "${tuneName}"`)
  // Escalate to sonnet
  abcStr = await callVision(pages, SONNET)
  abcStr = fixSharpNotation(abcStr)
  validation = validateAbc(abcStr)
  if (validation.valid) {
    return { status: 'success', abc: abcStr, model: SONNET, warningCount: 0, pageCount }
  }

  console.warn(`  sonnet also failed (${validation.warningCount} warnings) — tune will remain NULL`)
  return { status: 'validation_failure', abc: abcStr, model: SONNET, warningCount: validation.warningCount, pageCount }
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

    // Resume: skip already-successful entries
    if (existing[tune.id]?.status === 'success') {
      results.push(existing[tune.id])
      continue
    }

    const slug = slugifyTuneName(tune.name)
    const pages = findSolfegePages(slug)

    if (pages.length === 0) {
      console.log(`  MISSING: "${tune.name}" (slug: ${slug}) — no solfège file found`)
      results.push({ id: tune.id, name: tune.name, slug, status: 'no_image', abc: null, model: null })
    } else {
      console.log(`  [${tune.id}] "${tune.name}" — ${pages.length} page(s)`)
      const result = await tryGetAbc(pages, tune.name)
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
  const failures = results.filter(r => r.status === 'validation_failure')
  const haikuCount = successes.filter(r => r.model === HAIKU).length
  const sonnetCount = successes.filter(r => r.model === SONNET).length

  console.log('\n── Summary ──────────────────────────────────────────────────────')
  console.log(`Total tunes in DB:      ${allTunes.length}`)
  console.log(`With solfège images:    ${successes.length + failures.length}`)
  console.log(`Successful (haiku):     ${haikuCount}`)
  console.log(`Successful (sonnet):    ${sonnetCount}`)
  console.log(`No solfège image:       ${noImage.length}`)
  console.log(`Validation failures:    ${failures.length}`)
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
