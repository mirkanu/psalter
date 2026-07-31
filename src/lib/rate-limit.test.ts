import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, resetRateLimit, trackedKeyCount, MAX_TRACKED_KEYS } from './rate-limit'

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
