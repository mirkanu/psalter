import 'dotenv/config'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { sql, isNull, isNotNull } from 'drizzle-orm'

async function main() {
  const rows = await db.select({
    total: sql<number>`COUNT(*)`,
    has_airtable_id: sql<number>`COUNT(airtable_id)`,
    has_soundcloud: sql<number>`COUNT(soundcloud_url)`,
    has_1979rp: sql<number>`COUNT(number_in_1979_rp_psalter)`,
    has_1912prca: sql<number>`COUNT(num_in_prca_psalter)`,
    in_prca_true: sql<number>`COUNT(CASE WHEN in_prca_psalter THEN 1 END)`,
    has_famous_hymn: sql<number>`COUNT(famous_hymn)`,
  }).from(tunes)
  console.log('DB counts:', JSON.stringify(rows[0], null, 2))

  // Sample some airtable IDs
  const sample = await db.select({ id: tunes.id, name: tunes.name, airtableId: tunes.airtableId }).from(tunes).limit(5)
  console.log('Sample tunes:', JSON.stringify(sample, null, 2))
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
