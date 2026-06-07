#!/usr/bin/env npx tsx
/**
 * Phase 04.11 — Vision OCR batch driver.
 *
 * CLI:
 *   --tune-list=<path>   JSON array of tune names to process (required for --apply)
 *   --dry-run            Default; writes review JSONs only
 *   --apply              Enables DB UPDATEs
 *   --wave-a-passed      Required when tune-list has >20 entries (D-04 Wave B gate)
 *
 * Refuses to --apply >20 entries without --wave-a-passed.
 * Refuses to UPDATE any tune whose buildEmbeddedWline result has passesValidation=false (D-05).
 * Logs per-tune Vision token usage to scripts/output/wave-a-token-usage.json (Plan 06 reads for cost projection).
 *
 * Tested by scripts/ocr-melisma-batch.test.ts (gate logic + per-tune pipeline with injected mocks).
 * Tests do NOT call live Vision.
 */
import 'dotenv/config'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { ocrMelismaV4Pass2, type MelismaTranscriptionResult } from '../src/lib/ocr-melisma-v3'
import { buildEmbeddedWline, type BuildEmbeddedWlineResult } from '../src/lib/build-embedded-wline'
import { slugifyTuneName } from './download-tunes'
import { syllabifyForAbc } from '../src/lib/lyrics'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProcessTuneStatus =
  | 'success'
  | 'no_db_row'
  | 'no_image'
  | 'no_syllables'
  | 'low_confidence'
  | 'validation_failure'

export interface MelismaOcrReview {
  id: number | null
  name: string
  slug: string
  status: ProcessTuneStatus
  preWlineAbc: string | null
  newAbc: string | null
  perPhraseDiagnostics: Array<{
    phraseIdx: number
    noteHeadCount: number
    wTokenCount: number
    syllables: string[]
    underlinedTokenIndices: number[]
    minConfidence: number
  }>
  warnings: string[]
}

/**
 * OCR function contract. Real production wires `ocrMelismaV3`, which currently
 * does not expose usage/model — those fields are optional so future v3 changes
 * (or mock injections in tests) can supply them without breaking the contract.
 */
export type OcrFn = (imagePaths: string[], existingAbc: string) => Promise<
  MelismaTranscriptionResult & {
    usage?: { input_tokens: number; output_tokens: number }
    model?: string
  }
>

export interface ProcessTuneDeps {
  apply: boolean
  resolveTune: (name: string) => Promise<{ id: number; name: string; abcNotation: string | null } | null>
  resolveJpgPaths: (slug: string) => Promise<string[]>
  resolveSyllables: (tuneId: number) => Promise<string[] | null>
  ocrFn: OcrFn
  builder: (input: {
    tokens: string[]
    underlined: boolean[]
    syllables: string[]
    existingAbc: string
  }) => BuildEmbeddedWlineResult
  updateTune: (tuneName: string, abc: string) => Promise<number>
  writeReview: (slug: string, review: MelismaOcrReview) => void
  logTokens: (
    slug: string,
    usage: { input_tokens: number; output_tokens: number },
    model: string,
  ) => void
  slugify: (name: string) => string
}

// ─── Gate enforcement (CLI flag validation) ──────────────────────────────────

export interface WaveAFlagInput {
  apply: boolean
  tuneListPath: string | undefined
  tuneCount: number
  waveAPassed: boolean
}

const WAVE_B_THRESHOLD = 20

export function assertWaveAFlags(input: WaveAFlagInput): void {
  if (!input.apply) return // dry-run permissive

  if (!input.tuneListPath) {
    throw new Error('--tune-list=<path> required when --apply is set')
  }

  const isWaveB = input.tuneCount > WAVE_B_THRESHOLD
  if (isWaveB && !input.waveAPassed) {
    throw new Error(
      `Wave B detected (${input.tuneCount} tunes > ${WAVE_B_THRESHOLD}) but --wave-a-passed flag missing. Run Wave A and sign off first.`,
    )
  }
}

// ─── Token-usage logger ───────────────────────────────────────────────────────

const DEFAULT_TOKEN_LOG = 'scripts/output/wave-a-token-usage.json'
const LOW_CONFIDENCE_THRESHOLD = 0.85

