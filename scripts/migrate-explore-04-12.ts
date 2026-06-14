#!/usr/bin/env npx tsx
/**
 * Standalone Airtable → PostgreSQL migration for Phase 04.12 Explore Page Rebuild.
 *
 * Migrates ONLY the new fields/tables added in Plan 01:
 *   - psalms.date_bc + psalms.occasion
 *   - naves_topics.messianic
 *   - naves_topic_entries (1906 rows)
 *   - verse_naves_topic_entries (~6005 rows)
 *   - creedal_references (97 rows)
 *
 * Does NOT touch tunes/JPG download — safe to run on low-disk VPS.
 * Idempotent — run multiple times with no side effects.
 *
 * Run: npx tsx scripts/migrate-explore-04-12.ts
 */

import 'dotenv/config'
import Airtable from 'airtable'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql, eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const BASE_ID = 'appY3dB1EHtex0fUJ'
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(BASE_ID)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const client = postgres(process.env.DATABASE_URL)
const db = drizzle({ client, schema })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function str(val: unknown): string | null {
  return typeof val === 'string' && val.length > 0 ? val : null
}

async function fetchAll(tableName: string) {
  console.log(`  Fetching ${tableName}...`)
  return base(tableName).select({ pageSize: 100 }).all()
}

// ─── Migration Functions ──────────────────────────────────────────────────────

async function migratePsalmDates() {
  console.log('\n[1/4] Migrating psalm dates and occasions...')
  const records = await fetchAll('Psalms')
  let n = 0
  for (const r of records) {
    const bcRaw = r.get('B.C.')
    const dateBC = bcRaw != null ? (parseInt(String(bcRaw), 10) || null) : null
    const occasion = str(r.get('Probably Occasion on which Psalm was Composed'))
    if (dateBC === null && occasion === null) continue
    // Use raw SQL to avoid Drizzle empty-SET issue with null values
    if (dateBC !== null && occasion !== null) {
      await db.update(schema.psalms)
        .set({ dateBC, occasion })
        .where(eq(schema.psalms.airtableId, r.id))
    } else if (dateBC !== null) {
      await db.update(schema.psalms)
        .set({ dateBC })
        .where(eq(schema.psalms.airtableId, r.id))
    } else if (occasion !== null) {
      await db.update(schema.psalms)
        .set({ occasion })
        .where(eq(schema.psalms.airtableId, r.id))
    }
    n++
  }
  console.log(`  Psalm dates/occasions updated: ${n}`)
}

async function migrateNavesMessianic() {
  console.log('\n[2/4] Migrating naves_topics.messianic...')
  const records = await fetchAll("Nave's Main Topic")
  let n = 0
  for (const r of records) {
    const messianic = str(r.get('Messianic?'))
    if (!messianic) continue
    await db
      .update(schema.navesTopics)
      .set({ messianic })
      .where(eq(schema.navesTopics.airtableId, r.id))
    n++
  }
  console.log(`  Naves messianic set: ${n}`)  // expect 12
}

async function migrateNavesTopicEntries(
  navesTopicMap: Map<string, number>,
  verseMap: Map<string, number>
) {
  console.log('\n[3/4] Migrating naves_topic_entries and verse_naves_topic_entries...')
  const records = await fetchAll("Topics - Verses (Nave's)")
  let entryCount = 0
  let linkCount = 0

  for (const r of records) {
    const linkedTopicIds = (r.get('Main Topic') as string[] | null) ?? []
    const linkedVerseIds = (r.get('References') as string[] | null) ?? []
    const subTopic = str(r.get('Sub-Topic'))
    const quotation = str(r.get('Quotation'))

    for (const airtableTopicId of linkedTopicIds) {
      const navesTopicId = navesTopicMap.get(airtableTopicId)
      if (!navesTopicId) continue

      const [entry] = await db
        .insert(schema.navesTopicEntries)
        .values({ airtableId: r.id, navesTopicId, subTopic, quotation })
        .onConflictDoUpdate({
          target: [schema.navesTopicEntries.airtableId, schema.navesTopicEntries.navesTopicId],
          set: {
            subTopic: sql`excluded.sub_topic`,
            quotation: sql`excluded.quotation`,
          },
        })
        .returning({ id: schema.navesTopicEntries.id })
      entryCount++

      for (const airtableVerseId of linkedVerseIds) {
        const verseId = verseMap.get(airtableVerseId)
        if (!verseId) continue
        await db
          .insert(schema.verseNavesTopicEntries)
          .values({ verseId, entryId: entry.id })
          .onConflictDoNothing()
        linkCount++
      }
    }
  }
  console.log(`  Naves topic entries: ${entryCount}, verse links: ${linkCount}`)
}

async function migrateCreedalReferences(verseMap: Map<string, number>) {
  console.log('\n[4/4] Migrating creedal_references...')
  const records = await fetchAll('Creedal References')
  let n = 0
  for (const r of records) {
    const linkedVerses = (r.get('Verses') as string[] | null) ?? []
    const creed = str(r.get('Creed'))
    const qnRaw = r.get('Creedal Reference')
    const questionNumber = qnRaw != null ? (parseInt(String(qnRaw), 10) || null) : null
    const url = str(r.get('URL'))
    const verseId = linkedVerses.length > 0 ? (verseMap.get(linkedVerses[0]) ?? null) : null

    await db
      .insert(schema.creedalReferences)
      .values({ airtableId: r.id, verseId, creed, questionNumber, url })
      .onConflictDoUpdate({
        target: schema.creedalReferences.airtableId,
        set: {
          verseId: sql`excluded.verse_id`,
          creed: sql`excluded.creed`,
          questionNumber: sql`excluded.question_number`,
          url: sql`excluded.url`,
        },
      })
    n++
  }
  console.log(`  Creedal references: ${n}`)  // expect 97
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Migrating explore 04.12 data...')

  // Build maps from existing DB rows (no Airtable re-fetch of psalms/verses/topics needed)
  const navesTopicRows = await db
    .select({ id: schema.navesTopics.id, airtableId: schema.navesTopics.airtableId })
    .from(schema.navesTopics)
  const navesTopicMap = new Map<string, number>(
    navesTopicRows
      .filter((r) => r.airtableId)
      .map((r) => [r.airtableId as string, r.id])
  )
  console.log(`  Naves topic map: ${navesTopicMap.size} entries`)

  const verseRows = await db
    .select({ id: schema.verses.id, airtableId: schema.verses.airtableId })
    .from(schema.verses)
  const verseMap = new Map<string, number>(
    verseRows
      .filter((r) => r.airtableId)
      .map((r) => [r.airtableId as string, r.id])
  )
  console.log(`  Verse map: ${verseMap.size} entries`)

  await migratePsalmDates()
  await migrateNavesMessianic()
  await migrateNavesTopicEntries(navesTopicMap, verseMap)
  await migrateCreedalReferences(verseMap)

  console.log('\nDone.')
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
