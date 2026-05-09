import { describe, it, expect } from 'vitest'
import { getDayOfYear } from '@/lib/daily'
import { toEmbedUrl } from '@/lib/youtube'
import { extractVerse1, syllabifyForAbc } from '@/lib/lyrics'

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

describe('lyrics helpers (TUNE-03)', () => {
  // --- extractVerse1 ---

  it('extractVerse1: returns empty string for null', () => {
    expect(extractVerse1(null)).toBe('')
  })

  it('extractVerse1: returns empty string for undefined', () => {
    expect(extractVerse1(undefined)).toBe('')
  })

  it('extractVerse1: returns empty string for empty string', () => {
    expect(extractVerse1('')).toBe('')
  })

  it('extractVerse1: strips leading verse digit and collapses internal newline to space', () => {
    // Single stanza with internal newline; leading "1" stripped
    expect(extractVerse1('1Praise ye the Lord:\na new song')).toBe('Praise ye the Lord: a new song')
  })

  it('extractVerse1: returns only first stanza when multiple stanzas present', () => {
    // Double-newline separates stanzas; only first stanza returned; leading "1" stripped
    expect(extractVerse1('1Praise the Lord\nin sweet psalms\n\n2Let Israel joy')).toBe(
      'Praise the Lord in sweet psalms',
    )
  })

  it('extractVerse1: handles multi-digit verse number prefix', () => {
    // Verse number "10" stripped from "10Behold and see"
    expect(extractVerse1('10Behold and see')).toBe('Behold and see')
  })

  // --- syllabifyForAbc ---

  it('syllabifyForAbc: returns empty string for empty input', () => {
    expect(syllabifyForAbc('')).toBe('')
  })

  it('syllabifyForAbc: syllabifies multi-syllable words with hyphens', () => {
    // actual nlp-syllables 0.0.5 segmentation:
    //   beautiful -> ["beau","ti","ful"]
    //   assembly  -> ["as","sem","bly"]
    expect(syllabifyForAbc('beautiful assembly')).toBe('beau- ti- ful as- sem- bly')
  })

  it('syllabifyForAbc: single-syllable words are returned as-is', () => {
    // actual nlp-syllables 0.0.5 segmentation:
    //   ye -> ["ye"], the -> ["the"], Lord -> ["lord"]
    // Note: "Praise" is 2 syllables per nlp-syllables (["prai","se"]),
    // so the full phrase produces hyphens for Praise only
    expect(syllabifyForAbc('Praise ye the Lord')).toBe('prai- se ye the Lord')
  })

  it('syllabifyForAbc: preserves single-syllable word with trailing punctuation', () => {
    // "Lord:" stripped to "Lord" -> ["lord"] (1 syllable) -> re-attached -> "Lord:"
    expect(syllabifyForAbc('Lord:')).toBe('Lord:')
  })
})

describe('stanza number display fix (D-07)', () => {
  it('inserts space between digit and immediately following letter', () => {
    expect('1All people'.replace(/^(\d+)([A-Za-z])/, '$1 $2')).toBe('1 All people')
  })
  it('handles multi-digit stanza numbers', () => {
    expect('10Behold'.replace(/^(\d+)([A-Za-z])/, '$1 $2')).toBe('10 Behold')
  })
  it('handles lowercase letter immediately after digit', () => {
    expect('2yea'.replace(/^(\d+)([A-Za-z])/, '$1 $2')).toBe('2 yea')
  })
  it('does not modify stanzas that already have a space', () => {
    expect('1 All people'.replace(/^(\d+)([A-Za-z])/, '$1 $2')).toBe('1 All people')
  })
  it('does not modify stanzas with no leading digit', () => {
    expect('All people'.replace(/^(\d+)([A-Za-z])/, '$1 $2')).toBe('All people')
  })
})
