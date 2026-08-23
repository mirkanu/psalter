#!/usr/bin/env npx tsx
/**
 * Airtable → PostgreSQL backfill: psalms.nkjv_title
 * Run: npx tsx scripts/backfill-nkjv-titles.ts
 *
 * Reads the Airtable "Psalms" table's "Chapter Titles (NKJV)" lookup field
 * and writes the first value into the new nullable psalms.nkjv_title column.
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
  const records = await base('Psalms').select({ pageSize: 100 }).all()

  // Pitfall guard: log the real field names before the loop so a field-name
  // mismatch surfaces immediately instead of silently writing 0 rows.
  if (records.length > 0) console.log('Fields:', Object.keys(records[0].fields))

  let updated = 0
  for (const r of records) {
    const raw = r.get('Chapter Titles (NKJV)')
    const value = Array.isArray(raw) ? raw[0] : raw
    const nkjvTitle = typeof value === 'string' && value.trim() !== '' ? value.trim() : null
    if (nkjvTitle === null) continue

    await db.update(schema.psalms)
      .set({ nkjvTitle })
      .where(eq(schema.psalms.airtableId, r.id))
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
