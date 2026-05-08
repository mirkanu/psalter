import { describe, it, expect } from 'vitest'
import { getDayOfYear } from '@/lib/daily'
import { toEmbedUrl } from '@/lib/youtube'

describe('getDayOfYear', () => {
  it('returns 1 for January 1', () => {
    expect(getDayOfYear(new Date(2026, 0, 1))).toBe(1)
  })
  it('returns 365 for December 31 (non-leap year)', () => {
    expect(getDayOfYear(new Date(2026, 11, 31))).toBe(365)
  })
  it('default (no arg) returns a value between 1 and 365', () => {
    const day = getDayOfYear()
    expect(day).toBeGreaterThanOrEqual(1)
    expect(day).toBeLessThanOrEqual(365)
  })
})

describe('toEmbedUrl', () => {
  it('converts youtu.be short URL', () => {
    expect(toEmbedUrl('https://youtu.be/abc123?si=xyz')).toBe('https://www.youtube.com/embed/abc123')
  })
  it('converts youtube.com/watch URL', () => {
    expect(toEmbedUrl('https://www.youtube.com/watch?v=abc123&t=5s')).toBe('https://www.youtube.com/embed/abc123')
  })
  it('returns null for null input', () => {
    expect(toEmbedUrl(null)).toBeNull()
  })
  it('returns null for non-YouTube URL', () => {
    expect(toEmbedUrl('https://hymnary.org/foo')).toBeNull()
  })
})