export function logTokenUsage(
  tuneSlug: string,
  usage: { input_tokens: number; output_tokens: number },
  model: string,
  logPath: string = DEFAULT_TOKEN_LOG,
): void {
  fs.mkdirSync(path.dirname(logPath), { recursive: true })
  const existing: any[] = fs.existsSync(logPath)
    ? JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    : []
  existing.push({
    tuneSlug,
    inputTokens: usage.input_tokens,
    outputTokens: usage.output_tokens,
    totalTokens: usage.input_tokens + usage.output_tokens,
    model,
    timestamp: new Date().toISOString(),
  })
  fs.writeFileSync(logPath, JSON.stringify(existing, null, 2))
}

// ─── Per-tune pipeline ────────────────────────────────────────────────────────

export interface ProcessTuneResult {
  status: ProcessTuneStatus
  tuneName: string
  slug: string
  warnings: string[]
}

export async function processTune(
  tuneName: string,
  deps: ProcessTuneDeps,
): Promise<ProcessTuneResult> {
  const slug = deps.slugify(tuneName)
  const warnings: string[] = []

  // 1. Resolve tune row
  const tune = await deps.resolveTune(tuneName)
  if (!tune) {
    const review: MelismaOcrReview = {
      id: null,
      name: tuneName,
      slug,
      status: 'no_db_row',
      preWlineAbc: null,
      newAbc: null,
      perPhraseDiagnostics: [],
      warnings: [`tune "${tuneName}" not found in DB`],
    }
    deps.writeReview(slug, review)
    return { status: 'no_db_row', tuneName, slug, warnings: review.warnings }
  }

  const existingAbc = tune.abcNotation ?? ''

  // 2. Resolve JPG paths
  const jpgs = await deps.resolveJpgPaths(slug)
  if (jpgs.length === 0) {
    const review: MelismaOcrReview = {
      id: tune.id,
      name: tuneName,
      slug,
      status: 'no_image',
      preWlineAbc: existingAbc || null,
      newAbc: null,
      perPhraseDiagnostics: [],
      warnings: [`no JPG matches public/tunes/${slug}-solfege-*.jpg`],
    }
    deps.writeReview(slug, review)
    return { status: 'no_image', tuneName, slug, warnings: review.warnings }
  }

  // 3. Resolve stanza-1 syllables (Task 1.5 schemaPath)
  const syllables = await deps.resolveSyllables(tune.id)
  if (!syllables || syllables.length === 0) {
    const review: MelismaOcrReview = {
      id: tune.id,
      name: tuneName,
      slug,
      status: 'no_syllables',
      preWlineAbc: existingAbc || null,
      newAbc: null,
      perPhraseDiagnostics: [],
      warnings: [`no stanza-1 syllables resolvable for tune id ${tune.id}`],
    }
    deps.writeReview(slug, review)
    return { status: 'no_syllables', tuneName, slug, warnings: review.warnings }
  }

  // 4. Vision OCR
  const ocrResult = await deps.ocrFn(jpgs, existingAbc)

  // Token-usage logging (Plan 06 dependency)
  if (ocrResult.usage && ocrResult.model) {
    deps.logTokens(slug, ocrResult.usage, ocrResult.model)
  }

  // 5. Extract soprano tokens/underlined/conf
  const soprano = ocrResult.soprano
  const tokens = soprano.map((e) => e.tok)
  const underlined = soprano.map((e) => e.underlined)
  const confs = soprano.map((e) => e.conf)
  const minConf = confs.length > 0 ? Math.min(...confs) : 0

  // 6. Low-confidence gate (D-05 fallback)
  if (minConf < LOW_CONFIDENCE_THRESHOLD) {
    const review: MelismaOcrReview = {
      id: tune.id,
      name: tuneName,
      slug,
      status: 'low_confidence',
      preWlineAbc: existingAbc || null,
      newAbc: null,
      perPhraseDiagnostics: [
        {
          phraseIdx: 0,
          noteHeadCount: tokens.length,
          wTokenCount: 0,
          syllables,
          underlinedTokenIndices: underlined.map((u, i) => (u ? i : -1)).filter((i) => i >= 0),
          minConfidence: minConf,
        },
      ],
      warnings: [`min token confidence ${minConf.toFixed(2)} < ${LOW_CONFIDENCE_THRESHOLD}`],
    }
    deps.writeReview(slug, review)
    return { status: 'low_confidence', tuneName, slug, warnings: review.warnings }
  }

  // 7. Build embedded w-line
  const built = deps.builder({ tokens, underlined, syllables, existingAbc })

  // 8. Validation gate (D-05 fallback)
  if (!built.passesValidation) {
    const review: MelismaOcrReview = {
      id: tune.id,
      name: tuneName,
      slug,
      status: 'validation_failure',
      preWlineAbc: existingAbc || null,
      newAbc: built.abc,
      perPhraseDiagnostics: built.perPhrase.map((p) => ({
        phraseIdx: p.phraseIdx,
        noteHeadCount: p.noteHeadCount,
        wTokenCount: p.wTokenCount,
        syllables,
        underlinedTokenIndices: underlined.map((u, i) => (u ? i : -1)).filter((i) => i >= 0),
        minConfidence: minConf,
      })),
      warnings: built.warnings,
    }
    deps.writeReview(slug, review)
    return { status: 'validation_failure', tuneName, slug, warnings: built.warnings }
  }

  // 9. Write review (success)
  const review: MelismaOcrReview = {
    id: tune.id,
    name: tuneName,
    slug,
    status: 'success',
    preWlineAbc: existingAbc || null,
    newAbc: built.abc,
    perPhraseDiagnostics: built.perPhrase.map((p) => ({
      phraseIdx: p.phraseIdx,
      noteHeadCount: p.noteHeadCount,
      wTokenCount: p.wTokenCount,
      syllables,
      underlinedTokenIndices: underlined.map((u, i) => (u ? i : -1)).filter((i) => i >= 0),
      minConfidence: minConf,
    })),
    warnings: [],
  }
  deps.writeReview(slug, review)

  // 10. Apply (DB UPDATE) — RESEARCH "Don't Hand-Roll" pattern: returning({id}) + length === 1
  if (deps.apply) {
    const rowsUpdated = await deps.updateTune(tuneName, built.abc)
    if (rowsUpdated !== 1) {
      throw new Error(`expected exactly 1 row updated for ${tuneName}, got ${rowsUpdated}`)
    }
  }

  return { status: 'success', tuneName, slug, warnings: [] }
}

