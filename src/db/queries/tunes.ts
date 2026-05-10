import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { tunes } from "@/db/schema"

export async function fetchTuneIds(): Promise<number[]> {
  const rows = await db.select({ id: tunes.id }).from(tunes).orderBy(asc(tunes.id))
  return rows.map((r) => r.id)
}

export async function fetchAllTunes() {
  const rows = await db.query.tunes.findMany({
    columns: { id: true, name: true, meter: true, scoreJpgUrl: true },
    with: {
      tuneMoods: {
        with: { mood: { columns: { name: true } } },
      },
      psalmVersionTunes: {
        with: {
          psalmVersion: {
            columns: {},
            with: { psalm: { columns: { id: true } } },
          },
        },
      },
    },
    orderBy: (t, { asc }) => [asc(t.name)],
  })

  return rows.map((t) => ({
    id: t.id,
    name: t.name,
    meter: t.meter,
    scoreJpgUrl: t.scoreJpgUrl,
    moods: t.tuneMoods.map((tm) => tm.mood.name).filter(Boolean) as string[],
    recommendedPsalmIds: [
      ...new Set(
        t.psalmVersionTunes
          .map((pvt) => pvt.psalmVersion?.psalm?.id)
          .filter((id): id is number => id != null)
      ),
    ].sort((a, b) => a - b),
  }))
}

/**
 * Memoised with React cache() so that generateMetadata and the page
 * component share a single DB query per request rather than making two.
 */
export const fetchTuneDetail = cache(async function fetchTuneDetail(id: number) {
  return db.query.tunes.findFirst({
    where: eq(tunes.id, id),
    with: {
      psalmVersionTunes: {
        with: {
          psalmVersion: {
            columns: { id: true, lyrics: true },
            with: { psalm: true },
          },
        },
      },
      tuneMoods: { with: { mood: true } },
    },
  })
})

export type TuneDetail = NonNullable<Awaited<ReturnType<typeof fetchTuneDetail>>>
