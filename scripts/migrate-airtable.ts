#!/usr/bin/env npx tsx
/**
 * Airtable → PostgreSQL Migration Script
 * Run: npx tsx scripts/migrate-airtable.ts
 *
 * Two-pass strategy:
 *   Pass 1: Insert all primary tables, build airtableId→postgresId maps
 *   Pass 2: Insert junction rows using resolved IDs
 *
 * Idempotent: every INSERT uses onConflictDoUpdate on airtable_id.
 * Re-run before launch to capture post-snapshot Airtable changes (MIGR-04).
 */

import 'dotenv/config'
import Airtable from 'airtable'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import * as schema from '../src/db/schema'
import { downloadTuneScores } from './download-tunes'

const BASE_ID = 'appY3dB1EHtex0fUJ'
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(BASE_ID)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const client = postgres(process.env.DATABASE_URL)
const db = drizzle({ client, schema })

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normaliseMeter(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // Already a short abbreviation (e.g. "CM", "LM", "SM", "CMD")
  if (/^[A-Z]{1,4}(\.[0-9]+)*$/.test(trimmed)) return trimmed
  // "Common Meter (CM, 86 86)" → "CM"
  // "Long Meter (LM, 88 88)" → "LM"
  const match = trimmed.match(/\(([A-Z]{1,4})[,\s)]/)
  if (match) return match[1]
  console.warn(`  normaliseMeter: unrecognised format — returning raw value: "${trimmed}"`)
  return trimmed
}

function parsePosition(raw: string | null | undefined): number | null {
  if (!raw) return null
  const ordinals: Record<string, number> = {
    '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
    'First': 1, 'Second': 2, 'Third': 3, 'Fourth': 4, 'Fifth': 5,
  }
  const trimmed = raw.trim()
  return ordinals[trimmed] ?? (parseInt(trimmed, 10) || null)
}

function str(val: unknown): string | null {
  return typeof val === 'string' && val.length > 0 ? val : null
}

async function fetchAll(tableName: string) {
  console.log(`  Fetching ${tableName}...`)
  return base(tableName).select({ pageSize: 100 }).all()
}

// ─── Pass 1: Primary Tables ───────────────────────────────────────────────────

