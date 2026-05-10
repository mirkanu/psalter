/**
 * Backfill PRCA/RP Psalter fields for tunes table from Airtable.
 * Fields added: in_prca_psalter, has_famous_hymn, famous_hymn,
 *               number_in_1979_rp_psalter, num_in_prca_psalter
 */
import 'dotenv/config'
import Airtable from 'airtable'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { eq, sql } from 'drizzle-orm'

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

  let updated = 0
  for (const r of records) {
    const airtableId = r.id
    const inPrcaPsalter = !!(r.get('In PRCA Psalter') as boolean | undefined)
    const hasFamousHymn = !!(r.get('Has famous hymn') as boolean | undefined)
    const famousHymn = (r.get('Famous Hymn') as string | undefined) ?? null
    const numberIn1979 = (r.get('Number in 1979 RP Psalter') as number | undefined) ?? null
    const numInPrca = (r.get('# in PRCA Psalter') as number | undefined) ?? null

    const result = await db
      .update(tunes)
      .set({
        inPrcaPsalter,
        hasFamousHymn,
        famousHymn,
        numberIn1979RpPsalter: numberIn1979,
        numInPrcaPsalter: numInPrca,
      })
      .where(eq(tunes.airtableId, airtableId))

    if ((result as unknown as { rowCount: number }).rowCount > 0) updated++
  }

  console.log(`Updated ${updated} tunes`)
  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
