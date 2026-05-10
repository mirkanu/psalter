import { db } from "@/db"
import { psalms, psalmVersions, psalmVersionTunes, tunes } from "@/db/schema"
import { eq, asc, sql, and } from "drizzle-orm"
import { PsalmListingGrid } from "@/components/PsalmListingGrid"
import { deriveVersionSlug, stripStar } from "@/lib/psalm-slugs"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Psalms | CPRC Psalter",
  description: "Browse all 150 psalms of the Scottish Psalter.",
}

function extractSectionNum(pn: string | null): number | null {
  if (!pn) return null
  const m = pn.match(/\((\d+)\)$/)
  return m ? parseInt(m[1], 10) : null
}

export default async function PsalmsPage() {
  const rows = await db
    .select({
      id: psalms.id,
      versionId: psalmVersions.id,
      firstLine: psalmVersions.firstLine,
      meter: psalmVersions.meter,
      psalterNumber: psalmVersions.psalterNumber,
      kjvExcerpt: sql<string>`LEFT(${psalms.kjvText}, 120)`.as('kjv_excerpt'),
      recommendedTune: tunes.name,
    })
    .from(psalms)
    .leftJoin(psalmVersions, eq(psalmVersions.psalmId, psalms.id))
    .leftJoin(
      psalmVersionTunes,
      and(
        eq(psalmVersionTunes.psalmVersionId, psalmVersions.id),
        eq(psalmVersionTunes.isPrimary, true)
      )
    )
    .leftJoin(tunes, eq(tunes.id, psalmVersionTunes.tuneId))
    .orderBy(asc(psalms.id), asc(psalmVersions.id))

  // Count versions per psalm
  const countById = new Map<number, number>()
  for (const row of rows) {
    countById.set(row.id, (countById.get(row.id) ?? 0) + 1)
  }

  // Sort: by psalm id, then by section number (psalm 119) or version id
  const sorted = [...rows].sort((a, b) => {
    if (a.id !== b.id) return a.id - b.id
    const aNum = extractSectionNum(a.psalterNumber)
    const bNum = extractSectionNum(b.psalterNumber)
    if (aNum !== null && bNum !== null) return aNum - bNum
    return (a.versionId ?? 0) - (b.versionId ?? 0)
  })

  const listRows = sorted.map((row) => {
    const isMulti = (countById.get(row.id) ?? 1) > 1
    const rawLabel = deriveVersionSlug(row.id, row.psalterNumber, isMulti)
    const displayLabel = rawLabel  // e.g. "6a*", "119-1-8" → display as-is but replace - with : for 119
    const slug = stripStar(rawLabel)
    return {
      id: row.id,
      displayLabel: rawLabel.replace(/^(\d+)-(\d+-\d+)$/, '$1:$2'), // "119-1-8" → "119:1-8"
      slug,
      firstLine: row.firstLine,
      meter: row.meter,
      kjvExcerpt: row.kjvExcerpt,
      recommendedTune: row.recommendedTune,
    }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      <div className="mb-6 mt-4">
        <h1 className="font-sans text-3xl md:text-4xl font-bold text-foreground mb-3">
          Psalms
        </h1>
        <p className="text-muted-foreground text-base">
          Browse all 150 psalms of the Scottish Psalter.
        </p>
      </div>
      <PsalmListingGrid psalms={listRows} />
    </div>
  )
}
