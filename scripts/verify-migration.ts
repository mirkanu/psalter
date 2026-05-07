#!/usr/bin/env npx tsx
/**
 * Migration verification script.
 * Run: npx tsx scripts/verify-migration.ts
 * Run (quick mode — row counts only): npx tsx scripts/verify-migration.ts --quick
 *
 * Covers:
 *   MIGR-01: All tables present with correct row counts
 *   MIGR-02: Tune JPG files present on local filesystem (TUNES_DIR) — skipped in quick mode
 *   MIGR-03: Spot-check records match expected Airtable values — skipped in quick mode
 *   MIGR-04: Idempotency — run twice and assert same counts — skipped in quick mode
 */

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { count, eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const client = postgres(process.env.DATABASE_URL!)
const db = drizzle({ client, schema })

const args = process.argv.slice(2)
const QUICK_MODE = args.includes('--quick')

let failures = 0

function assert(condition: boolean, message: string): void {
  if (condition) {
    console.log(`  + ${message}`)
  } else {
    console.error(`  FAIL: ${message}`)
    failures++
  }
}

// --- Row Count Checks --------------------------------------------------------

async function checkRowCounts(): Promise<Record<string, number>> {
  console.log('\n-- Row Counts --')

  const counts: Record<string, number> = {}

  const tables = [
    { name: 'psalms',           table: schema.psalms,          expected: 150 },
    { name: 'tunes',            table: schema.tunes,           expected: 172 },
    { name: 'psalm_versions',   table: schema.psalmVersions,   expected: 184 },
    { name: 'verses',           table: schema.verses,          expected: 2461 },
    { name: 'daily_readings',   table: schema.dailyReadings,   expected: 365 },
    { name: 'events',           table: schema.events,          expected: 29 },
    { name: 'messianic_psalms', table: schema.messianicPsalms, expected: 18 },
    { name: 'section_headings', table: schema.sectionHeadings, expected: 402 },
    { name: 'topics',           table: schema.topics,          expected: 88 },
    { name: 'naves_topics',     table: schema.navesTopics,     expected: 488 },
    { name: 'moods',            table: schema.moods,           expected: 10 },
    { name: 'doctrines',        table: schema.doctrines,       expected: 40 },
    // service_items is an upsert-based junction; count may grow with more events
    { name: 'service_items',    table: schema.serviceItems,    expected: null as number | null },
  ] as const

  for (const { name, table, expected } of tables) {
    const [{ value }] = await db.select({ value: count() }).from(table)
    const n = Number(value)
    counts[name] = n

    if (expected !== null) {
      assert(n === expected, `${name}: ${n} rows (expected ${expected})`)
    } else {
      assert(n > 0, `${name}: ${n} rows (expected >0)`)
      console.log(`      [info] ${name}: ${n} rows`)
    }
  }

  // Junction tables (with verified counts from first migration run)
  const junctions = [
    { name: 'psalm_topics',         table: schema.psalmTopics,        expected: 882 },
    { name: 'psalm_version_tunes',  table: schema.psalmVersionTunes,  expected: 184 },
    { name: 'tune_moods',           table: schema.tuneMoods,          expected: 164 },
    { name: 'verse_naves_topics',   table: schema.verseNavesTopics,   expected: 6005 },
    { name: 'verse_doctrines',      table: schema.verseDoctrines,     expected: 46 },
  ] as const

  console.log('\n  Junction tables:')
  for (const { name, table, expected } of junctions) {
    const [{ value }] = await db.select({ value: count() }).from(table)
    const n = Number(value)
    counts[name] = n
    assert(n === expected, `${name}: ${n} junction rows (expected ${expected})`)
  }

  return counts
}

// --- Local Image Checks -------------------------------------------------------

async function checkLocalImages(): Promise<void> {
  console.log('\n-- Local Image Checks --')

  // Check no Airtable URLs stored
  const allPaths = await db
    .select({ url: schema.tunes.scoreJpgUrl })
    .from(schema.tunes)

  const airtableStored = allPaths.filter(r => r.url?.includes('airtableusercontent.com'))
  assert(
    airtableStored.length === 0,
    `No Airtable temporary URLs stored in tunes.score_jpg_url (found ${airtableStored.length})`,
  )

  // Note: images were skipped due to VPS disk space (SKIP_IMAGES=1 was used)
  // score_jpg_url will be NULL for all tunes until disk is expanded and images are re-downloaded
  const withPath = allPaths.filter(r => r.url)
  if (withPath.length === 0) {
    console.log(`  [info] No tune images downloaded yet (SKIP_IMAGES=1 was used — disk constraint)`)
    console.log(`  [info] Expand VPS disk and re-run migration without SKIP_IMAGES=1 to populate`)
  } else {
    console.log(`  [info] ${withPath.length} tunes have a score_jpg_url`)
  }

  if (QUICK_MODE) {
    console.log('  [quick mode] Skipping filesystem checks')
    return
  }

  // Check files exist on local filesystem (only if any paths are stored)
  if (withPath.length > 0) {
    const { existsSync } = await import('node:fs')
    const TUNES_DIR = process.env.TUNES_DIR ?? '/data/home/psalter/public/tunes'
    const sample = withPath.slice(0, 5)
    for (const { url } of sample) {
      if (!url) continue
      const filename = url.replace('/tunes/', '')
      const filepath = `${TUNES_DIR}/${filename}`
      assert(existsSync(filepath), `Tune image file exists on disk: ${filename}`)
    }
  }
}

// --- Spot-Check Records -------------------------------------------------------

async function checkSpotRecords(): Promise<void> {
  if (QUICK_MODE) {
    console.log('\n-- Spot Checks -- [skipped in quick mode]')
    return
  }

  console.log('\n-- Spot Checks --')

  // Psalm 23 — "The LORD is my shepherd"
  const psalm23 = await db.query.psalms.findFirst({ where: eq(schema.psalms.id, 23) })
  assert(psalm23 !== undefined, 'Psalm 23 exists in database')
  assert(
    psalm23?.kjvText?.includes('LORD is my shepherd') ?? false,
    'Psalm 23 KJV text contains "LORD is my shepherd"',
  )

  // Psalm 1 — "Blessed is the man"
  const psalm1 = await db.query.psalms.findFirst({ where: eq(schema.psalms.id, 1) })
  assert(psalm1 !== undefined, 'Psalm 1 exists in database')
  assert(
    psalm1?.kjvText?.includes('Blessed is the man') ?? false,
    'Psalm 1 KJV text contains "Blessed is the man"',
  )

  // Psalm 119 — longest psalm, should have 176 verses
  const psalm119Verses = await db
    .select({ value: count() })
    .from(schema.verses)
    .where(eq(schema.verses.psalmId, 119))
  const v119count = Number(psalm119Verses[0].value)
  assert(v119count > 100, `Psalm 119 has >100 verses (found ${v119count})`)

  // Service items should exist
  const serviceItemCount = await db.select({ value: count() }).from(schema.serviceItems)
  assert(Number(serviceItemCount[0].value) > 0, 'Service items table is not empty')

  // Topics — psalms should be tagged
  const psalmTopicCount = await db.select({ value: count() }).from(schema.psalmTopics)
  assert(Number(psalmTopicCount[0].value) > 0, 'Psalm-topic links exist')

  // Tunes — meter normalised (no long un-normalised strings)
  // Normalised values are short abbreviations like CM, LM, SM — not full strings
  const longMeterTunes = await db
    .select({ meter: schema.tunes.meter, name: schema.tunes.name })
    .from(schema.tunes)
    .where(eq(schema.tunes.meter, 'Common Meter (CM, 86 86)'))
  assert(
    longMeterTunes.length === 0,
    `No un-normalised meter values stored (e.g. "Common Meter (CM, 86 86)") — found ${longMeterTunes.length}`,
  )

  // Daily readings — 365 entries
  const drCount = await db.select({ value: count() }).from(schema.dailyReadings)
  assert(Number(drCount[0].value) === 365, `Daily readings = 365 (found ${drCount[0].value})`)
}

// --- Idempotency Check (MIGR-04) ---------------------------------------------

async function checkIdempotency(firstRunCounts: Record<string, number>): Promise<void> {
  if (QUICK_MODE) {
    console.log('\n-- Idempotency Check (MIGR-04) -- [skipped in quick mode]')
    return
  }

  console.log('\n-- Idempotency Check (MIGR-04) --')
  console.log('  Re-running migration to test delta idempotency...')

  const { execSync } = await import('child_process')
  try {
    execSync('npx tsx scripts/migrate-airtable.ts', {
      stdio: 'pipe',
      cwd: process.cwd(),
      env: { ...process.env, SKIP_IMAGES: '1' }, // always skip images in idempotency check
      timeout: 300_000, // 5 minutes
    })
    console.log('  Second migration run completed')
  } catch (err) {
    assert(false, `Second migration run failed: ${err}`)
    return
  }

  // Check counts are unchanged
  const checkTables = [
    { name: 'psalms',           table: schema.psalms },
    { name: 'tunes',            table: schema.tunes },
    { name: 'psalm_versions',   table: schema.psalmVersions },
    { name: 'verses',           table: schema.verses },
    { name: 'events',           table: schema.events },
    { name: 'topics',           table: schema.topics },
    { name: 'psalm_topics',     table: schema.psalmTopics },
    { name: 'verse_naves_topics', table: schema.verseNavesTopics },
  ]

  for (const { name, table } of checkTables) {
    const [{ value }] = await db.select({ value: count() }).from(table)
    const n = Number(value)
    const expected = firstRunCounts[name]
    if (expected !== undefined) {
      assert(n === expected, `${name}: count unchanged after re-run (${expected} -> ${n})`)
    }
  }
}

// --- Main --------------------------------------------------------------------

async function main() {
  console.log('=== Migration Verification ===')
  if (QUICK_MODE) console.log('[QUICK MODE - row counts and URL checks only]')

  const counts = await checkRowCounts()
  await checkLocalImages()
  await checkSpotRecords()
  await checkIdempotency(counts)

  console.log('\n==============================')
  if (failures === 0) {
    console.log('All checks passed')
  } else {
    console.error(`${failures} check(s) failed`)
  }
  console.log('==============================')

  await client.end()
  process.exit(failures > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Verification failed:', err)
  client.end()
  process.exit(1)
})
