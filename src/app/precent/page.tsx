export const dynamic = 'force-dynamic'

import { db } from '@/db'
import { precentingSets, setItems } from '@/db/schema'
import { desc, asc } from 'drizzle-orm'
import { Separator } from '@/components/ui/separator'
import { PrecentingSetList } from '@/components/precent/PrecentingSetList'
import { CreateSetForm } from '@/components/precent/CreateSetForm'

export default async function PrecentPage() {
  const sets = await db.query.precentingSets.findMany({
    orderBy: [desc(precentingSets.date), desc(precentingSets.id)],
    with: {
      setItems: {
        columns: { psalmId: true, position: true },
        orderBy: [asc(setItems.position)],
      },
    },
  })

  // Serialize: date column returns string from postgres.js (DATE type → 'YYYY-MM-DD')
  const serialized = sets.map((s) => ({
    id: s.id,
    date: String(s.date),
    type: s.type,
    precentorName: s.precentorName,
    psalmIds: s.setItems.map((i) => i.psalmId),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Psalm Sets for Precenting</h1>
        <CreateSetForm />
      </div>
      <Separator className="mb-4" />
      <PrecentingSetList sets={serialized} />
    </div>
  )
}
