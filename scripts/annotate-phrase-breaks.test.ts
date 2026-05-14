/**
 * Unit tests for the PURE portion of scripts/annotate-phrase-breaks.ts:
 *   insertPhraseBreaks(abc, n)
 *
 * No DB, no fs — just string in / string out. Round-trip test verifies that
 * splitOnPhraseBreaks (Plan 01) parses the script's output back to the
 * expected phrase count.
 */
import { describe, it, expect } from 'vitest'
import { insertPhraseBreaks } from './annotate-phrase-breaks'
import { splitOnPhraseBreaks } from '../src/lib/abc-phrases'

// Realistic Old-Hundredth-style fixture: 8 single-bar music lines after K:G.
// Each '|' delimited music line counts as one "measure-group" for the
// insertion algorithm.
const OLD_HUNDREDTH = [
  'X:1',
  'T:Old Hundredth',
  'M:L.M.',
  'L:1/4',
  'K:G',
  '| G2 G G |',
  '| G F E D |',
  '| E G F E |',
  '| D2 D2 |',
  '| D2 D D |',
  '| E G F E |',
  '| D F E D |',
  '| G2 G2 |',
].join('\n')

describe('insertPhraseBreaks', () => {
  it('returns input unchanged when n <= 1', () => {
    expect(insertPhraseBreaks(OLD_HUNDREDTH, 1)).toBe(OLD_HUNDREDTH)
    expect(insertPhraseBreaks(OLD_HUNDREDTH, 0)).toBe(OLD_HUNDREDTH)
    expect(insertPhraseBreaks(OLD_HUNDREDTH, -3)).toBe(OLD_HUNDREDTH)
  })

  it('returns input unchanged when % PHRASE_BREAK already present (idempotency)', () => {
    const already = OLD_HUNDREDTH.split('\n')
    already.splice(9, 0, '% PHRASE_BREAK')
    const input = already.join('\n')
    expect(insertPhraseBreaks(input, 2)).toBe(input)
    expect(insertPhraseBreaks(input, 4)).toBe(input)
  })

  it('returns input unchanged when no K: line is found', () => {
    const noKey = '| G2 G G |\n| G F E D |'
    expect(insertPhraseBreaks(noKey, 2)).toBe(noKey)
  })

  it('returns input unchanged when there are fewer music lines than n', () => {
    const three = [
      'X:1',
      'T:Tiny',
      'K:G',
      '| G2 |',
      '| A2 |',
      '| B2 |',
    ].join('\n')
    expect(insertPhraseBreaks(three, 4)).toBe(three)
  })

  it('inserts ONE % PHRASE_BREAK for n=2 on an 8-music-line body', () => {
    const out = insertPhraseBreaks(OLD_HUNDREDTH, 2)
    expect(out).not.toBe(OLD_HUNDREDTH)
    const markerCount = (out.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    expect(markerCount).toBe(1)
  })

  it('inserts THREE % PHRASE_BREAK markers for n=4 on an 8-music-line body', () => {
    const out = insertPhraseBreaks(OLD_HUNDREDTH, 4)
    const markerCount = (out.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    expect(markerCount).toBe(3)
  })

  it('preserves the header (lines up to and including K:) unchanged', () => {
    const out = insertPhraseBreaks(OLD_HUNDREDTH, 2)
    const lines = out.split('\n')
    const kIdx = lines.findIndex((l) => l.trim().startsWith('K:'))
    // Header must match the original header verbatim
    const originalHeader = OLD_HUNDREDTH.split('\n').slice(0, 5)
    expect(lines.slice(0, kIdx + 1)).toEqual(originalHeader)
    // No marker may appear in the header region
    expect(lines.slice(0, kIdx + 1).some((l) => l.includes('% PHRASE_BREAK'))).toBe(false)
  })

  it('round-trips with splitOnPhraseBreaks: n=2 → phrases.length === 2', () => {
    const annotated = insertPhraseBreaks(OLD_HUNDREDTH, 2)
    const { phrases } = splitOnPhraseBreaks(annotated)
    expect(phrases.length).toBe(2)
  })

  it('round-trips with splitOnPhraseBreaks: n=4 → phrases.length === 4', () => {
    const annotated = insertPhraseBreaks(OLD_HUNDREDTH, 4)
    const { phrases } = splitOnPhraseBreaks(annotated)
    expect(phrases.length).toBe(4)
  })

  it('places the n=2 break roughly in the middle (after the 4th music line of 8)', () => {
    const out = insertPhraseBreaks(OLD_HUNDREDTH, 2)
    const lines = out.split('\n')
    const breakLineIdx = lines.findIndex((l) => /^\s*%\s*PHRASE_BREAK\s*$/.test(l))
    expect(breakLineIdx).toBeGreaterThan(-1)
    // Music lines before the break = lines after K: up to the marker that contain '|'
    const kIdx = lines.findIndex((l) => l.trim().startsWith('K:'))
    const musicBefore = lines
      .slice(kIdx + 1, breakLineIdx)
      .filter((l) => l.includes('|')).length
    const musicAfter = lines
      .slice(breakLineIdx + 1)
      .filter((l) => l.includes('|')).length
    expect(musicBefore).toBe(4)
    expect(musicAfter).toBe(4)
  })

  it('idempotency: running insertPhraseBreaks twice yields identical output', () => {
    const once = insertPhraseBreaks(OLD_HUNDREDTH, 2)
    const twice = insertPhraseBreaks(once, 2)
    expect(twice).toBe(once)
  })
})
