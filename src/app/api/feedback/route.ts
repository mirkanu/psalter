import { NextResponse } from 'next/server'
import { db } from '@/db'
import { feedbackSubmissions } from '@/db/schema'

export const dynamic = 'force-dynamic'

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

  await db.insert(feedbackSubmissions).values({
    message,
    name: typeof body.name === 'string' ? body.name.trim() || null : null,
    email: typeof body.email === 'string' ? body.email.trim() || null : null,
    pageUrl: typeof body.pageUrl === 'string' ? body.pageUrl.trim() || null : null,
  })

  return NextResponse.json({ ok: true })
}
