/**
 * Changelog publish endpoint (Phase 09, CHLG-02 / CHLG-05).
 *
 * This route is the ONLY real security boundary for publishing. `ChangelogComposer`'s
 * `authClient.useSession()` check controls whether the form is rendered — it is a UI
 * affordance, not authorization. Never relax the server-side gate below.
 *
 * No rate limiter: the route is admin-gated, unlike the public /api/feedback.
 */
import { NextResponse } from 'next/server'
import { db } from '@/db'
import { changelogPosts } from '@/db/schema'
import { getAdminSessionOr401 } from '@/lib/admin-auth'
import { broadcastToSubscribers } from '@/lib/changelog-broadcast'

export const dynamic = 'force-dynamic'

export const MAX_TITLE = 200
export const MAX_BODY = 20_000

export async function POST(req: Request) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  let raw: Record<string, unknown>
  try {
    raw = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  const body = typeof raw.body === 'string' ? raw.body.trim() : ''

  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (title.length > MAX_TITLE) return NextResponse.json({ error: 'title too long' }, { status: 400 })
  if (!body) return NextResponse.json({ error: 'body is required' }, { status: 400 })
  if (body.length > MAX_BODY) return NextResponse.json({ error: 'body too long' }, { status: 400 })

  try {
    await db.insert(changelogPosts).values({ title, body })
  } catch (err) {
    console.error('[changelog] DB insert failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }

  // Detached on purpose: the post is already committed and visible. Tens of sequential
  // sends would otherwise keep the admin waiting seconds for a response, and a Resend
  // outage must never turn a successful publish into an error.
  void broadcastToSubscribers({ title, body }).catch((err) =>
    console.error('[changelog] broadcast threw:', err),
  )

  return NextResponse.json({ ok: true })
}
