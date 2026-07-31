import { describe, it, expect, beforeEach } from 'vitest'
import {
  checkRateLimit,
  resetRateLimit,
  trackedKeyCount,
  MAX_TRACKED_KEYS,
  getClientIp,
  UNKNOWN_CLIENT_IP,
} from './rate-limit'

const OPTS = { limit: 5, windowMs: 60_000 }
const T0 = 1_800_000_000_000

describe('checkRateLimit', () => {
  beforeEach(() => resetRateLimit())

  it('allows the first call for a fresh key with remaining 4', () => {
    const result = checkRateLimit('a', { ...OPTS, now: T0 })
    expect(result).toEqual({ allowed: true, remaining: 4 })
  })

  it('counts down remaining across calls 2..5', () => {
    checkRateLimit('a', { ...OPTS, now: T0 })
    const r2 = checkRateLimit('a', { ...OPTS, now: T0 })
    const r3 = checkRateLimit('a', { ...OPTS, now: T0 })
    const r4 = checkRateLimit('a', { ...OPTS, now: T0 })
    const r5 = checkRateLimit('a', { ...OPTS, now: T0 })
    expect(r2).toEqual({ allowed: true, remaining: 3 })
    expect(r3).toEqual({ allowed: true, remaining: 2 })
    expect(r4).toEqual({ allowed: true, remaining: 1 })
    expect(r5).toEqual({ allowed: true, remaining: 0 })
  })

  it('rejects the 6th call at T0 with retryAfterSeconds 60', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const r6 = checkRateLimit('a', { ...OPTS, now: T0 })
    expect(r6).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 60 })
  })

  it('rejects the 7th call too, without crashing', () => {
    for (let i = 0; i < 6; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const r7 = checkRateLimit('a', { ...OPTS, now: T0 })
    expect(r7.allowed).toBe(false)
  })

  it('shrinks retryAfterSeconds as the window drains', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const r = checkRateLimit('a', { ...OPTS, now: T0 + 30_000 })
    expect(r).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 30 })
  })

  it('never returns a retryAfterSeconds of 0 or negative', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const r = checkRateLimit('a', { ...OPTS, now: T0 + 59_999 })
    expect(r).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 1 })
  })

  it('is a sliding window, not a fixed one', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const r = checkRateLimit('a', { ...OPTS, now: T0 + 60_001 })
    expect(r.allowed).toBe(true)
  })

  it('does not record rejected calls', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const rejected = checkRateLimit('a', { ...OPTS, now: T0 + 1_000 })
    expect(rejected.allowed).toBe(false)
    const r = checkRateLimit('a', { ...OPTS, now: T0 + 60_001 })
    expect(r.allowed).toBe(true)
  })

  it('keeps keys independent', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    const rb = checkRateLimit('b', { ...OPTS, now: T0 })
    expect(rb.allowed).toBe(true)
  })

  it('resetRateLimit(key) clears only that key', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    for (let i = 0; i < 5; i++) checkRateLimit('b', { ...OPTS, now: T0 })
    resetRateLimit('a')
    const ra = checkRateLimit('a', { ...OPTS, now: T0 })
    const rb = checkRateLimit('b', { ...OPTS, now: T0 })
    expect(ra.allowed).toBe(true)
    expect(rb.allowed).toBe(false)
  })

  it('resetRateLimit() with no argument clears every key', () => {
    for (let i = 0; i < 5; i++) checkRateLimit('a', { ...OPTS, now: T0 })
    for (let i = 0; i < 5; i++) checkRateLimit('b', { ...OPTS, now: T0 })
    resetRateLimit()
    expect(trackedKeyCount()).toBe(0)
  })

  it('bounds the store to MAX_TRACKED_KEYS', () => {
    for (let i = 0; i < MAX_TRACKED_KEYS + 500; i++) {
      checkRateLimit(`key-${i}`, { ...OPTS, now: T0 })
    }
    expect(trackedKeyCount()).toBeLessThanOrEqual(MAX_TRACKED_KEYS)
  })

  it('sweeps expired keys', () => {
    checkRateLimit('old', { ...OPTS, now: T0 })
    checkRateLimit('new', { ...OPTS, now: T0 + 120_000 })
    const r = checkRateLimit('old', { ...OPTS, now: T0 + 120_000 })
    expect(r).toEqual({ allowed: true, remaining: 4 })
  })
})

function makeRequest(headers: Record<string, string>): Request {
  return new Request('http://test/api/feedback', { method: 'POST', headers })
}

describe('getClientIp', () => {
  it('returns the x-forwarded-for value', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.7' })
    expect(getClientIp(req)).toBe('203.0.113.7')
  })

  it('returns the first entry of a multi-hop x-forwarded-for', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18, 150.172.238.178' })
    expect(getClientIp(req)).toBe('203.0.113.7')
  })

  it('trims whitespace around the first entry', () => {
    const req = makeRequest({ 'x-forwarded-for': '  203.0.113.7 , 70.41.3.18 ' })
    expect(getClientIp(req)).toBe('203.0.113.7')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeRequest({ 'x-real-ip': '198.51.100.4' })
    expect(getClientIp(req)).toBe('198.51.100.4')
  })

  it('returns UNKNOWN_CLIENT_IP when neither header is present', () => {
    const req = makeRequest({})
    expect(getClientIp(req)).toBe(UNKNOWN_CLIENT_IP)
  })

  it('falls through an empty x-forwarded-for to x-real-ip, then to unknown', () => {
    const withRealIp = makeRequest({ 'x-forwarded-for': '', 'x-real-ip': '198.51.100.4' })
    expect(getClientIp(withRealIp)).toBe('198.51.100.4')

    const withNeither = makeRequest({ 'x-forwarded-for': '' })
    expect(getClientIp(withNeither)).toBe(UNKNOWN_CLIENT_IP)
  })

  it('returns an IPv6 value unchanged', () => {
    const req = makeRequest({ 'x-forwarded-for': '2001:db8::1' })
    expect(getClientIp(req)).toBe('2001:db8::1')
  })

  it('returns UNKNOWN_CLIENT_IP for a non-IP value', () => {
    const req = makeRequest({ 'x-forwarded-for': '<script>alert(1)</script>' })
    expect(getClientIp(req)).toBe(UNKNOWN_CLIENT_IP)
  })

  it('returns UNKNOWN_CLIENT_IP for a value containing a newline', () => {
    // Node's real Headers/Request implementation already rejects a raw CR/LF
    // header value at construction time, so a genuine Request can never carry
    // one — that is itself defense-in-depth. This test exercises getClientIp's
    // OWN validation directly via a minimal duck-typed headers object, so the
    // regex guard is verified independently of the runtime's behaviour.
    const fakeReq = {
      headers: { get: (name: string) => (name === 'x-forwarded-for' ? '1.2.3.4\r\nX-Injected: 1' : null) },
    } as unknown as Request
    expect(getClientIp(fakeReq)).toBe(UNKNOWN_CLIENT_IP)
  })

  it('returns UNKNOWN_CLIENT_IP for a value over the 45-char IPv6 max length', () => {
    const req = makeRequest({ 'x-forwarded-for': '1'.repeat(200) })
    expect(getClientIp(req)).toBe(UNKNOWN_CLIENT_IP)
  })
})
