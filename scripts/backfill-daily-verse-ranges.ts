#!/usr/bin/env npx tsx
/**
 * Airtable → PostgreSQL backfill: daily_readings.starting_verse + ending_verse
 * Run: npx tsx scripts/backfill-daily-verse-ranges.ts
 *
 * Reads the Airtable "365 Days" table and writes Starting Verse / Ending Verse
 * values into the two new nullable integer columns added in Phase 05.3.
 */

import 'dotenv/config'
import Airtable from 'airtable'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const BASE_ID = 'appY3dB1EHtex0fUJ'
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(BASE_ID)

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}
const client = postgres(process.env.DATABASE_URL)
const db = drizzle({ client, schema })

async function main() {
  const records = await base('365 Days').select({ pageSize: 100 }).all()

  // Pitfall 4 guard: log the real field names before the loop so a field-name
  // mismatch surfaces immediately instead of silently writing 0 rows.
  if (records.length > 0) console.log('Fields:', Object.keys(records[0].fields))

  let updated = 0
  for (const r of records) {
    const startingVerse = typeof r.get('Starting Verse') === 'number'
      ? (r.get('Starting Verse') as number)
      : null
    const endingVerse = typeof r.get('Ending Verse') === 'number'
      ? (r.get('Ending Verse') as number)
      : null
    if (startingVerse === null && endingVerse === null) continue

    await db.update(schema.dailyReadings)
      .set({ startingVerse, endingVerse })
      .where(eq(schema.dailyReadings.airtableId, r.id))
    updated++
  }
  console.log(`Updated ${updated}/${records.length} records`)
  await client.end()
}

main().catch(async (err) => {
  console.error('Backfill failed:', err)
  await client.end()
  process.exit(1)
})
