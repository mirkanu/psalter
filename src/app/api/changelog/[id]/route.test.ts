import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextResponse } from 'next/server'

const { authMock, updateMock } = vi.hoisted(() => {
  const authMock = vi.fn(async () => ({ session: { user: { id: 'u1', role: 'admin' } }, res: null }))
  const updateMock = vi.fn(async (_id: number, _v: unknown) => ({ id: 1, title: 't', body: 'b', createdAt: new Date() }))
  return { authMock, updateMock }
})
vi.mock('@/lib/admin-auth', () => ({ getAdminSessionOr401: authMock }))
vi.mock('@/db/queries/changelog', () => ({ updateChangelogPost: updateMock }))

import { PATCH } from './route'

function req(body: unknown) {
  return new Request('http://test/api/changelog/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function params(id: string) {
  return { params: Promise.resolve({ id }) }
}

describe('PATCH /api/changelog/[id]', () => {
  beforeEach(() => {
    authMock.mockClear()
    updateMock.mockClear()
    authMock.mockImplementation(async () => ({ session: { user: { id: 'u1', role: 'admin' } }, res: null }))
    updateMock.mockImplementation(async () => ({ id: 1, title: 't', body: 'b', createdAt: new Date() }))
  })

  it('returns 401 and performs no update when unauthenticated', async () => {
    authMock.mockImplementationOnce(async () => ({
      session: null,
      res: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }))
    const res = await PATCH(req({ title: 't', body: 'b' }), params('1'))
    expect(res.status).toBe(401)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 403 and performs no update for a non-admin session', async () => {
    authMock.mockImplementationOnce(async () => ({
      session: null,
      res: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }))
    const res = await PATCH(req({ title: 't', body: 'b' }), params('1'))
    expect(res.status).toBe(403)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 400 for a non-integer id', async () => {
    const res = await PATCH(req({ title: 't', body: 'b' }), params('not-a-number'))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 400 for a zero/negative id', async () => {
    const res = await PATCH(req({ title: 't', body: 'b' }), params('0'))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 200 { ok: true } and calls updateChangelogPost with trimmed title/body for a valid admin request', async () => {
    const res = await PATCH(req({ title: '  New Title  ', body: '  New body  ' }), params('42'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(updateMock).toHaveBeenCalledWith(42, { title: 'New Title', body: 'New body' })
  })

  it('returns 400 with no update for a missing/blank title', async () => {
    const res = await PATCH(req({ title: '  ', body: 'Body' }), params('1'))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 400 with no update for a missing/blank body', async () => {
    const res = await PATCH(req({ title: 'Title', body: '   ' }), params('1'))
    expect(res.status).toBe(400)
    expect(updateMock).not.toHaveBeenCalled()
  })

  it('returns 400 for a non-JSON body', async () => {
    const res = await PATCH(req('not json'), params('1'))
    expect(res.status).toBe(400)
  })

  it('returns 404 when updateChangelogPost finds no matching row', async () => {
    updateMock.mockImplementationOnce(async () => null)
    const res = await PATCH(req({ title: 'Title', body: 'Body' }), params('999'))
    expect(res.status).toBe(404)
  })

  it('returns 500 when updateChangelogPost throws', async () => {
    updateMock.mockImplementationOnce(async () => {
      throw new Error('db down')
    })
    const res = await PATCH(req({ title: 'Title', body: 'Body' }), params('1'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'internal error' })
  })
})
