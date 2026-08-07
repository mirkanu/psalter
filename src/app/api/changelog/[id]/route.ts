/**
 * Changelog edit endpoint (Phase 09 follow-up).
 *
 * Same admin gate as POST /api/changelog, but deliberately does NOT call
 * broadcastToSubscribers — re-emailing every subscriber on every typo fix would be wrong.
 * `ChangelogPostCard`'s session check controls whether the edit UI is rendered — it is a
 * UI affordance, not authorization. Never relax the server-side gate below.
 */
import { NextResponse } from 'next/server'
import { getAdminSessionOr401 } from '@/lib/admin-auth'
import { updateChangelogPost } from '@/db/queries/changelog'
import { MAX_TITLE, MAX_BODY } from '../route'

export const dynamic = 'force-dynamic'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  const { id: rawId } = await params
  const id = Number(rawId)
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'invalid post id' }, { status: 400 })
  }

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

  let updated
  try {
    updated = await updateChangelogPost(id, { title, body })
  } catch (err) {
    console.error('[changelog] DB update failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }

  if (!updated) return NextResponse.json({ error: 'post not found' }, { status: 404 })

  return NextResponse.json({ ok: true })
}
