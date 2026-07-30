import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export type AdminSession = { user: { id: string; role: string } }

/**
 * Returns the session only if it belongs to an admin.
 * Distinguishes 401 (no session) from 403 (session, wrong role) so callers and
 * logs can tell "not logged in" from "logged in, not allowed".
 */
export async function getAdminSessionOr401(): Promise<
  { session: AdminSession; res: null } | { session: null; res: NextResponse }
> {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as AdminSession | null

  if (!session) {
    return { session: null, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (session.user.role !== 'admin') {
    return { session: null, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { session, res: null }
}
