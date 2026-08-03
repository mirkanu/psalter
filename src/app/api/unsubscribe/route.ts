/**
 * Unsubscribe endpoint (Phase 9, CHLG-05).
 *
 * POST-only by design. The token travels in an emailed link, and corporate/Outlook
 * link-prescanners routinely issue GET requests against every URL in a message. A GET
 * handler here would silently unsubscribe real subscribers who never opened the email —
 * a failure mode Phase 07's own delivery-evidence doc flags as a live risk for this
 * sending domain. The landing page at /changelog/unsubscribe reads the token and renders
 * a button; only that button's POST mutates anything.
 */
import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { changelogSubscribers } from '@/db/schema'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 })
  }

  const token = typeof body.token === 'string' ? body.token.trim() : ''
  if (!token) {
    return NextResponse.json({ error: 'invalid token' }, { status: 400 })
  }

  let deleted: { id: number }[]
  try {
    deleted = await db
      .delete(changelogSubscribers)
      .where(eq(changelogSubscribers.unsubscribeToken, token))
      .returning({ id: changelogSubscribers.id })
  } catch (err) {
    console.error('[unsubscribe] DB delete failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'invalid or already-used token' }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
