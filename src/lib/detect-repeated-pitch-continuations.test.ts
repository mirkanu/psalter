import { describe, it, expect } from 'vitest'
import { detectRepeatedPitchContinuations } from './detect-repeated-pitch-continuations'

describe('detectRepeatedPitchContinuations', () => {
  it('detects the St Agnes P0 case — repeated b notes at the phrase start', () => {
    // b2 b2 b2 a4 | b2 c'4 f2 | g6  →  pitches: b b b a b c' f g (8 notes)
    const out = detectRepeatedPitchContinuations("b2b2b2a4 | b2c'4f2 | g6", 1)
    expect(out).toEqual([1]) // second `b` continues the first
  })

  it('returns empty when no consecutive pitch repeats exist', () => {
    const out = detectRepeatedPitchContinuations('a2b2c2d2', 2)
    expect(out).toEqual([])
  })

  it('caps at maxContinuations, earliest runs first', () => {
    // a a a b b b → repeats at index 1,2 (a) and 4,5 (b)
    const out = detectRepeatedPitchContinuations('a2a2a2b2b2b2', 2)
    expect(out).toEqual([1, 2])
  })

  it('respects octave marks and accidentals as distinct pitches', () => {
    // b then b' (octave up) then ^b (sharp) — none are the same pitch
    const out = detectRepeatedPitchContinuations("b2b'2^b2", 3)
    expect(out).toEqual([])
  })

  it('excludes tied notes from repeat detection (already merged, not distinct heads)', () => {
    // b2-b2 is a tie (one sung note); the tied continuation must not double-count
    const out = detectRepeatedPitchContinuations('b2-b2 c2', 5)
    expect(out).toEqual([])
  })

  it('excludes chords entirely from the pitch stream (chords never repeat-detected)', () => {
    // The chord is stripped before pitch extraction, so the two plain `a`
    // notes surrounding it become adjacent in the resulting pitch stream.
    const out = detectRepeatedPitchContinuations('a2 [ab]2 a2', 5)
    expect(out).toEqual([1])
  })

  it('maxContinuations=0 returns empty', () => {
    expect(detectRepeatedPitchContinuations('a2a2a2', 0)).toEqual([])
  })
})
