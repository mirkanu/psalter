export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/db'
import { precentingSets, setItems, users } from '@/db/schema'
import { desc, asc, eq } from 'drizzle-orm'
import { Separator } from '@/components/ui/separator'
import { PrecentingSetList } from '@/components/precent/PrecentingSetList'
import { CreateSetForm } from '@/components/precent/CreateSetForm'
import { fetchPsalmListRows } from '@/db/queries/psalms'
import { ViewingAsBar } from '@/components/precent/ViewingAsBar'

export default async function PrecentPage({
  searchParams,
}: { searchParams: Promise<{ as?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const isAdmin = session.user.role === 'admin'
  const { as } = await searchParams
  const targetUserId = isAdmin && as ? as : session.user.id   // D-14/D-16

  const [sets, psalmListRows, allUsers] = await Promise.all([
    db.query.precentingSets.findMany({
      where: eq(precentingSets.userId, targetUserId),
      orderBy: [desc(precentingSets.date), desc(precentingSets.id)],
      with: {
        user: { columns: { name: true } },
        setItems: { columns: { psalmId: true, position: true }, orderBy: [asc(setItems.position)] },
      },
    }),
    fetchPsalmListRows(),
    isAdmin ? db.select({ id: users.id, name: users.name }).from(users) : Promise.resolve([]),
  ])

  const serialized = sets.map((s) => ({
    id: s.id,
    date: String(s.date),
    type: s.type,
    precentorName: s.user?.name ?? '',   // D-18: derived via JOIN
    psalmIds: s.setItems.map((i) => i.psalmId),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {isAdmin && (
        <ViewingAsBar
          users={allUsers}
          selfId={session.user.id}
          selectedId={targetUserId}
        />
      )}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">My Psalm Sets for Precenting</h1>
        <CreateSetForm psalms={psalmListRows} targetUserId={isAdmin && as ? as : undefined} />
      </div>
      <Separator className="mb-4" />
      <PrecentingSetList sets={serialized} />
    </div>
  )
}
