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
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Higher budget than /api/subscribe (5/60s): unsubscribe tokens have 122 bits of
// entropy (brute force infeasible — see 09-02-SUMMARY.md), so this limit exists to
// stop request-volume abuse, not to protect a guessable secret. A generous cap
// avoids punishing a real subscriber who double-clicks or re-opens the email link.
export const UNSUBSCRIBE_RATE_LIMIT = 20
export const UNSUBSCRIBE_RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  // Rate limit BEFORE body parsing, matching /api/subscribe: a malformed-body
  // flood must not be a free bypass of the limiter.
  const ip = getClientIp(req)
  const limit = checkRateLimit(`unsubscribe:${ip}`, {
    limit: UNSUBSCRIBE_RATE_LIMIT,
    windowMs: UNSUBSCRIBE_RATE_WINDOW_MS,
  })
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'too many requests', retryAfterSeconds: limit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    )
  }

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
