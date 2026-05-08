import { cache } from "react"
import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { tunes } from "@/db/schema"

export async function fetchTuneIds(): Promise<number[]> {
  const rows = await db.select({ id: tunes.id }).from(tunes).orderBy(asc(tunes.id))
  return rows.map((r) => r.id)
}

export async function fetchAllTunes() {
  return db.select({
    id: tunes.id,
    name: tunes.name,
    meter: tunes.meter,
    scoreJpgUrl: tunes.scoreJpgUrl,
  }).from(tunes).orderBy(asc(tunes.name))
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
