export const dynamic = 'force-dynamic'

import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AccountsClient } from './AccountsClient'

export default async function AccountsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session || session.user.role !== 'admin') redirect('/login')

  const result = await auth.api.listUsers({ query: {} })
  const users = (result?.users ?? []).map((u: { id: string; name: string; email: string; role?: string; createdAt: Date | string }) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role ?? 'precentor',
    createdAt: typeof u.createdAt === 'string' ? u.createdAt : u.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-4">Precentor Accounts</h1>
      <AccountsClient users={users} />
    </div>
  )
}
