import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const { authMock, insertMock, valuesMock, broadcastMock } = vi.hoisted(() => {
  const authMock = vi.fn(async () => ({ session: { user: { id: 'u1', role: 'admin' } }, res: null }))
  const valuesMock = vi.fn(async (_v: unknown) => undefined)
  const insertMock = vi.fn(() => ({ values: valuesMock }))
  const broadcastMock = vi.fn(async (_p: unknown) => ({ sent: 0, failed: 0 }))
  return { authMock, insertMock, valuesMock, broadcastMock }
})
vi.mock('@/db', () => ({ db: { insert: insertMock } }))
vi.mock('@/lib/admin-auth', () => ({ getAdminSessionOr401: authMock }))
vi.mock('@/lib/changelog-broadcast', () => ({ broadcastToSubscribers: broadcastMock }))

import * as routeModule from './route'
import { POST } from './route'

function req(body: unknown) {
  return new Request('http://test/api/changelog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

async function flush() {
  // Lets the detached `void broadcastToSubscribers(...)` promise settle before assertions.
  await new Promise((resolve) => setTimeout(resolve, 0))
}

describe('POST /api/changelog', () => {
  beforeEach(() => {
    authMock.mockClear()
    insertMock.mockClear()
    valuesMock.mockClear()
    broadcastMock.mockClear()
    authMock.mockImplementation(async () => ({ session: { user: { id: 'u1', role: 'admin' } }, res: null }))
    valuesMock.mockImplementation(async () => undefined)
    broadcastMock.mockImplementation(async () => ({ sent: 0, failed: 0 }))
  })

  it('returns 401 and performs no insert/broadcast when unauthenticated', async () => {
    authMock.mockImplementationOnce(async () => ({
      session: null,
      res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }))
    const res = await POST(req({ title: 't', body: 'b' }))
    expect(res.status).toBe(401)
    expect(insertMock).not.toHaveBeenCalled()
    await flush()
    expect(broadcastMock).not.toHaveBeenCalled()
  })

  it('returns 403 and performs no insert/broadcast for a non-admin session', async () => {
    authMock.mockImplementationOnce(async () => ({
      session: null,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }))
    const res = await POST(req({ title: 't', body: 'b' }))
    expect(res.status).toBe(403)
    expect(insertMock).not.toHaveBeenCalled()
    await flush()
    expect(broadcastMock).not.toHaveBeenCalled()
  })

  it('returns 200 with exactly { ok: true } for an admin session with valid title and body', async () => {
    const res = await POST(req({ title: 'Title', body: 'Body' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('calls the insert once with trimmed title and body, and nothing else', async () => {
    await POST(req({ title: '  Title  ', body: '  Body  ' }))
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({ title: 'Title', body: 'Body' })
  })

  it('calls broadcastToSubscribers exactly once with { title, body } after a successful insert', async () => {
    await POST(req({ title: 'Title', body: 'Body' }))
    await flush()
    expect(broadcastMock).toHaveBeenCalledTimes(1)
    expect(broadcastMock).toHaveBeenCalledWith({ title: 'Title', body: 'Body' })
  })

  it('returns 400 with no insert/broadcast for a missing/blank title', async () => {
    const res = await POST(req({ title: '  ', body: 'Body' }))
    expect(res.status).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
    await flush()
    expect(broadcastMock).not.toHaveBeenCalled()
  })

  it('returns 400 with no insert/broadcast for a missing/blank body', async () => {
    const res = await POST(req({ title: 'Title', body: '   ' }))
    expect(res.status).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
    await flush()
    expect(broadcastMock).not.toHaveBeenCalled()
  })

  it('returns 400 for a title longer than MAX_TITLE', async () => {
    const res = await POST(req({ title: 'x'.repeat(routeModule.MAX_TITLE + 1), body: 'Body' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a body longer than MAX_BODY', async () => {
    const res = await POST(req({ title: 'Title', body: 'x'.repeat(routeModule.MAX_BODY + 1) }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for a non-JSON body', async () => {
    const res = await POST(req('not json'))
    expect(res.status).toBe(400)
  })

  it('returns 500 and never fires the broadcast when the insert throws', async () => {
    valuesMock.mockImplementationOnce(async () => {
      throw new Error('db down')
    })
    const res = await POST(req({ title: 'Title', body: 'Body' }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'internal error' })
    await flush()
    expect(broadcastMock).not.toHaveBeenCalled()
  })

  it('still returns 200 { ok: true } when broadcastToSubscribers rejects', async () => {
    broadcastMock.mockImplementationOnce(async () => {
      throw new Error('mail down')
    })
    const res = await POST(req({ title: 'Title', body: 'Body' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    await flush()
  })

  it('exports no GET handler', () => {
    expect((routeModule as Record<string, unknown>).GET).toBeUndefined()
  })
})
