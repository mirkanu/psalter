export const dynamic = 'force-dynamic'

import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { eq, asc } from 'drizzle-orm'
import { fetchPsalmListRows } from '@/db/queries/psalms'
import { fetchAllTunes } from '@/db/queries/tunes'
import { SetDetail } from '@/components/precent/SetDetail'
import type { PsalmRow } from '@/components/PsalmListingGrid'
import type { TuneRow } from '@/components/TuneTable'

export default async function PrecentSetPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const setId = parseInt(id)
  if (isNaN(setId)) notFound()

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

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

  if (set.userId !== session.user.id && session.user.role !== 'admin') notFound()

  const psalmListRows: PsalmRow[] = await fetchPsalmListRows()
  const allTunes: TuneRow[] = (await fetchAllTunes()) as TuneRow[]

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
    />
  )
}
