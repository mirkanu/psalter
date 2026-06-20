import { NextResponse } from 'next/server'
import { db } from '@/db'
import { feedbackSubmissions } from '@/db/schema'

export const dynamic = 'force-dynamic'

const MAX_MESSAGE = 5000
const MAX_SHORT = 200

export async function POST(req: Request) {
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

  return NextResponse.json({ ok: true })
}
