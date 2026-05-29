#!/usr/bin/env npx tsx
/**
 * Investigate phrase-4 alignment root cause across all tunes with abc_notation.
 *
 * For each tune with ABC, splits on PHRASE_BREAK markers, counts note heads and
 * w: tokens per phrase, computes pad delta, and classifies the failure mode per
 * CONTEXT.md D-05 candidates:
 *   (i)  split-mismatch   — PHRASE_BREAK placed wrong; phrase has more notes than expected
 *   (ii) unclassified     — note count matches expected but some other mismatch
 *   (iii) token-underproduction — note count matches expected, but w: tokens < expected
 *
 * Usage:
 *   npx tsx scripts/investigate-phrase4-alignment.ts
 *   npx tsx scripts/investigate-phrase4-alignment.ts --verbose   # per-tune detail to stdout
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
import { countNoteHeads, getSplitPointsForMeter } from './annotate-phrase-breaks'

// Syllable totals per meter — used to compute expected per-phrase syllable counts
// for split-mismatch vs token-underproduction classification
const METER_SYLLABLE_TOTALS: Record<string, number> = {
  CM: 28,  // 8+6+8+6
  LM: 32,  // 8+8+8+8
  SM: 26,  // 6+6+8+6
  '8.7.8.7': 30,  // 8+7+8+7
  '7.6.7.6': 26,  // 7+6+7+6
  DCM: 56, // 8+6+8+6+8+6+8+6
  DLM: 64, // 8+8+8+8+8+8+8+8
  DSM: 52, // 6+6+8+6+6+6+8+6
}

type TuneResult =
  | { tune: string; meter: string | null; skipReason: 'meter-n1' }
  | {
      tune: string
      meter: string | null
      skipReason: 'marker-mismatch'
      expectedPhrases: number
      actualPhrases: number
    }
  | {
      tune: string
      meter: string | null
      n: number
      noteHeads: number[]
      wTokens: number[]
      padNeeded: number[]
      expectedPerPhrase: number[] | null
      classification: 'split-mismatch' | 'token-underproduction' | 'unclassified' | 'ok'
    }

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL not set')
  const pgClient = postgres(process.env.DATABASE_URL!)
  const db = drizzle({ client: pgClient, schema })

  const verbose = process.argv.includes('--verbose')

  const tunes = await db
    .select()
    .from(schema.tunes)
    .where(isNotNull(schema.tunes.abcNotation))

  const results: TuneResult[] = []

  for (const tune of tunes) {
    const n = phrasesForMeter(tune.meter)

    // n=1 tunes have no PHRASE_BREAK and are always SKIPped by the checker
    if (n <= 1) {
      results.push({ tune: tune.name, meter: tune.meter, skipReason: 'meter-n1' })
      continue
    }

    const phrases = tune
      .abcNotation!.split(/^\s*%\s*PHRASE_BREAK\s*$/m)
      .map((p) => p.trim())

    // If marker count doesn't match expected, skip — different root cause
    if (phrases.length !== n) {
      results.push({
        tune: tune.name,
        meter: tune.meter,
        skipReason: 'marker-mismatch',
        expectedPhrases: n,
        actualPhrases: phrases.length,
      })
      continue
    }

    // Count note heads per phrase
    const noteHeads = phrases.map((p) => countNoteHeads(p))

    // Count w: tokens per phrase (before any padWLineToNoteCount padding)
    const wTokens = phrases.map((p) =>
      p
        .split('\n')
        .filter((l) => /^w:/i.test(l.trim()))
        .flatMap((l) =>
          l
            .replace(/^w:\s*/i, '')
            .split(/\s+/)
            .filter(Boolean),
        ).length,
    )

    // How many pad tokens would padWLineToNoteCount need to add per phrase
    const padNeeded = phrases.map((_, i) => Math.max(0, noteHeads[i] - wTokens[i]))

    // Expected per-phrase syllable counts from split points
    const splitPoints = getSplitPointsForMeter(tune.meter, n)
    let expectedPerPhrase: number[] | null = null

    if (splitPoints) {
      const firstToken = (tune.meter?.trim().split(/\s+/)[0] ?? '').toUpperCase()
      const total = METER_SYLLABLE_TOTALS[firstToken] ?? null
      if (total !== null) {
        // Derive per-phrase expected counts from split point deltas
        const perPhrase: number[] = []
        for (let i = 0; i < splitPoints.length; i++) {
          if (i === 0) {
            perPhrase.push(splitPoints[0])
          } else {
            perPhrase.push(splitPoints[i] - splitPoints[i - 1])
          }
        }
        // Last phrase = total minus last split point
        perPhrase.push(total - splitPoints[splitPoints.length - 1])
        expectedPerPhrase = perPhrase
      }
    }

    // Classify based on last phrase (phrase 4 for CM/LM/SM, phrase n generally)
    const lastIdx = n - 1
    const lastPadNeeded = padNeeded[lastIdx]

    let classification: 'split-mismatch' | 'token-underproduction' | 'unclassified' | 'ok'

    if (lastPadNeeded === 0) {
      classification = 'ok'
    } else if (
      expectedPerPhrase !== null &&
      noteHeads[lastIdx] > expectedPerPhrase[lastIdx]
    ) {
      // More note heads than the meter expects → PHRASE_BREAK placed too early
      classification = 'split-mismatch'
    } else if (
      expectedPerPhrase !== null &&
      noteHeads[lastIdx] <= expectedPerPhrase[lastIdx] &&
      wTokens[lastIdx] < (expectedPerPhrase[lastIdx] ?? 0)
    ) {
      // Note count is correct (or low) but w: tokens are fewer than expected
      classification = 'token-underproduction'
    } else {
      classification = 'unclassified'
    }

    if (verbose && lastPadNeeded > 0) {
      console.log(
        `${tune.name} (${tune.meter}) n=${n}: noteHeads=${JSON.stringify(noteHeads)} wTokens=${JSON.stringify(wTokens)} padNeeded=${JSON.stringify(padNeeded)} expected=${JSON.stringify(expectedPerPhrase)} → ${classification}`,
      )
    }

    results.push({
      tune: tune.name,
      meter: tune.meter,
      n,
      noteHeads,
      wTokens,
      padNeeded,
      expectedPerPhrase,
      classification,
    })
  }

  // Aggregate classification counts
  const classificationCounts: Record<string, number> = {
    'split-mismatch': 0,
    'token-underproduction': 0,
    unclassified: 0,
    ok: 0,
    'meter-n1': 0,
    'marker-mismatch': 0,
  }

  for (const r of results) {
    if ('skipReason' in r) {
      classificationCounts[r.skipReason] = (classificationCounts[r.skipReason] ?? 0) + 1
    } else {
      classificationCounts[r.classification] = (classificationCounts[r.classification] ?? 0) + 1
    }
  }

  const outPath = join(process.cwd(), 'scripts/output/phrase4-investigation.json')
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        totalTunes: tunes.length,
        classificationCounts,
        results,
      },
      null,
      2,
    ),
  )
  console.log(JSON.stringify(classificationCounts, null, 2))
  console.log(`Report: ${outPath}`)
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
