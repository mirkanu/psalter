import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { precentingSets } from '@/db/schema'
import { eq } from 'drizzle-orm'

export type Session = { user: { id: string; role: string } }

/** Pure predicate — owner or admin may mutate. Unit-tested. */
export function canAccessSet(
  set: { userId: string },
  session: { user: { id: string; role: string } },
): boolean {
  return set.userId === session.user.id || session.user.role === 'admin'
}

/** Returns the session or a 401 NextResponse (caller returns it on truthy). */
export async function getSessionOr401(): Promise<
  { session: Session; res: null } | { session: null; res: NextResponse }
> {
  const session = (await auth.api.getSession({ headers: await headers() })) as Session | null
  if (!session) {
    return { session: null, res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { session, res: null }
}

/** Loads a set and enforces ownership/admin. Returns the set or a NextResponse error. */
export async function loadSetWithAccess(
  setId: number,
  session: Session,
): Promise<{ set: { id: number; userId: string }; res: null } | { set: null; res: NextResponse }> {
  const set = await db.query.precentingSets.findFirst({
    where: eq(precentingSets.id, setId),
    columns: { id: true, userId: true },
  })
  if (!set) return { set: null, res: NextResponse.json({ error: 'set not found' }, { status: 404 }) }
  if (!canAccessSet(set, session)) {
    return { set: null, res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { set, res: null }
}
