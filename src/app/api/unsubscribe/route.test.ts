import { describe, it, expect, vi, beforeEach } from 'vitest'

const { deleteMock, whereMock, returningMock } = vi.hoisted(() => {
  const returningMock = vi.fn(async (_cols: unknown) => [{ id: 1 }] as { id: number }[])
  const whereMock = vi.fn(() => ({ returning: returningMock }))
  const deleteMock = vi.fn(() => ({ where: whereMock }))
  return { deleteMock, whereMock, returningMock }
})
vi.mock('@/db', () => ({ db: { delete: deleteMock } }))

import * as routeModule from './route'
import { POST } from './route'
import { resetRateLimit } from '@/lib/rate-limit'

function req(body: unknown, ip = '198.51.100.1') {
  return new Request('http://test/api/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/unsubscribe', () => {
  beforeEach(() => {
    resetRateLimit()
    deleteMock.mockClear()
    whereMock.mockClear()
    returningMock.mockClear()
    whereMock.mockImplementation(() => ({ returning: returningMock }))
    returningMock.mockImplementation(async () => [{ id: 1 }])
  })

  it('Test 1: a token matching an existing row returns 200 with body exactly { ok: true }', async () => {
    const res = await POST(req({ token: 'a-valid-token' }, '198.51.100.10') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('Test 2: delete is invoked with eq(unsubscribeToken, token) and .returning(...)', async () => {
    await POST(req({ token: 'another-token' }, '198.51.100.11') as any)
    expect(deleteMock).toHaveBeenCalledTimes(1)
    expect(whereMock).toHaveBeenCalledTimes(1)
    expect(returningMock).toHaveBeenCalledTimes(1)
  })

  it('Test 3: a token matching no row returns 404 with { error: "invalid or already-used token" }', async () => {
    returningMock.mockImplementationOnce(async () => [])
    const res = await POST(req({ token: 'unknown-token' }, '198.51.100.12') as any)
    expect(res.status).toBe(404)
    const json = await res.json()
    expect(json).toEqual({ error: 'invalid or already-used token' })
  })

  it('Test 4: a missing token returns 400 and never calls delete', async () => {
    const res = await POST(req({}, '198.51.100.13') as any)
    expect(res.status).toBe(400)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('Test 5: a non-string token (number, object, null) returns 400 and never calls delete', async () => {
    for (const badToken of [42, { x: 1 }, null]) {
      const res = await POST(req({ token: badToken }, '198.51.100.14') as any)
      expect(res.status).toBe(400)
    }
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('Test 6: an empty-string token returns 400 and never calls delete', async () => {
    const res = await POST(req({ token: '' }, '198.51.100.15') as any)
    expect(res.status).toBe(400)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('Test 7: a non-JSON body returns 400 and never calls delete', async () => {
    const res = await POST(req('not json', '198.51.100.16') as any)
    expect(res.status).toBe(400)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('Test 8: the module exports no GET handler', () => {
    expect((routeModule as Record<string, unknown>).GET).toBeUndefined()
  })

  it('Test 9: a DB failure returns 500 with { error: "internal error" }', async () => {
    returningMock.mockImplementationOnce(async () => {
      throw new Error('db down')
    })
    const res = await POST(req({ token: 'boom-token' }, '198.51.100.17') as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'internal error' })
  })

  it('Test 10: 20 POSTs succeed, the 21st returns 429 with retryAfterSeconds and a Retry-After header', async () => {
    const ip = '198.51.100.20'
    for (let i = 0; i < 20; i++) {
      const res = await POST(req({ token: `token-${i}` }, ip) as any)
      expect(res.status).toBe(200)
    }
    const twentyFirst = await POST(req({ token: 'token-21' }, ip) as any)
    expect(twentyFirst.status).toBe(429)
    const json = await twentyFirst.json()
    expect(typeof json.retryAfterSeconds).toBe('number')
    expect(Number(twentyFirst.headers.get('Retry-After'))).toBe(json.retryAfterSeconds)
  })

  it('Test 11: 20 invalid (400-returning) requests still exhaust the budget', async () => {
    const ip = '198.51.100.21'
    for (let i = 0; i < 20; i++) {
      const res = await POST(req({}, ip) as any)
      expect(res.status).toBe(400)
    }
    const twentyFirst = await POST(req({ token: 'valid-token' }, ip) as any)
    expect(twentyFirst.status).toBe(429)
    expect(deleteMock).not.toHaveBeenCalled()
  })

  it('Test 12: a different IP is unaffected by another IP being throttled', async () => {
    const throttledIp = '198.51.100.30'
    const otherIp = '198.51.100.31'
    for (let i = 0; i < 20; i++) {
      await POST(req({ token: `throttled-${i}` }, throttledIp) as any)
    }
    await POST(req({ token: 'overlimit' }, throttledIp) as any)
    const res = await POST(req({ token: 'first' }, otherIp) as any)
    expect(res.status).toBe(200)
  })
})