// ─── Production wiring helpers ────────────────────────────────────────────────

const REVIEW_DIR = '.planning/phases/04.11-solfege-underline-ocr-melisma/review'
const TUNES_DIR = process.env.TUNES_DIR ?? 'public/tunes'

function writeReviewToFile(slug: string, review: MelismaOcrReview): void {
  fs.mkdirSync(REVIEW_DIR, { recursive: true })
  fs.writeFileSync(path.join(REVIEW_DIR, `${slug}.json`), JSON.stringify(review, null, 2))
}

async function resolveJpgPathsOnDisk(slug: string): Promise<string[]> {
  if (!fs.existsSync(TUNES_DIR)) return []
  const all = fs.readdirSync(TUNES_DIR)
  const prefix = `${slug}-solfege-`
  return all
    .filter((f) => f.startsWith(prefix) && f.endsWith('.jpg'))
    .sort()
    .map((f) => path.join(TUNES_DIR, f))
}

/**
 * Stanza-1 syllable resolver.
 *
 * schemaPath (from stanza1-probe.json, Task 1.5):
 *   schema.tunes → schema.psalmVersionTunes.tuneId → schema.psalmVersions.lyricsStructured
 *     → Array<{index, lines: [{text}]}> → [0].lines[0].text → syllabifyForAbc(text).split(/\s+/)
 *
 * Falls back to lyricsImportedRaw if lyricsStructured is null (Crimond pvts[0]=pv 35 path).
 */
async function resolveStanza1Syllables(
  tuneId: number,
  db: ReturnType<typeof drizzle>,
): Promise<string[] | null> {
  const pvts = await db
    .select()
    .from(schema.psalmVersionTunes)
    .where(eq(schema.psalmVersionTunes.tuneId, tuneId))
  if (pvts.length === 0) return null

  // Deterministic ordering by psalm_version_id ascending (matches probe expectation)
  pvts.sort((a, b) => a.psalmVersionId - b.psalmVersionId)

  const pv = await db
    .select({
      lyricsStructured: schema.psalmVersions.lyricsStructured,
      lyricsImportedRaw: schema.psalmVersions.lyricsImportedRaw,
    })
    .from(schema.psalmVersions)
    .where(eq(schema.psalmVersions.id, pvts[0].psalmVersionId))
  if (pv.length !== 1) return null

  const ls = pv[0].lyricsStructured as any
  let stanzaText: string | null = null
  if (Array.isArray(ls) && Array.isArray(ls[0]?.lines)) {
    // Join ALL lines of stanza 1 — buildEmbeddedWline aligns against the full
    // stanza, not just line 1. Crimond CM: 4 lines × (8,6,8,6) = 28 syllables.
    const lines = ls[0].lines
      .map((l: { text?: string }) => (l?.text ?? '').trim())
      .filter((t: string) => t.length > 0)
    if (lines.length > 0) stanzaText = lines.join(' ')
  } else if (pv[0].lyricsImportedRaw) {
    // Fallback: take the first stanza block (lines until first blank line)
    const allLines = pv[0].lyricsImportedRaw
      .split('\n')
      .map((l: string) => l.replace(/^\d+/, '').trim())
    const firstBlank = allLines.findIndex((l: string) => l.length === 0)
    const stanzaLines = (firstBlank === -1 ? allLines : allLines.slice(0, firstBlank))
      .filter((l: string) => l.length > 0)
    if (stanzaLines.length > 0) stanzaText = stanzaLines.join(' ')
  }
  if (!stanzaText) return null

  const syllables = syllabifyForAbc(stanzaText).split(/\s+/).filter(Boolean)
  return syllables.length > 0 ? syllables : null
}

