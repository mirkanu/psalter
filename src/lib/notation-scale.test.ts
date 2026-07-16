import { describe, it, expect } from 'vitest'
import {
  computeNotationScale,
  INLINE_STAFF_NOTATION_SCALE,
  SPLIT_LEAF_NOTATION_SCALE,
} from './notation-scale'

describe('computeNotationScale', () => {
  it('returns SPLIT_LEAF_NOTATION_SCALE for staff-split regardless of baseSize', () => {
    expect(
      computeNotationScale({ viewMode: 'staff-split', chromeless: true, baseSize: 40 }),
    ).toBe(1)
  })

  it('returns SPLIT_LEAF_NOTATION_SCALE for solfege-split regardless of baseSize', () => {
    expect(
      computeNotationScale({ viewMode: 'solfege-split', chromeless: true, baseSize: 40 }),
    ).toBe(1)
  })

  it('inline-Staff (chromeless) tracks notationBaseSize, not baseSize', () => {
    expect(
      computeNotationScale({
        viewMode: 'staff',
        chromeless: true,
        baseSize: 40,
        notationBaseSize: 20,
      }),
    ).toBe(20 / 14)
  })

  it('same notationBaseSize + different baseSize yields the same scale (decoupled from lyric control)', () => {
    const a = computeNotationScale({
      viewMode: 'staff',
      chromeless: true,
      baseSize: 8,
      notationBaseSize: 20,
    })
    const b = computeNotationScale({
      viewMode: 'staff',
      chromeless: true,
      baseSize: 40,
      notationBaseSize: 20,
    })
    expect(a).toBe(b)
    expect(a).toBe(20 / 14)
  })

  it('scale VARIES when notationBaseSize varies — proves it is not an inert fixed constant', () => {
    const low = computeNotationScale({
      viewMode: 'staff',
      chromeless: true,
      baseSize: 40,
      notationBaseSize: 12,
    })
    const high = computeNotationScale({
      viewMode: 'staff',
      chromeless: true,
      baseSize: 40,
      notationBaseSize: 24,
    })
    expect(low).not.toBe(high)
  })

  it('falls back to INLINE_STAFF_NOTATION_SCALE only when notationBaseSize is omitted', () => {
    expect(
      computeNotationScale({ viewMode: 'staff', chromeless: true, baseSize: 40 }),
    ).toBe(INLINE_STAFF_NOTATION_SCALE)
  })

  it('non-chromeless desktop staff still couples to baseSize (out of scope for decoupling)', () => {
    expect(
      computeNotationScale({ viewMode: 'staff', chromeless: false, baseSize: 28 }),
    ).toBe(28 / 14)
  })

  it('lyrics view mode couples to baseSize', () => {
    expect(
      computeNotationScale({ viewMode: 'lyrics', chromeless: true, baseSize: 20 }),
    ).toBe(20 / 14)
  })

  it('exposes the expected constant values', () => {
    expect(INLINE_STAFF_NOTATION_SCALE).toBe(13 / 14)
    expect(SPLIT_LEAF_NOTATION_SCALE).toBe(1)
  })
})
