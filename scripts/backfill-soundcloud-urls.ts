/**
 * Backfill soundcloud_url from Airtable "Tune (web)" field.
 * The original migration incorrectly mapped "SoundCloud Status" (a quality label)
 * instead of "Tune (web)" which contains the actual SoundCloud track URL.
 */
import 'dotenv/config'
import { db } from '../src/db'
import { tunes } from '../src/db/schema'
import { eq, sql } from 'drizzle-orm'

const AIRTABLE_BASE = 'appY3dB1EHtex0fUJ'
const TUNES_TABLE = 'tblEzjKnaL4DlhDO5'
const PAT = process.env.AIRTABLE_PAT!

async function fetchAllTuneRecords() {
  const records: Array<{ airtableId: string; tuneWeb: string | null }> = []
  let offset: string | undefined

  do {
    // Build URL manually — URLSearchParams encodes [] as %5B%5D which Airtable rejects
    let urlStr = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TUNES_TABLE}?fields[]=Tune+%28web%29&fields[]=Tune+Name&pageSize=100`
    if (offset) urlStr += `&offset=${encodeURIComponent(offset)}`

    const res = await fetch(urlStr, {
      headers: { Authorization: `Bearer ${PAT}` },
    })
    if (!res.ok) throw new Error(`Airtable error: ${res.status} ${await res.text()}`)
    const data = await res.json() as { records: Array<{ id: string; fields: Record<string, unknown> }>; offset?: string }

    for (const r of data.records) {
      const tuneWeb = typeof r.fields['Tune (web)'] === 'string' ? r.fields['Tune (web)'] : null
      records.push({ airtableId: r.id, tuneWeb })
    }

    offset = data.offset
  } while (offset)

  return records
}

async function main() {
  console.log('Fetching Airtable tune records...')
  const records = await fetchAllTuneRecords()
  console.log(`Fetched ${records.length} records from Airtable`)

  const withSc = records.filter((r) => r.tuneWeb && r.tuneWeb.includes('soundcloud.com'))
  const withoutSc = records.filter((r) => !r.tuneWeb || !r.tuneWeb.includes('soundcloud.com'))
  console.log(`${withSc.length} have SoundCloud URLs, ${withoutSc.length} do not`)

  let updated = 0
  let skipped = 0

  for (const r of records) {
    const scUrl = r.tuneWeb && r.tuneWeb.includes('soundcloud.com') ? r.tuneWeb : null

    const result = await db
      .update(tunes)
      .set({ soundcloudUrl: scUrl })
      .where(eq(tunes.airtableId, r.airtableId))
      .returning({ id: tunes.id, name: tunes.name })

    if (result.length > 0) {
      if (scUrl) {
        console.log(`  ✓ ${result[0].name}: set SC URL`)
        updated++
      } else {
        skipped++
      }
    }
  }

  console.log(`\nDone. ${updated} tunes updated with SC URLs, ${skipped} left without.`)
}

main().catch(console.error).finally(() => process.exit())
