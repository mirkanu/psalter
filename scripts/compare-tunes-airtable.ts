import 'dotenv/config'

const AIRTABLE_BASE = 'appY3dB1EHtex0fUJ'
const TUNES_TABLE = 'tblEzjKnaL4DlhDO5'
const PAT = process.env.AIRTABLE_PAT!

async function fetchAll() {
  const records: Array<Record<string, unknown>> = []
  let offset: string | undefined

  do {
    const fields = [
      'Tune Name',
      'Number in 1979 RP Psalter',
      '# in PRCA Psalter',
      'Famous Hymn',
      'In PRCA Psalter',
      'Has famous hymn',
      'Tune (web)',
    ]
    const fieldsParam = fields.map(f => `fields[]=${encodeURIComponent(f)}`).join('&')
    let urlStr = `https://api.airtable.com/v0/${AIRTABLE_BASE}/${TUNES_TABLE}?${fieldsParam}&pageSize=100`
    if (offset) urlStr += `&offset=${encodeURIComponent(offset)}`

    const res = await fetch(urlStr, { headers: { Authorization: `Bearer ${PAT}` } })
    if (!res.ok) throw new Error(`Airtable error: ${res.status} ${await res.text()}`)
    const data = await res.json() as { records: Array<{ id: string; fields: Record<string, unknown> }>; offset?: string }
    records.push(...data.records.map(r => ({ id: r.id, ...r.fields })))
    offset = data.offset
  } while (offset)

  return records
}

async function main() {
  const records = await fetchAll()
  console.log(`Total Airtable tunes: ${records.length}`)
  
  const with1979rp = records.filter(r => r['Number in 1979 RP Psalter'] != null)
  const with1912prca = records.filter(r => r['# in PRCA Psalter'] != null)
  const withInPrca = records.filter(r => r['In PRCA Psalter'])
  const withFamousHymn = records.filter(r => r['Famous Hymn'])
  const withTuneWeb = records.filter(r => r['Tune (web)'])
  const withSoundcloud = records.filter(r => typeof r['Tune (web)'] === 'string' && (r['Tune (web)'] as string).includes('soundcloud.com'))

  console.log(`  Has 1979 RP#: ${with1979rp.length}`)
  console.log(`  Has 1912 PRCA#: ${with1912prca.length}`)
  console.log(`  In PRCA Psalter: ${withInPrca.length}`)
  console.log(`  Has Famous Hymn text: ${withFamousHymn.length}`)
  console.log(`  Has Tune (web): ${withTuneWeb.length}`)
  console.log(`  Has SoundCloud URL: ${withSoundcloud.length}`)
  
  // Show a few samples
  console.log('\nSample SoundCloud entries:')
  withSoundcloud.slice(0, 5).forEach(r => console.log(`  ${r['Tune Name']}: ${r['Tune (web)']}` ))
  
  process.exit(0)
}
main().catch(e => { console.error(e); process.exit(1) })
