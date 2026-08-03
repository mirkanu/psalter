import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { db } from '@/db'
import { changelogSubscribers } from '@/db/schema'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const MAX_EMAIL = 200
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Same 5/60s budget as /api/feedback. A human subscribes once; 5 leaves room for
// a typo-and-retry while capping a script's ability to stuff the list.
export const SUBSCRIBE_RATE_LIMIT = 5
export const SUBSCRIBE_RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  // Rate limit BEFORE validation, matching /api/feedback: a malformed-body flood
  // must not be a free bypass of the limiter.
  const ip = getClientIp(req)
  const limit = checkRateLimit(`subscribe:${ip}`, {
    limit: SUBSCRIBE_RATE_LIMIT,
    windowMs: SUBSCRIBE_RATE_WINDOW_MS,
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

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  if (!EMAIL_RE.test(emailRaw) || emailRaw.length > MAX_EMAIL) {
    return NextResponse.json({ error: 'a valid email is required' }, { status: 400 })
  }
  const email = emailRaw.toLowerCase()

  try {
    await db
      .insert(changelogSubscribers)
      .values({ email, unsubscribeToken: randomUUID() })
      .onConflictDoNothing({ target: changelogSubscribers.email })
  } catch (err) {
    console.error('[subscribe] DB insert failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }

  // Identical response whether the row was inserted or silently skipped as a
  // duplicate. Never reveal whether an address is already subscribed (T-09-11).
  return NextResponse.json({ ok: true })
}
