import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { psalms, psalmVersions } from "@/db/schema"

export async function fetchPsalmIds(): Promise<number[]> {
  const rows = await db.select({ id: psalms.id }).from(psalms).orderBy(asc(psalms.id))
  return rows.map((r) => r.id)
}

/**
 * Memoised with React cache() so that generateMetadata and the page
 * component share a single DB query per request rather than making two.
 */
export const fetchPsalmDetail = cache(async function fetchPsalmDetail(id: number) {
  return db.query.psalms.findFirst({
    where: eq(psalms.id, id),
    with: {
      psalmVersions: {
        with: {
          psalmVersionTunes: {
            with: { tune: true },
          },
        },
      },
      verses: {
        with: {
          verseNavesTopics: { with: { navesTopic: true } },
          verseDoctrines: { with: { doctrine: true } },
        },
        orderBy: (v, { asc }) => [asc(v.verseNumber)],
      },
      sectionHeadings: { orderBy: (s, { asc }) => [asc(s.verseStart)] },
      messianicPsalms: true,
      dailyReadings: {
        columns: { id: true, dayNumber: true, readingDate: true, notes: true },
        limit: 1,
      },
      psalmTopics: {
        with: { topic: { columns: { id: true, name: true, topicType: true } } },
      },
    },
  })
})

export type PsalmDetail = NonNullable<Awaited<ReturnType<typeof fetchPsalmDetail>>>

export type PsalmDailyEntry = NonNullable<PsalmDetail['dailyReadings']>[number]
export type PsalmTuneLink = NonNullable<
  PsalmDetail['psalmVersions'][number]['psalmVersionTunes'][number]
>

/** Returns unique psalms that have at least one version with the given meter. */
export async function fetchPsalmsByMeter(meter: string): Promise<{ id: number; bibleTitle: string | null }[]> {
  const rows = await db.query.psalmVersions.findMany({
    where: eq(psalmVersions.meter, meter),
    columns: { psalmId: true },
    with: { psalm: { columns: { id: true, bibleTitle: true } } },
  })
  const seen = new Set<number>()
  const result: { id: number; bibleTitle: string | null }[] = []
  for (const row of rows) {
    const psalm = row.psalm
    if (psalm?.id != null && !seen.has(psalm.id)) {
      seen.add(psalm.id)
      result.push({ id: psalm.id, bibleTitle: psalm.bibleTitle })
    }
  }
  return result.sort((a, b) => a.id - b.id)
}
