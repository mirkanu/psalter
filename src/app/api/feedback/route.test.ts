import { describe, it, expect, vi, beforeEach } from 'vitest'

const { insertMock, valuesMock, notifyMock } = vi.hoisted(() => {
  const valuesMock = vi.fn(async () => undefined)
  const insertMock = vi.fn(() => ({ values: valuesMock }))
  const notifyMock = vi.fn(async () => ({ ok: true, id: 'msg-1' }))
  return { insertMock, valuesMock, notifyMock }
})
vi.mock('@/db', () => ({ db: { insert: insertMock } }))
vi.mock('@/lib/feedback-email', () => ({ sendFeedbackNotification: notifyMock }))

// Imports must come after vi.mock so the mocks are in place before module evaluation.
import { POST } from './route'
import { resetRateLimit } from '@/lib/rate-limit'

function req(body: unknown, ip = '203.0.113.1') {
  return new Request('http://test/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

describe('POST /api/feedback', () => {
  beforeEach(() => {
    resetRateLimit()
    insertMock.mockClear()
    valuesMock.mockClear()
    notifyMock.mockClear()
    valuesMock.mockImplementation(async () => undefined)
    notifyMock.mockImplementation(async () => ({ ok: true, id: 'msg-1' }))
  })

  it('returns 200 with { ok: true } for a valid submission', async () => {
    const res = await POST(req({ message: 'hello there' }, '203.0.113.10') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
  })

  it('calls db.insert(...).values(...) exactly once with the submitted fields', async () => {
    await POST(
      req(
        { message: 'a message', name: 'Jane', email: 'jane@example.com', pageUrl: 'https://x.test/p' },
        '203.0.113.11',
      ) as any,
    )
    expect(insertMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledTimes(1)
    expect(valuesMock).toHaveBeenCalledWith({
      message: 'a message',
      name: 'Jane',
      email: 'jane@example.com',
      pageUrl: 'https://x.test/p',
    })
  })

  it('calls sendFeedbackNotification exactly once with the submitted fields', async () => {
    await POST(
      req(
        { message: 'another message', name: 'Bob', email: 'bob@example.com', pageUrl: 'https://x.test/q' },
        '203.0.113.12',
      ) as any,
    )
    expect(notifyMock).toHaveBeenCalledTimes(1)
    const arg = notifyMock.mock.calls[0][0]
    expect(arg.message).toBe('another message')
    expect(arg.name).toBe('Bob')
    expect(arg.email).toBe('bob@example.com')
    expect(arg.pageUrl).toBe('https://x.test/q')
  })

  it('returns 500 and does not notify when the DB insert fails', async () => {
    valuesMock.mockImplementationOnce(async () => {
      throw new Error('db down')
    })
    const res = await POST(req({ message: 'will fail' }, '203.0.113.13') as any)
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toEqual({ error: 'internal error' })
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('still returns 200 and saves the row when the notification resolves ok:false', async () => {
    notifyMock.mockImplementationOnce(async () => ({ ok: false, error: 'Domain not verified' }))
    const res = await POST(req({ message: 'save me anyway' }, '203.0.113.14') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(valuesMock).toHaveBeenCalledTimes(1)
  })

  it('still returns 200 and saves the row when the notification rejects', async () => {
    notifyMock.mockImplementationOnce(async () => {
      throw new Error('boom')
    })
    const res = await POST(req({ message: 'save me too' }, '203.0.113.15') as any)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual({ ok: true })
    expect(valuesMock).toHaveBeenCalledTimes(1)
  })

  it('allows 5 sequential valid POSTs then throttles the 6th with 429', async () => {
    const ip = '203.0.113.50'
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({ message: `msg ${i}` }, ip) as any)
      expect(res.status).toBe(200)
    }
    const sixth = await POST(req({ message: 'msg 5' }, ip) as any)
    expect(sixth.status).toBe(429)
  })

  it('429 body has error and a numeric retryAfterSeconds between 1 and 60', async () => {
    const ip = '203.0.113.51'
    for (let i = 0; i < 5; i++) {
      await POST(req({ message: `msg ${i}` }, ip) as any)
    }
    const sixth = await POST(req({ message: 'over limit' }, ip) as any)
    expect(sixth.status).toBe(429)
    const json = await sixth.json()
    expect(json.error).toBe('too many requests')
    expect(typeof json.retryAfterSeconds).toBe('number')
    expect(json.retryAfterSeconds).toBeGreaterThanOrEqual(1)
    expect(json.retryAfterSeconds).toBeLessThanOrEqual(60)
  })

  it('429 response has a Retry-After header matching retryAfterSeconds', async () => {
    const ip = '203.0.113.52'
    for (let i = 0; i < 5; i++) {
      await POST(req({ message: `msg ${i}` }, ip) as any)
    }
    const sixth = await POST(req({ message: 'over limit' }, ip) as any)
    const json = await sixth.json()
    expect(Number(sixth.headers.get('Retry-After'))).toBe(json.retryAfterSeconds)
  })

  it('stops notifying after the limit — notifyMock called exactly 5 times', async () => {
    const ip = '203.0.113.53'
    for (let i = 0; i < 5; i++) {
      await POST(req({ message: `msg ${i}` }, ip) as any)
    }
    await POST(req({ message: 'sixth' }, ip) as any)
    expect(notifyMock).toHaveBeenCalledTimes(5)
  })

  it('a different IP is unaffected by another IP being throttled', async () => {
    const throttledIp = '203.0.113.60'
    const otherIp = '203.0.113.61'
    for (let i = 0; i < 5; i++) {
      await POST(req({ message: `msg ${i}` }, throttledIp) as any)
    }
    await POST(req({ message: 'over limit' }, throttledIp) as any)
    const res = await POST(req({ message: 'first from other ip' }, otherIp) as any)
    expect(res.status).toBe(200)
  })

  it('rejects an empty body with 400 and calls neither valuesMock nor notifyMock', async () => {
    const res = await POST(req({}, '203.0.113.70') as any)
    expect(res.status).toBe(400)
    expect(valuesMock).not.toHaveBeenCalled()
    expect(notifyMock).not.toHaveBeenCalled()
  })

  it('rejects invalid JSON with 400', async () => {
    const res = await POST(req('not json', '203.0.113.71') as any)
    expect(res.status).toBe(400)
  })

  it('validation failures still consume rate-limit budget', async () => {
    const ip = '203.0.113.72'
    for (let i = 0; i < 5; i++) {
      const res = await POST(req({}, ip) as any)
      expect(res.status).toBe(400)
    }
    const sixth = await POST(req({ message: 'now valid' }, ip) as any)
    expect(sixth.status).toBe(429)
  })
})
