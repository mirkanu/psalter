import { describe, it, expect, vi, beforeEach } from 'vitest'

const { insertMock, valuesMock, onConflictMock } = vi.hoisted(() => {
  const onConflictMock = vi.fn(async (_opts: unknown) => undefined)
  const valuesMock = vi.fn((_v: { email: string; unsubscribeToken: string }) => ({
    onConflictDoNothing: onConflictMock,
  }))
  const insertMock = vi.fn(() => ({ values: valuesMock }))
  return { insertMock, valuesMock, onConflictMock }
})
vi.mock('@/db', () => ({ db: { insert: insertMock } }))

import * as routeModule from './route'
import { POST } from './route'
import { resetRateLimit } from '@/lib/rate-limit'
import { changelogSubscribers } from '@/db/schema'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function req(body: unknown, ip = '198.51.100.1') {
  return new Request('http://test/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/subscribe', () => {
  beforeEach(() => {
    resetRateLimit()
    insertMock.mockClear()
    valuesMock.mockClear()
    onConflictMock.mockClear()
    valuesMock.mockImplementation(() => ({ onConflictDoNothing: onConflictMock }))
    onConflictMock.mockImplementation(async () => undefined)
  })

  it('Test 1: a valid new email returns 200 with body exactly { ok: true }', async () => {
    const res = await POST(req({ email: 'new@example.com' }, '198.51.100.10') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('Test 2: the insert is called once with { email, unsubscribeToken } matching UUID v4 shape', async () => {
    await POST(req({ email: 'uuid@example.com' }, '198.51.100.11') as any)
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledTimes(1)
    const arg = valuesMock.mock.calls[0][0] as { email: string; unsubscribeToken: string }
    expect(arg.email).toBe('uuid@example.com')
    expect(arg.unsubscribeToken).toMatch(UUID_RE)
  })

  it('Test 3: onConflictDoNothing is called with { target: changelogSubscribers.email }', async () => {
    await POST(req({ email: 'conflict@example.com' }, '198.51.100.12') as any)
    expect(onConflictMock).toHaveBeenCalledTimes(1)
    expect(onConflictMock).toHaveBeenCalledWith({ target: changelogSubscribers.email })
  })

  it('Test 4: a duplicate email (no-op onConflictDoNothing) returns an identical 200 { ok: true }', async () => {
    onConflictMock.mockImplementationOnce(async () => undefined)
    const res = await POST(req({ email: 'duplicate@example.com' }, '198.51.100.13') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('Test 5: an email failing the regex returns 400 and performs no insert', async () => {
    const res = await POST(req({ email: 'not-an-email' }, '198.51.100.14') as any)
    expect(res.status).toBe(400)
    expect(insertMock).not.toHaveBeenCalled()
  })

  it('Test 6: a non-JSON body returns 400', async () => {
    const res = await POST(req('not json', '198.51.100.15') as any)
    expect(res.status).toBe(400)
  })

  it('Test 7: 5 POSTs succeed, the 6th returns 429 with retryAfterSeconds and a Retry-After header', async () => {
    const ip = '198.51.100.20'
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ email: `person${i}@example.com` }, ip) as any)
      expect(res.status).toBe(200)
    }
    const sixth = await POST(req({ email: 'sixth@example.com' }, ip) as any)
    expect(sixth.status).toBe(429)
    const json = await sixth.json()
    expect(typeof json.retryAfterSeconds).toBe('number')
    expect(Number(sixth.headers.get('Retry-After'))).toBe(json.retryAfterSeconds)
  })

  it('Test 8: five 400-returning invalid submissions still exhaust the budget', async () => {
    const ip = '198.51.100.21'
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ email: 'invalid-email' }, ip) as any)
      expect(res.status).toBe(400)
    }
    const sixth = await POST(req({ email: 'valid@example.com' }, ip) as any)
    expect(sixth.status).toBe(429)
  })

  it('Test 9: a different IP is unaffected by another IP being throttled', async () => {
    const throttledIp = '198.51.100.30'
    const otherIp = '198.51.100.31'
    for (let i = 0; i < 5; i++) {
      await POST(req({ email: `throttled${i}@example.com` }, throttledIp) as any)
    }
    await POST(req({ email: 'overlimit@example.com' }, throttledIp) as any)
    const res = await POST(req({ email: 'first@example.com' }, otherIp) as any)
    expect(res.status).toBe(200)
  })

  it('Test 10: the module does not export a GET handler', () => {
    expect((routeModule as Record<string, unknown>).GET).toBeUndefined()
  })

  it('Test 11: a DB failure returns 500 with { error: "internal error" }', async () => {
    onConflictMock.mockImplementationOnce(async () => {
      throw new Error('db down')
    })
    const res = await POST(req({ email: 'dbfail@example.com' }, '198.51.100.40') as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'internal error' })
  })
})
