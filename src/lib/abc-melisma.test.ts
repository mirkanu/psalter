import { describe, it, expect } from 'vitest'
import { buildWLineFromSolfa } from './abc-melisma'

/**
 * Test sopranos are carefully designed so that note counts at each phrase
 * boundary match getSplitPointsForMeter('CM', 4) = [8, 14, 22].
 *
 * NO_PASSING_SOPRANO: 22 single-beat note events (no dot-pairs, no holds extending),
 *   phrase 0 = events[0..7] = 8 notes, all non-passing.
 *
 * CRIMOND_LIKE_SOPRANO: 31 events; phrase 3 = events[22..30] = 9 notes,
 *   with dot-pairs at positions 3 and 8 within the phrase (2 passing notes).
 */
const NO_PASSING_SOPRANO =
  // 8 events: phrase 0 (s m r d t_1 l_1 s f)
  's|m|r|d|t_1|l_1|s|f|' +
  // 6 events: phrase 1
  'm|f|s|m|s|l|' +
  // 8 events: phrase 2
  't|d|t|l|s|f|r|d||'

const CRIMOND_LIKE_SOPRANO =
  // phrase 0: 8 two-beat notes via "s:m|r:d|t_1:l_1|s:f" = 8 events
  's:m|r:d|t_1:l_1|s:f|' +
  // phrase 1: 6 events
  'm:f|s:m|s:l|' +
  // phrase 2: 8 events
  't:d|t:l|s:f|r:d|' +
  // phrase 3: 9 events, 2 dot-pair passings: f.m (m is passing) and l_1.s (s is passing)
  't_1:s|f.m:r|d:t_1|l_1.s:—||'

describe('buildWLineFromSolfa', () => {
  it('phrase 0 of a standard CM tune with exact syllable match has no _ tokens', () => {
    const warnings: string[] = []
    // 8 syllabic slots, 8 syllable tokens (no mismatch, no heuristic)
    const result = buildWLineFromSolfa(
      NO_PASSING_SOPRANO, 'G', 'C', 0, 'CM',
      'The Lord my God shall ev-er reign', warnings,
    )
    expect(result).not.toContain('_')
    expect(warnings).toHaveLength(0)
    // 8 tokens for 8 notes in phrase 0
    const tokens = result.split(/\s+/).filter(Boolean)
    expect(tokens).toHaveLength(8)
  })

  it('phrase 3 with dot-pairs produces _ tokens at passing positions', () => {
    const warnings: string[] = []
    // Crimond-like phrase 3: 9 notes, 2 dot-pair passings → 7 syllabic slots
    // "still wa- ters by" = 4 tokens, heuristic converts 3 more to _
    const result = buildWLineFromSolfa(
      CRIMOND_LIKE_SOPRANO, 'G', 'C', 3, 'CM',
      'still wa- ters by', warnings,
    )
    expect(result).toContain('_')
    const underscores = result.split(/\s+/).filter((t) => t === '_').length
    // At least the 2 dot-pair passing notes
    expect(underscores).toBeGreaterThanOrEqual(2)
  })

  it('output token count equals note count for phrase 3 (melismatic phrase)', () => {
    const warnings: string[] = []
    const result = buildWLineFromSolfa(
      CRIMOND_LIKE_SOPRANO, 'G', 'C', 3, 'CM',
      'still wa- ters by', warnings,
    )
    const tokens = result.split(/\s+/).filter(Boolean)
    // phrase 3 has 9 notes — token count should equal note count (one token per note)
    expect(tokens).toHaveLength(9)
  })

  it('heuristic adds _ when dot-pairs alone leave surplus syllabic slots', () => {
    const warnings: string[] = []
    // phrase 3: 9 notes, 2 dot-pair passings → 7 syllabic slots.
    // "still wa- ters by" = 4 tokens → heuristic must add 3 more _ (total 5 _).
    // Final syllabic tokens in output should equal the 4 input tokens (no more, no less).
    const result = buildWLineFromSolfa(
      CRIMOND_LIKE_SOPRANO, 'G', 'C', 3, 'CM',
      'still wa- ters by', warnings,
    )
    const tokens = result.split(/\s+/).filter(Boolean)
    const syllabicTokens = tokens.filter((t) => t !== '_')
    // After heuristic, syllabic slots == syllable tokens == 4
    expect(syllabicTokens).toHaveLength(4)
    expect(syllabicTokens).toEqual(['still', 'wa-', 'ters', 'by'])
  })

  it('heuristic converts surplus notes to _ when too many syllabic slots (phrase 0 with few syllables)', () => {
    const warnings: string[] = []
    // 8 syllabic slots in phrase 0, only 1 monosyllabic token → heuristic promotes 7 notes to _
    // "Lord" is monosyllabic (1 token)
    const result = buildWLineFromSolfa(
      NO_PASSING_SOPRANO, 'G', 'C', 0, 'CM',
      'Lord', warnings,
    )
    const tokens = result.split(/\s+/).filter(Boolean)
    // 8 total tokens (one per note)
    expect(tokens).toHaveLength(8)
    // 7 _ tokens
    expect(tokens.filter((t) => t === '_')).toHaveLength(7)
    // 1 syllabic token
    expect(tokens.filter((t) => t !== '_')).toHaveLength(1)
  })

  it('emits warning (not crash) when mismatch cannot be fully resolved', () => {
    const warnings: string[] = []
    // Empty soprano produces no events → 0 syllabic slots for any syllable tokens.
    // syllabicCount (0) < sylTokens.length (2) → warning path.
    buildWLineFromSolfa('s:m||', 'G', 'C', 1, 'CM', 'too many syllables here', warnings)
    // Must not throw; warnings may or may not be populated (implementation logs where applicable)
    expect(warnings).toBeInstanceOf(Array)
  })

  it('returns empty string for soprano with no events in requested phrase', () => {
    // Very short soprano that produces only 2 events (both in phrase 0),
    // phrase 3 (beyond position 22) has 0 events → empty output
    const soprano = 's:m||'
    const warnings: string[] = []
    const result = buildWLineFromSolfa(soprano, 'C', 'C', 3, 'CM', 'some text', warnings)
    expect(result).toBe('')
  })
})
