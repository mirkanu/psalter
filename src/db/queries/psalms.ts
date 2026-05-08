import { db } from "@/db"
import { eq, asc } from "drizzle-orm"
import { psalms } from "@/db/schema"

export async function fetchPsalmIds(): Promise<number[]> {
  const rows = await db.select({ id: psalms.id }).from(psalms).orderBy(asc(psalms.id))
  return rows.map((r) => r.id)
}

export async function fetchPsalmDetail(id: number) {
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
    },
  })
}

export type PsalmDetail = NonNullable<Awaited<ReturnType<typeof fetchPsalmDetail>>>
