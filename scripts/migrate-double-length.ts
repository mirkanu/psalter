/**
 * Backfill tunes.double_length from Airtable "Double length" boolean.
 * Authoritative DCM marker. See .planning/research/scottish-psalter-structure.md §2.
 */
import 'dotenv/config'
import Airtable from 'airtable'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { eq } from 'drizzle-orm'

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT }).base(
  process.env.AIRTABLE_BASE_ID ?? 'appY3dB1EHtex0fUJ'
)

async function fetchAll(tableName: string) {
  const records: Airtable.Record<Airtable.FieldSet>[] = []
  await base(tableName).select({ pageSize: 100 }).eachPage((page, next) => {
    records.push(...page)
    next()
  })
  return records
}

async function main() {
  console.log('Fetching Tunes from Airtable...')
  const records = await fetchAll('Tunes')
  console.log(`  Got ${records.length} records`)

  const airtableDcm: string[] = []
  let updated = 0
  let dbDcmCount = 0
  for (const r of records) {
    const airtableId = r.id
    const doubleLength = !!(r.get('Double length') as boolean | undefined)
    const name = (r.get('Name') as string | undefined) ?? '(unnamed)'
    if (doubleLength) {
      airtableDcm.push(name)
      dbDcmCount++
    }

    const result = await db
      .update(tunes)
      .set({ doubleLength })
      .where(eq(tunes.airtableId, airtableId))

    if ((result as unknown as { rowCount: number }).rowCount > 0) updated++
  }

  console.log(`Updated ${updated} tunes`)
  console.log(`Airtable rows with Double length=true: ${dbDcmCount}`)
  console.log('Airtable DCM-flagged tune names:')
  for (const n of airtableDcm.sort()) console.log(`  • ${n}`)

  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
