import { describe, it, expect } from 'vitest'
import { splitMusicIntoSubLines } from '../splitMusicIntoSubLines'

describe('splitMusicIntoSubLines', () => {
  it('appends trailing `|` to every emitted sub-line when n>1', () => {
    const body = 'C D E | F G A | B c d | e f g'
    const out = splitMusicIntoSubLines(body, 2)
    expect(out).toHaveLength(2)
    for (const line of out) {
      expect(line).toMatch(/\|\s*$/)
    }
  })

  it('does not introduce `||` when a sub-line already ends with `|`', () => {
    // Body where the final measure already terminates in `|`.
    const body = 'C D E | F G A | B c d | e f g |'
    const out = splitMusicIntoSubLines(body, 2)
    for (const line of out) {
      // No double-bar (`||`) anywhere except a legitimate `||` we didn't add.
      // We assert the *trailing* sequence is exactly `|` (with optional space).
      expect(line).toMatch(/[^|]\s*\|\s*$/)
    }
  })

  it('returns [body] unchanged on the n=1 early-return path (no `|` appended)', () => {
    const body = 'C D E F G A B c'
    const out = splitMusicIntoSubLines(body, 1)
    expect(out).toEqual([body])
  })

  it('filters bare-rest measures (z2, Z4) — existing behaviour preserved', () => {
    // Trailing `z2` measure must be filtered out, and remaining lines still
    // get the trailing `|`.
    const body = 'C D E | F G A | B c d | e f g | z2'
    const out = splitMusicIntoSubLines(body, 2)
    // The z2 measure is filtered; 4 real measures split into 2 lines of 2.
    expect(out).toHaveLength(2)
    for (const line of out) {
      expect(line).not.toMatch(/\bz2\b/)
      expect(line).toMatch(/\|\s*$/)
    }
  })

  it('Contemplation-shaped fixture: phrase ending in `=e` (no trailing `|`) gets `=e |`', () => {
    // Simulates a Contemplation phrase body where the final measure ends in an
    // explicit natural and no closing bar. After the fix, the emitted sub-line
    // must terminate in `=e |` so abcjs synth resets the accidental scope
    // before the next phrase begins.
    const body = 'B,2 E2 | G2 F2 | E2 D2 | =e2 d2 | c2 B2 | A2 G2 | F2 E2 | =e2'
    const out = splitMusicIntoSubLines(body, 2)
    // The final sub-line must end with `=e2 |` (with optional whitespace).
    const last = out[out.length - 1]
    expect(last).toMatch(/=e2\s*\|\s*$/)
  })

  it('returns [body] when fewer than 2 real measures remain (early-return path)', () => {
    const body = 'C D E F'
    const out = splitMusicIntoSubLines(body, 2)
    expect(out).toEqual([body])
  })
})
