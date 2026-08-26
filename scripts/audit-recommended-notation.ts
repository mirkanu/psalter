import { db } from '@/db'
import { psalmVersionTunes, tunes } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { deriveTuneJpgPages } from '@/lib/tune-jpg-urls'

async function main() {
  const rows = await db.select({
    id: tunes.id, name: tunes.name, meter: tunes.meter, abc: tunes.abcNotation,
  }).from(psalmVersionTunes).innerJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))

  const seen = new Map<number, typeof rows[number]>()
  for (const r of rows) if (!seen.has(r.id)) seen.set(r.id, r)

  const gaps: string[] = []
  for (const t of seen.values()) {
    const { staffPages, solfegePages } = deriveTuneJpgPages(t.name)
    const hasAbc = !!(t.abc && t.abc.trim())
    if (!hasAbc || staffPages.length === 0) {
      gaps.push(`${hasAbc ? 'ABC ok ' : 'ABC MISSING'} | staff:${staffPages.length} solfege:${solfegePages.length} | #${t.id} ${t.name} [${t.meter ?? '-'}]`)
    }
  }
  console.log(`recommended tunes: ${seen.size}`)
  console.log(gaps.sort().join('\n'))
}

main().then(() => process.exit(0))
