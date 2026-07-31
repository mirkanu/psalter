import { NextResponse } from 'next/server'
import { db } from '@/db'
import { feedbackSubmissions } from '@/db/schema'
import { getClientIp, checkRateLimit } from '@/lib/rate-limit'
import { sendFeedbackNotification } from '@/lib/feedback-email'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE = 5000
const MAX_SHORT = 200

// 5 submissions per minute per IP. A human filling in a form tops out around
// 1-2/min; 5 leaves headroom for a genuine correction resend while capping a
// script at 5 emails/min.
export const FEEDBACK_RATE_LIMIT = 5
export const FEEDBACK_RATE_WINDOW_MS = 60_000

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const limit = checkRateLimit(`feedback:${ip}`, {
    limit: FEEDBACK_RATE_LIMIT,
    windowMs: FEEDBACK_RATE_WINDOW_MS,
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

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'message too long' }, { status: 400 })
  }

  const nameRaw = typeof body.name === 'string' ? body.name.trim().slice(0, MAX_SHORT) : ''
  const name = nameRaw || null

  const pageUrlRaw = typeof body.pageUrl === 'string' ? body.pageUrl.trim().slice(0, MAX_SHORT) : ''
  const pageUrl = pageUrlRaw || null

  const emailRaw = typeof body.email === 'string' ? body.email.trim() : ''
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)
  const email = emailRaw && emailValid ? emailRaw.slice(0, MAX_SHORT) : null

  try {
    await db.insert(feedbackSubmissions).values({ message, name, email, pageUrl })
  } catch (err) {
    console.error('[feedback] DB insert failed:', err)
    return NextResponse.json({ error: 'internal error' }, { status: 500 })
  }

  void sendFeedbackNotification({ message, name, email, pageUrl, submittedAt: new Date() }).catch(
    (err) => console.error('[feedback] notification email threw:', err),
  )

  return NextResponse.json({ ok: true })
}
