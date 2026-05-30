import { describe, it, expect } from 'vitest'
import { hasEmbeddedWLines, extractEmbeddedWLines } from './abc-embedded-lyrics'

const PHRASE_WITH_W = `| G2 G G | G F E D |
w: The Lord's my _ shep- -herd, _ I'll`

const PHRASE_NO_W = `| G2 G G | G F E D |`

describe('hasEmbeddedWLines', () => {
  it('returns true when phrase body contains a w: line', () => {
    expect(hasEmbeddedWLines(PHRASE_WITH_W)).toBe(true)
  })
  it('returns false for phrase body with no w: line', () => {
    expect(hasEmbeddedWLines(PHRASE_NO_W)).toBe(false)
  })
  it('tolerates leading whitespace on the w: line', () => {
    expect(hasEmbeddedWLines('| A |\n   w: foo bar')).toBe(true)
  })
  it('returns false on empty string', () => {
    expect(hasEmbeddedWLines('')).toBe(false)
  })
})

describe('extractEmbeddedWLines', () => {
  it('strips the w: prefix and returns the payload', () => {
    expect(extractEmbeddedWLines('| A B C |\nw: do re mi')).toEqual(['do re mi'])
  })
  it('preserves multiple w: lines in source order', () => {
    expect(extractEmbeddedWLines('| A |\nw: line one\n| B |\nw: line two'))
      .toEqual(['line one', 'line two'])
  })
  it('returns empty array when no w: line is present', () => {
    expect(extractEmbeddedWLines('| A B C |')).toEqual([])
  })
})
