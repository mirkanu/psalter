/**
 * TDD test: dotted-comma octave bug in parseVoiceLine
 *
 * Bug: "m.,r" → split('.') → ["m", ",r"] → parseSyllable(",r") → octaveShift=-1 (WRONG)
 * Fix: strip leading comma from i>0 subTokens in parseVoiceLine
 */

import { describe, it, expect } from 'vitest'
import { solFaToAbc } from '../src/lib/solfege-parser'

describe('solfege-parser dotted-comma octave fix', () => {
  it('Glasgow soprano line produces notes in correct octave (no A3, correct A4)', () => {
    const line = ':s_1 |d :— :r |m.,r:d :m |s.,l:s :f |m :— :m |r :— :f |m.,r:d :t_1 |d :—||'
    const { abc } = solFaToAbc(line, 'G', 'C', 'Glasgow')

    // Extract note tokens (letter + optional octave marks)
    const notes = abc.match(/[a-gA-G][',]*/g) ?? []

    // 'A' = A3 (uppercase, no octave mark) — should NOT appear for lah in key G
    expect(notes).not.toContain('A')

    // 'a' = A4 (lowercase) — lah in key G should be A4
    expect(notes).toContain('a')
  })

  it('dotted-comma pair m.,r in key C produces lowercase notes (octave 4), not uppercase (octave 3)', () => {
    // In key C: m = E4 → 'e', r = D4 → 'd'
    // Before fix: ",r" → octaveShift=-1 → D3 → 'D' (uppercase)
    // After fix: "r" → octaveShift=0 → D4 → 'd' (lowercase)
    const line = '|m.,r||'
    const { abc } = solFaToAbc(line, 'C', 'C', 'Test')
    expect(abc).toContain('e')  // m in C = E4 (lowercase)
    expect(abc).toContain('d')  // r in C = D4 (lowercase)
    expect(abc).not.toMatch(/\bD\b/)  // no uppercase D (D3)
    expect(abc).not.toMatch(/\bE\b/)  // no uppercase E (E3)
  })
})
