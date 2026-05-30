import { describe, it, expect } from 'vitest'
import { renderEmbeddedWPhrase } from './abc-embedded-w-branch'

const CRIMOND_PHRASE_1 = `c2 a4 b g | c'4 b g f4 e2 f4
w: The Lord's my _ shep herd, _ I'll not want;`

describe('renderEmbeddedWPhrase', () => {
  it('Test 1: cycle 0 emits verbatim music + w: line', () => {
    const r = renderEmbeddedWPhrase(CRIMOND_PHRASE_1, 1)
    expect(r.cycle0Lines).toEqual([
      "c2 a4 b g | c'4 b g f4 e2 f4",
      "w: The Lord's my _ shep herd, _ I'll not want;",
    ])
    expect(r.needsHeuristicFallback).toEqual([false])
  })

  it('Test 2: 3 cycles — cycle 0 verbatim, cycles 1+2 flagged for heuristic', () => {
    const r = renderEmbeddedWPhrase(CRIMOND_PHRASE_1, 3)
    expect(r.cycle0Lines[0]).toMatch(/^c2 a4/)
    expect(r.cycle0Lines[1]).toBe(
      "w: The Lord's my _ shep herd, _ I'll not want;",
    )
    expect(r.needsHeuristicFallback).toEqual([false, true, true])
  })

  it('Test 3: multi-w-line phrase preserves order', () => {
    const body = `c2 a4 b g
w: foo bar baz
w: alt alt alt`
    const r = renderEmbeddedWPhrase(body, 1)
    expect(r.cycle0Lines).toEqual([
      'c2 a4 b g',
      'w: foo bar baz',
      'w: alt alt alt',
    ])
  })

  it('Test 4: throws on precondition violation (no w: line)', () => {
    expect(() => renderEmbeddedWPhrase('c2 a4 b g', 1)).toThrow(
      /renderEmbeddedWPhrase called on phrase without w: lines/,
    )
  })

  it('Test 5: cycle0Lines has exactly 2 entries for the canonical Crimond phrase 1 (no sub-staff splitting)', () => {
    const r = renderEmbeddedWPhrase(CRIMOND_PHRASE_1, 1)
    expect(r.cycle0Lines.length).toBe(2)
  })
})
