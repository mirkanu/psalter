export const dynamic = 'force-static'
export const revalidate = false

import { notFound } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems, psalmVersions } from '@/db/schema'
import { eq, asc, inArray } from 'drizzle-orm'
import { fetchPsalmListRows } from '@/db/queries/psalms'
import { fetchAllTunes, fetchPsalmVersionTuneTiers, type PsalmVersionTuneTiers } from '@/db/queries/tunes'
import { SetDetail } from '@/components/precent/SetDetail'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { TuneRow } from '@/components/TuneTable'

// Phase 19 PERF-02: enumerate every precenting set id so Next.js can pre-render
// each /precent/[id] page statically at deploy (matched by the Cloudflare Cache
// Rule in 19-01-PLAN). Bounds: O(distinct sets); current data is < 10 total.
export async function generateStaticParams() {
  try {
    const rows = await db.select({ id: precentingSets.id }).from(precentingSets)
    return rows.map((r) => ({ id: String(r.id) }))
  } catch (err) {
    console.error(`[generateStaticParams] DB unreachable for precenting sets:`, err)
    return []
  }
}

export default async function PrecentSetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) notFound()

  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    with: {
      user: { columns: { name: true } },
      setItems: {
        orderBy: [asc(setItems.position)],
        with: {
          psalm: { columns: { id: true, bibleTitle: true } },
          tune: { columns: { id: true, name: true, meter: true } },
        },
      },
    },
  })

  if (!set) notFound()

  // Phase 19 PERF-02: /precent/[id] is de-auth-gated (the precentor's own set
  // contains no confidential content). Per issue #82 plan-as-comment: the data
  // is the precentor's own service plan (psalms + tunes + verse ranges). No
  // PII, no notes, no secrets. The set is discoverable only via guessing the
  // numeric id. Owner-only data not personally identifying-sensitive.
  const psalmListRows: PsalmRow[] = await fetchPsalmListRows()
  const allTunes: TuneRow[] = (await fetchAllTunes()) as TuneRow[]

  // setItems.psalmVersionId is nullable — it only records an EXPLICIT a/b version choice (see
  // schema.ts comment on setItems.psalmVersionId). Most set items reference a single-version psalm
  // and never get one written, unlike /psalms/[id]/page.tsx which always resolves an `activeVersion`
  // (defaulting to the lowest-id version) regardless of whether the slug names one explicitly. Without
  // the same fallback here, single-version-psalm set items silently got tuneTiers=null and the
  // "Historically sung for this psalm" section never appeared in the /precent tune picker — the tiers
  // logic was correct, but most items simply had no version id to key off.
  const psalmIdsNeedingDefaultVersion = [...new Set(
    set.setItems.filter((i) => i.psalmVersionId == null).map((i) => i.psalmId)
  )]
  const defaultVersionRows = psalmIdsNeedingDefaultVersion.length
    ? await db
        .select({ id: psalmVersions.id, psalmId: psalmVersions.psalmId })
        .from(psalmVersions)
        .where(inArray(psalmVersions.psalmId, psalmIdsNeedingDefaultVersion))
        .orderBy(asc(psalmVersions.id))
    : []
  // First row per psalmId wins (orderBy id asc), matching /psalms/[id]/page.tsx's
  // `sortedVersions[0]` default-version convention.
  const defaultVersionIdByPsalmId: Record<number, number> = {}
  for (const row of defaultVersionRows) {
    if (row.psalmId != null && !(row.psalmId in defaultVersionIdByPsalmId)) {
      defaultVersionIdByPsalmId[row.psalmId] = row.id
    }
  }
  const effectiveVersionIdByItemId: Record<number, number | null> = {}
  for (const item of set.setItems) {
    effectiveVersionIdByItemId[item.id] =
      item.psalmVersionId ?? defaultVersionIdByPsalmId[item.psalmId] ?? null
  }

  // TSEL-01/D-13: Backup/Historical tune ids for every distinct psalm version in this set, fetched once
  // server-side. SetDetail is a client component and cannot call the DB; batching here mirrors how allTunes
  // is already loaded above rather than adding a client-callable API route.
  const uniqueVersionIds = [...new Set(
    Object.values(effectiveVersionIdByItemId).filter((v): v is number => v != null)
  )]
  const tierEntries = await Promise.all(
    uniqueVersionIds.map(async (vid) => [vid, await fetchPsalmVersionTuneTiers(vid)] as const)
  )
  const tuneTiersByVersionId: Record<number, PsalmVersionTuneTiers> = Object.fromEntries(tierEntries)

  // Build psalm meter map: psalmId → first meter found in psalmListRows
  const psalmMeterById: Record<number, string | null> = {}
  for (const row of psalmListRows) {
    if (!(row.id in psalmMeterById)) {
      psalmMeterById[row.id] = row.meter ?? null
    }
  }

  // Serialize: convert Date/timestamp objects to strings for client boundary
  const serializedSet = {
    id: set.id,
    date: String(set.date),
    type: set.type,
    note: set.note ?? null,
    userId: set.userId,
    precentorName: set.user?.name ?? '',   // D-18: derived via JOIN
    createdAt: set.createdAt.toISOString(),
    updatedAt: set.updatedAt.toISOString(),
    setItems: set.setItems.map((item) => ({
      id: item.id,
      setId: item.setId,
      psalmId: item.psalmId,
      tuneId: item.tuneId ?? null,
      psalmVersionId: item.psalmVersionId ?? null,
      // Resolved fallback for tune-tier lookups only — see comment above. Distinct from
      // psalmVersionId (which stays null/explicit-only for the a/b version-select UI).
      effectiveVersionId: effectiveVersionIdByItemId[item.id] ?? null,
      verseRange: item.verseRange ?? null,
      position: item.position,
      psalm: item.psalm
        ? { id: item.psalm.id, bibleTitle: item.psalm.bibleTitle ?? null }
        : null,
      tune: item.tune
        ? { id: item.tune.id, name: item.tune.name, meter: item.tune.meter ?? null }
        : null,
    })),
  }

  return (
    <SetDetail
      set={serializedSet}
      psalmListRows={psalmListRows}
      allTunes={allTunes}
      psalmMeterById={psalmMeterById}
      tuneTiersByVersionId={tuneTiersByVersionId}
    />
  )
}