// ─── Main (CLI entry) ─────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const APPLY = args.includes('--apply')
  const WAVE_A_PASSED = args.includes('--wave-a-passed')
  const tuneListArg = args.find((a) => a.startsWith('--tune-list='))?.split('=')[1]

  // Load tune-list early so gate check has accurate count
  let tuneEntries: Array<{ tuneName: string } | string> = []
  if (tuneListArg) {
    tuneEntries = JSON.parse(fs.readFileSync(tuneListArg, 'utf-8'))
  }
  const tuneNames = tuneEntries.map((e) =>
    typeof e === 'string' ? e : e.tuneName,
  )

  // Gate check FIRST — refuses to proceed before any DB or Vision touch
  assertWaveAFlags({
    apply: APPLY,
    tuneListPath: tuneListArg,
    tuneCount: tuneNames.length,
    waveAPassed: WAVE_A_PASSED,
  })

  if (!APPLY) console.log('DRY RUN — review JSONs only, no DB writes')
  console.log(`Processing ${tuneNames.length} tune(s)...`)

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const pgClient = postgres(process.env.DATABASE_URL)
  const db = drizzle({ client: pgClient, schema })

  const deps: ProcessTuneDeps = {
    apply: APPLY,
    resolveTune: async (name) => {
      const rows = await db
        .select({ id: schema.tunes.id, name: schema.tunes.name, abcNotation: schema.tunes.abcNotation })
        .from(schema.tunes)
        .where(eq(schema.tunes.name, name))
      return rows.length === 1 ? rows[0] : null
    },
    resolveJpgPaths: resolveJpgPathsOnDisk,
    resolveSyllables: (tuneId) => resolveStanza1Syllables(tuneId, db),
    ocrFn: ocrMelismaV4Pass2,
    builder: buildEmbeddedWline,
    updateTune: async (tuneName, abc) => {
      const result = await db
        .update(schema.tunes)
        .set({ abcNotation: abc })
        .where(eq(schema.tunes.name, tuneName))
        .returning({ id: schema.tunes.id })
      if (result.length !== 1) {
        throw new Error(`expected exactly 1 row updated for ${tuneName}, got ${result.length}`)
      }
      return result.length
    },
    writeReview: writeReviewToFile,
    logTokens: (slug, usage, model) => logTokenUsage(slug, usage, model),
    slugify: slugifyTuneName,
  }

  const summary: Record<ProcessTuneStatus, number> = {
    success: 0,
    no_db_row: 0,
    no_image: 0,
    no_syllables: 0,
    low_confidence: 0,
    validation_failure: 0,
  }
  for (const name of tuneNames) {
    try {
      const result = await processTune(name, deps)
      summary[result.status]++
      console.log(`  [${result.status}] ${name}`)
    } catch (err) {
      console.error(`  [error] ${name}: ${(err as Error).message}`)
    }
  }

  console.log('\n── Summary ─────────────────────────────────────────────────')
  for (const [status, count] of Object.entries(summary)) {
    console.log(`  ${status.padEnd(20)} ${count}`)
  }
  console.log('────────────────────────────────────────────────────────────')

  await pgClient.end()
  process.exit(0)
}

// Only run main() when invoked as CLI, not when imported by tests.
if (require.main === module) {
  main().catch((e) => {
    console.error('Uncaught error:', e)
    process.exit(1)
  })
}
