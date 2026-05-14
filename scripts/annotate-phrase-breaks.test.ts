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

  // ─── Regression: Bug 1 — w: lyric lines must not be counted as music lines ─

  // Realistic St-Peter-style fixture: 2 music lines, each followed by `w:`
  // lyric lines that contain `|` for syllable-to-barline alignment. The
  // previous (broken) implementation treated `w:` lines as music lines and
  // inserted the marker AFTER the 1st w: lyric line of the 2nd music line.
  // Correct behaviour: place the marker AFTER the 1st music line (between
  // the two staves), unaffected by the embedded `|` in the lyric lines.
  const ST_PETER_LIKE = [
    'X:1',
    'T:St. Peter-like',
    'M:4/4',
    'L:1/4',
    'K:D',
    'V:1 treble',
    'V:1',
    ' A | d c B A | A G F F | E D G F | E3 |1$ F | %5',
    'w: How|sweet the name of|Je- sus sounds in|a be- liev- er\'s|ear!|It|',
    'w: It|makes the wound- ed|spir- it whole and|calms the trou- bled|breast;|\'tis|',
    ' G F B A | A G F D | F E D C | D3 x |] %10',
    'w: fear.|',
    'w: rest.|',
  ].join('\n')

  it('Bug 1 regression: w: lyric lines are NOT counted as music lines', () => {
    const out = insertPhraseBreaks(ST_PETER_LIKE, 2)
    const lines = out.split('\n')
    const markerIdx = lines.findIndex((l) => /^\s*%\s*PHRASE_BREAK\s*$/.test(l))
    expect(markerIdx).toBeGreaterThan(-1)
    // The line immediately before the marker MUST be a music line (starts with
    // a space and contains `|` and notes), NOT a `w:` lyric line.
    const lineBefore = lines[markerIdx - 1]
    expect(lineBefore.startsWith('w:')).toBe(false)
    expect(lineBefore).toContain('|')
    // There should be exactly one marker for n=2.
    const markerCount = (out.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    expect(markerCount).toBe(1)
  })

  it('Bug 1 regression: V: voice lines also excluded as music', () => {
    const withVoice = [
      'X:1',
      'T:Voice-only header',
      'M:C',
      'L:1/4',
      'K:G',
      'V:1 treble nm="S A" snm="S.A." | extra',
      ' G2 G G | G F E D |',
      ' E G F E | D2 D2 |',
    ].join('\n')
    // V: line contains '|' but should NOT count. We have 2 real music lines,
    // so n=2 should put the marker between them (after index of first music line).
    const out = insertPhraseBreaks(withVoice, 2)
    const lines = out.split('\n')
    const markerIdx = lines.findIndex((l) => /^\s*%\s*PHRASE_BREAK\s*$/.test(l))
    expect(markerIdx).toBeGreaterThan(-1)
    expect(lines[markerIdx - 1].trim().startsWith('V:')).toBe(false)
  })

  // ─── Regression: Bug 2 — single-line music bodies (Old 100th, Effingham) ──

  // Single physical music line containing 6 internal barlines — must be
  // spliced mid-line for n=2.
  const SINGLE_LINE_CM = [
    'X:1',
    'T:Single-line CM',
    'M:C',
    'L:1/4',
    'K:G',
    ' G2 G F | E D G2 | A2 B2 | c2 B2 | A2 G2 | F2 G2 |] %6',
  ].join('\n')

  it('Bug 2 regression: single-line CM body gets 1 mid-line marker', () => {
    const out = insertPhraseBreaks(SINGLE_LINE_CM, 2)
    expect(out).not.toBe(SINGLE_LINE_CM)
    const markerCount = (out.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    expect(markerCount).toBe(1)
    // Round-trip: splitOnPhraseBreaks must see exactly 2 phrases.
    const { phrases } = splitOnPhraseBreaks(out)
    expect(phrases.length).toBe(2)
  })

  // DCM body on a single line — must get 3 markers for n=4.
  const SINGLE_LINE_DCM = [
    'X:1',
    'T:Single-line DCM',
    'M:C',
    'L:1/4',
    'K:G',
    ' G G | G F | E D | G2 | A B | c2 | B A | G2 | E E | F G | A2 | B c | d2 | B G | A2 | G2 |]',
  ].join('\n')

  it('Bug 2 regression: single-line DCM body gets 3 mid-line markers', () => {
    const out = insertPhraseBreaks(SINGLE_LINE_DCM, 4)
    const markerCount = (out.match(/^\s*%\s*PHRASE_BREAK\s*$/gm) ?? []).length
    expect(markerCount).toBe(3)
    const { phrases } = splitOnPhraseBreaks(out)
    expect(phrases.length).toBe(4)
  })

  it('Bug 2 regression: re-running on already-marked single-line body is a no-op', () => {
    const once = insertPhraseBreaks(SINGLE_LINE_CM, 2)
    const twice = insertPhraseBreaks(once, 2)
    expect(twice).toBe(once)
  })

  it('Bug 2 regression: single-line body with too few barlines returns unchanged', () => {
    const tiny = [
      'X:1',
      'T:Too-short single line',
      'K:G',
      ' G2 |] %1',
    ].join('\n')
    // Only one barline, none internal — cannot split for n=2.
    expect(insertPhraseBreaks(tiny, 2)).toBe(tiny)
  })
})