async function migrateMoods(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Moods')
  for (const r of records) {
    const [row] = await db.insert(schema.moods).values({
      airtableId: r.id,
      name: str(r.get('Name')),
    }).onConflictDoUpdate({
      target: schema.moods.airtableId,
      set: { name: sql`excluded.name` },
    }).returning({ id: schema.moods.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Moods: ${idMap.size} records`)
  return idMap
}

async function migrateNavesTopics(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll("Nave's Main Topic")
  for (const r of records) {
    const [row] = await db.insert(schema.navesTopics).values({
      airtableId: r.id,
      name: str(r.get('Name')),
      description: str(r.get('Description')),
    }).onConflictDoUpdate({
      target: schema.navesTopics.airtableId,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
      },
    }).returning({ id: schema.navesTopics.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Naves Topics: ${idMap.size} records`)
  return idMap
}

async function migrateTopics(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Topics - Psalms')
  for (const r of records) {
    const [row] = await db.insert(schema.topics).values({
      airtableId: r.id,
      name: str(r.get('Topic (Psalm)')),
      topicType: str(r.get('Topic Type')),
      description: str(r.get('Description')),
    }).onConflictDoUpdate({
      target: schema.topics.airtableId,
      set: {
        name: sql`excluded.name`,
        topicType: sql`excluded.topic_type`,
        description: sql`excluded.description`,
      },
    }).returning({ id: schema.topics.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Topics: ${idMap.size} records`)
  return idMap
}

async function migrateDoctrines(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Doctrines')
  for (const r of records) {
    const [row] = await db.insert(schema.doctrines).values({
      airtableId: r.id,
      name: str(r.get('Name')),
    }).onConflictDoUpdate({
      target: schema.doctrines.airtableId,
      set: { name: sql`excluded.name` },
    }).returning({ id: schema.doctrines.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Doctrines: ${idMap.size} records`)
  return idMap
}

async function migratePsalms(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Psalms')
  for (const r of records) {
    // PITFALL 3: Psalm number is stored as singleLineText — must parse to integer
    const psalmNum = parseInt(r.get('Psalm') as string, 10)
    if (isNaN(psalmNum)) {
      console.warn(`  Skipping psalm with invalid number: ${r.get('Psalm')}`)
      continue
    }
    const [row] = await db.insert(schema.psalms).values({
      id: psalmNum,
      airtableId: r.id,
      book: str(r.get('Book')),
      bibleTitle: str(r.get('Title (from Bible)')),
      haddingtonIntro: str(r.get('Haddington Introduction')),
      kjvText: str(r.get('KJV Text')),
      author: str(r.get('Author')),
    }).onConflictDoUpdate({
      target: schema.psalms.airtableId,
      set: {
        // Do NOT include id here — PK is immutable once inserted
        book: sql`excluded.book`,
        bibleTitle: sql`excluded.bible_title`,
        haddingtonIntro: sql`excluded.haddington_intro`,
        kjvText: sql`excluded.kjv_text`,
        author: sql`excluded.author`,
      },
    }).returning({ id: schema.psalms.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Psalms: ${idMap.size} records`)
  return idMap
}

async function migrateTunes(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Tunes')
  for (const r of records) {
    const name = str(r.get('Tune Name'))
    if (!name) { console.warn(`  Skipping tune with no name: ${r.id}`); continue }

    // PITFALL 1: Download in same run as fetch — attachment URLs expire in ~2 hours
    // Set SKIP_IMAGES=1 to skip image downloads (e.g. when disk space is limited).
    // Re-run without SKIP_IMAGES to download remaining images idempotently.
    const skipImages = process.env.SKIP_IMAGES === '1'
    const staffAttachments = skipImages ? [] : (r.get('Staff Score Sheet') as unknown as Array<{ url: string; filename: string }> | null) ?? []
    // Actual field name has accent: Solfége Score Sheet (verified via Airtable Meta API)
    const solfegeAttachments = skipImages ? [] : (r.get('Solfége Score Sheet') as unknown as Array<{ url: string; filename: string }> | null) ?? []

    const { primaryUrl: scoreJpgUrl, additionalUrls: additionalStaff } = await downloadTuneScores(name, staffAttachments, 'staff')
    const { primaryUrl: solfegeJpgUrl } = await downloadTuneScores(name, solfegeAttachments, 'solfege')

    const [row] = await db.insert(schema.tunes).values({
      airtableId: r.id,
      name,
      meter: normaliseMeter(r.get('Meter') as string | undefined),
      scoreJpgUrl,
      solfegeJpgUrl,
      additionalScoreUrls: additionalStaff.length > 0 ? additionalStaff : null,
      youtubeUrl: str(r.get('YouTube')),
      soundcloudUrl: str(r.get('SoundCloud Status')),
      precentingComment: str(r.get('Precenting Comment')),
    }).onConflictDoUpdate({
      target: schema.tunes.airtableId,
      set: {
        name: sql`excluded.name`,
        meter: sql`excluded.meter`,
        scoreJpgUrl: sql`excluded.score_jpg_url`,
        solfegeJpgUrl: sql`excluded.solfege_jpg_url`,
        additionalScoreUrls: sql`excluded.additional_score_urls`,
        youtubeUrl: sql`excluded.youtube_url`,
        soundcloudUrl: sql`excluded.soundcloud_url`,
        precentingComment: sql`excluded.precenting_comment`,
      },
    }).returning({ id: schema.tunes.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Tunes: ${idMap.size} records`)
  return idMap
}

async function migratePsalmVersions(psalmIdMap: Map<string, number>): Promise<{
  psalmVersionIdMap: Map<string, number>
  psalmVersionToPsalmIdMap: Map<string, number>
}> {
  const psalmVersionIdMap = new Map<string, number>()
  // psalmVersionAirtableId → psalmId (integer psalm number) — needed for service_items
  const psalmVersionToPsalmIdMap = new Map<string, number>()
  const records = await fetchAll('Scottish Psalter')
  for (const r of records) {
    const linkedPsalmIds = (r.get('Psalm #') as string[] | null) ?? []
    const psalmId = linkedPsalmIds.length > 0 ? psalmIdMap.get(linkedPsalmIds[0]) ?? null : null

    const [row] = await db.insert(schema.psalmVersions).values({
      airtableId: r.id,
      psalmId,
      psalterNumber: str(r.get('Psalter #')),
      lyrics: str(r.get('Lyrics')),
      meter: normaliseMeter(r.get('Meter') as string | undefined),
      versionLabel: str(r.get('Version')),
      firstLine: str(r.get('First Line')),
    }).onConflictDoUpdate({
      target: schema.psalmVersions.airtableId,
      set: {
        psalmId: sql`excluded.psalm_id`,
        psalterNumber: sql`excluded.psalter_number`,
        lyrics: sql`excluded.lyrics`,
        meter: sql`excluded.meter`,
        versionLabel: sql`excluded.version_label`,
        firstLine: sql`excluded.first_line`,
      },
    }).returning({ id: schema.psalmVersions.id })
    psalmVersionIdMap.set(r.id, row.id)
    if (psalmId !== null) {
      psalmVersionToPsalmIdMap.set(r.id, psalmId)
    } else {
      console.warn(`  Psalm version ${r.id} has no linked psalm — service items referencing it will have null psalm_id`)
    }
  }
  console.log(`  Psalm Versions: ${psalmVersionIdMap.size} records`)
  return { psalmVersionIdMap, psalmVersionToPsalmIdMap }
}

async function migrateVerses(psalmIdMap: Map<string, number>): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Verses')
  for (const r of records) {
    const linkedChapterIds = (r.get('Chapter') as string[] | null) ?? []
    const psalmId = linkedChapterIds.length > 0 ? psalmIdMap.get(linkedChapterIds[0]) ?? null : null

    const [row] = await db.insert(schema.verses).values({
      airtableId: r.id,
      psalmId,
      verseNumber: typeof r.get('Verse') === 'number' ? r.get('Verse') as number : null,
      kjvText: str(r.get('KJV')),
      metricalText: str(r.get('Scottish Psalter')),
    }).onConflictDoUpdate({
      target: schema.verses.airtableId,
      set: {
        psalmId: sql`excluded.psalm_id`,
        verseNumber: sql`excluded.verse_number`,
        kjvText: sql`excluded.kjv_text`,
        metricalText: sql`excluded.metrical_text`,
      },
    }).returning({ id: schema.verses.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Verses: ${idMap.size} records`)
  return idMap
}

async function migrateEvents(): Promise<Map<string, number>> {
  const idMap = new Map<string, number>()
  const records = await fetchAll('Event')
  for (const r of records) {
    const [row] = await db.insert(schema.events).values({
      airtableId: r.id,
      eventDate: str(r.get('Date')),
      session: str(r.get('AM/PM')),
      precentor: str(r.get('User/Precenter Name')),
      notes: str(r.get('Notes')),
    }).onConflictDoUpdate({
      target: schema.events.airtableId,
      set: {
        eventDate: sql`excluded.event_date`,
        session: sql`excluded.session`,
        precentor: sql`excluded.precentor`,
        notes: sql`excluded.notes`,
      },
    }).returning({ id: schema.events.id })
    idMap.set(r.id, row.id)
  }
  console.log(`  Events: ${idMap.size} records`)
  return idMap
}

async function migrateMessianicPsalms(psalmIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('Messianic Psalms')
  for (const r of records) {
    const linkedPsalmIds = (r.get('Psalm') as string[] | null) ?? []
    const psalmId = linkedPsalmIds.length > 0 ? psalmIdMap.get(linkedPsalmIds[0]) ?? null : null

    await db.insert(schema.messianicPsalms).values({
      airtableId: r.id,
      psalmId,
      // Actual field names verified via Airtable Meta API
      classification: str(r.get('Christ referred to in the')),
      ntVerification: str(r.get('Subject')),
      messianicVerses: str(r.get('Messianic Verses Summarised')),
    }).onConflictDoUpdate({
      target: schema.messianicPsalms.airtableId,
      set: {
        psalmId: sql`excluded.psalm_id`,
        classification: sql`excluded.classification`,
        ntVerification: sql`excluded.nt_verification`,
        messianicVerses: sql`excluded.messianic_verses`,
      },
    })
  }
  console.log(`  Messianic Psalms: ${records.length} records`)
}

async function migrateSectionHeadings(psalmIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('Section Headings')
  for (const r of records) {
    const linkedPsalmIds = (r.get('Psalm') as string[] | null) ?? []
    const psalmId = linkedPsalmIds.length > 0 ? psalmIdMap.get(linkedPsalmIds[0]) ?? null : null

    await db.insert(schema.sectionHeadings).values({
      airtableId: r.id,
      psalmId,
      verseStart: typeof r.get('Verse Start') === 'number' ? r.get('Verse Start') as number : null,
      heading: str(r.get('Section Heading')),
    }).onConflictDoUpdate({
      target: schema.sectionHeadings.airtableId,
      set: {
        psalmId: sql`excluded.psalm_id`,
        verseStart: sql`excluded.verse_start`,
        heading: sql`excluded.heading`,
      },
    })
  }
  console.log(`  Section Headings: ${records.length} records`)
}

async function migrateDailyReadings(psalmIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('365 Days')
  for (const r of records) {
    const linkedPsalmIds = (r.get('Psalm') as string[] | null) ?? []
    const psalmId = linkedPsalmIds.length > 0 ? psalmIdMap.get(linkedPsalmIds[0]) ?? null : null

    const dayNumber = typeof r.get('Day of the Year') === 'number' ? r.get('Day of the Year') as number : null
    if (dayNumber === null) {
      console.warn(`  Skipping daily reading ${r.id}: missing Day of the Year`)
      continue
    }

    await db.insert(schema.dailyReadings).values({
      airtableId: r.id,
      psalmId,
      // Actual field names verified via Airtable Meta API
      dayNumber,
      readingDate: null,  // No date field in 365 Days table
      notes: null,
    }).onConflictDoUpdate({
      target: schema.dailyReadings.airtableId,
      set: {
        psalmId: sql`excluded.psalm_id`,
        dayNumber: sql`excluded.day_number`,
        readingDate: sql`excluded.reading_date`,
        notes: sql`excluded.notes`,
      },
    })
  }
  console.log(`  Daily Readings: ${records.length} records`)
}

// ─── Pass 2: Junction Tables ──────────────────────────────────────────────────

async function migratePsalmTopics(psalmIdMap: Map<string, number>, topicIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('Topics - Psalms')
  let count = 0
  for (const r of records) {
    const topicPostgresId = topicIdMap.get(r.id)
    if (!topicPostgresId) continue
    const linkedPsalmIds = (r.get('Psalms') as string[] | null) ?? []
    for (const airtablePsalmId of linkedPsalmIds) {
      const psalmId = psalmIdMap.get(airtablePsalmId)
      if (!psalmId) continue
      await db.insert(schema.psalmTopics).values({
        psalmId,
        topicId: topicPostgresId,
      }).onConflictDoNothing()
      count++
    }
  }
  console.log(`  Psalm-Topic links: ${count}`)
}

async function migratePsalmVersionTunes(psalmVersionIdMap: Map<string, number>, tuneIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('Scottish Psalter')
  let count = 0
  for (const r of records) {
    const psalmVersionId = psalmVersionIdMap.get(r.id)
    if (!psalmVersionId) continue
    const linkedTuneIds = (r.get('CPRC Standard') as string[] | null) ?? []
    for (let i = 0; i < linkedTuneIds.length; i++) {
      const tuneId = tuneIdMap.get(linkedTuneIds[i])
      if (!tuneId) continue
      await db.insert(schema.psalmVersionTunes).values({
        psalmVersionId,
        tuneId,
        isPrimary: i === 0,  // first linked tune is primary
      }).onConflictDoNothing()
      count++
    }
  }
  console.log(`  PsalmVersion-Tune links: ${count}`)
}

async function migrateTuneMoods(tuneIdMap: Map<string, number>, moodIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll('Tunes')
  let count = 0
  for (const r of records) {
    const tuneId = tuneIdMap.get(r.id)
    if (!tuneId) continue
    const linkedMoodIds = (r.get('Mood') as string[] | null) ?? []
    for (const airtableMoodId of linkedMoodIds) {
      const moodId = moodIdMap.get(airtableMoodId)
      if (!moodId) continue
      await db.insert(schema.tuneMoods).values({ tuneId, moodId }).onConflictDoNothing()
      count++
    }
  }
  console.log(`  Tune-Mood links: ${count}`)
}

async function migrateVerseNavesTopics(verseIdMap: Map<string, number>, navesTopicIdMap: Map<string, number>): Promise<void> {
  const records = await fetchAll("Topics - Verses (Nave's)")
  let count = 0
  for (const r of records) {
    // This table IS the junction — each record links a verse to a Nave's topic
    // Actual field names verified via Airtable Meta API: References → Verses, Main Topic → Nave's Main Topic
    const linkedVerseIds = (r.get('References') as string[] | null) ?? []
    const linkedTopicIds = (r.get('Main Topic') as string[] | null) ?? []
    for (const airtableVerseId of linkedVerseIds) {
      const verseId = verseIdMap.get(airtableVerseId)
      if (!verseId) continue
      for (const airtableTopicId of linkedTopicIds) {
        const navesTopicId = navesTopicIdMap.get(airtableTopicId)
        if (!navesTopicId) continue
        await db.insert(schema.verseNavesTopics).values({ verseId, navesTopicId }).onConflictDoNothing()
        count++
      }
    }
  }
  console.log(`  Verse-NavesTopic links: ${count}`)
}

async function migrateVerseDoctrines(verseIdMap: Map<string, number>, doctrineIdMap: Map<string, number>): Promise<void> {
  // Verses.Doctrines links to 'Doctrines Oldf' (deprecated). The live path is:
  // Doctrine References table — each record has 'Doctrine' → Doctrines and 'Psalm' → Verses
  const records = await fetchAll('Doctrine References')
  let count = 0
  for (const r of records) {
    const linkedVerseIds = (r.get('Psalm') as string[] | null) ?? []
    const linkedDoctrineIds = (r.get('Doctrine') as string[] | null) ?? []
    for (const airtableVerseId of linkedVerseIds) {
      const verseId = verseIdMap.get(airtableVerseId)
      if (!verseId) continue
      for (const airtableDoctrineId of linkedDoctrineIds) {
        const doctrineId = doctrineIdMap.get(airtableDoctrineId)
        if (!doctrineId) continue
        await db.insert(schema.verseDoctrines).values({ verseId, doctrineId }).onConflictDoNothing()
        count++
      }
    }
  }
  console.log(`  Verse-Doctrine links: ${count}`)
}

async function migrateServiceItems(
  eventIdMap: Map<string, number>,
  psalmVersionToPsalmIdMap: Map<string, number>,
  tuneIdMap: Map<string, number>,
): Promise<void> {
  // Note: 'Psalm' field in Psalm & Tune CPRC links to Scottish Psalter (psalm versions),
  // not to Psalms directly. We resolve the psalm_id via psalmVersionToPsalmIdMap.
  const records = await fetchAll('Psalm & Tune CPRC')
  for (const r of records) {
    const linkedEventIds = (r.get('Event') as string[] | null) ?? []
    const linkedPsalmVersionIds = (r.get('Psalm') as string[] | null) ?? []
    const linkedTuneIds = (r.get("Today's Chosen Tune") as string[] | null) ?? []

    const eventId = linkedEventIds.length > 0 ? eventIdMap.get(linkedEventIds[0]) ?? null : null
    const psalmId = linkedPsalmVersionIds.length > 0 ? psalmVersionToPsalmIdMap.get(linkedPsalmVersionIds[0]) ?? null : null
    const tuneId = linkedTuneIds.length > 0 ? tuneIdMap.get(linkedTuneIds[0]) ?? null : null

    await db.insert(schema.serviceItems).values({
      airtableId: r.id,
      eventId,
      psalmId,
      tuneId,
      versesSung: str(r.get('Verses/stanzas')),
      position: parsePosition(r.get('Order') as string | undefined),
    }).onConflictDoUpdate({
      target: schema.serviceItems.airtableId,
      set: {
        eventId: sql`excluded.event_id`,
        psalmId: sql`excluded.psalm_id`,
        tuneId: sql`excluded.tune_id`,
        versesSung: sql`excluded.verses_sung`,
        position: sql`excluded.position`,
      },
    })
  }
  console.log(`  Service Items: ${records.length} records`)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Airtable → PostgreSQL Migration ===')
  console.log(`Base: ${BASE_ID}`)
  console.log('')

  console.log('--- Pass 1: Primary Tables ---')
  const moodIdMap = await migrateMoods()
  const navesTopicIdMap = await migrateNavesTopics()
  const topicIdMap = await migrateTopics()
  const doctrineIdMap = await migrateDoctrines()
  const psalmIdMap = await migratePsalms()
  const tuneIdMap = await migrateTunes()              // includes local JPG download
  const { psalmVersionIdMap, psalmVersionToPsalmIdMap } = await migratePsalmVersions(psalmIdMap)
  const verseIdMap = await migrateVerses(psalmIdMap)
  const eventIdMap = await migrateEvents()
  await migrateMessianicPsalms(psalmIdMap)
  await migrateSectionHeadings(psalmIdMap)
  await migrateDailyReadings(psalmIdMap)

  console.log('')
  console.log('--- Pass 2: Junction Tables ---')
  await migratePsalmTopics(psalmIdMap, topicIdMap)
  await migratePsalmVersionTunes(psalmVersionIdMap, tuneIdMap)
  await migrateTuneMoods(tuneIdMap, moodIdMap)
  await migrateVerseNavesTopics(verseIdMap, navesTopicIdMap)
  await migrateVerseDoctrines(verseIdMap, doctrineIdMap)
  await migrateServiceItems(eventIdMap, psalmVersionToPsalmIdMap, tuneIdMap)

  console.log('')
  console.log('=== Migration complete ===')
  await client.end()
}

main().catch(async (err) => {
  console.error('Migration failed:', err)
  await client.end()
  process.exit(1)
})
