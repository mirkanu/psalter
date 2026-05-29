import { describe, it, expect } from 'vitest'
import { splitOnPhraseBreaks, buildPhraseAbc, countNoteHeads, type SplitAbc } from './abc-phrases'

const OLD_HUNDREDTH_TWO_PHRASES = `X:1
T:Old Hundredth
M:L.M.
L:1/4
K:G
| G2 G G | G F E D | E G F E | D2 D2 |
% PHRASE_BREAK
| D2 D D | E G F E | D F E D | G2 G2 |`

const OLD_HUNDREDTH_FOUR_PHRASES = `X:1
T:DCM Sample
M:C
L:1/4
K:G
| G2 G G |
% PHRASE_BREAK
| F E D2 |
% PHRASE_BREAK
| E F G A |
% PHRASE_BREAK
| G2 G2 |`

describe('splitOnPhraseBreaks', () => {
  it('returns header through K: line inclusive and 1 phrase when no PHRASE_BREAK markers', () => {
    const abc = `X:1\nT:Test\nK:G\n| G2 G G | G F E D |`
    const split = splitOnPhraseBreaks(abc)
    expect(split.header).toBe('X:1\nT:Test\nK:G')
    expect(split.phrases).toHaveLength(1)
    expect(split.phrases[0]).toBe('| G2 G G | G F E D |')
  })

  it('returns 2 phrases for ABC with one PHRASE_BREAK marker', () => {
    const split = splitOnPhraseBreaks(OLD_HUNDREDTH_TWO_PHRASES)
    expect(split.header).toContain('K:G')
    expect(split.phrases).toHaveLength(2)
    expect(split.phrases[0]).toBe('| G2 G G | G F E D | E G F E | D2 D2 |')
    expect(split.phrases[1]).toBe('| D2 D D | E G F E | D F E D | G2 G2 |')
  })

  it('returns 4 phrases for ABC with three PHRASE_BREAK markers', () => {
    const split = splitOnPhraseBreaks(OLD_HUNDREDTH_FOUR_PHRASES)
    expect(split.phrases).toHaveLength(4)
    expect(split.phrases[0]).toBe('| G2 G G |')
    expect(split.phrases[3]).toBe('| G2 G2 |')
  })

  it('tolerates leading/trailing whitespace and optional space between % and PHRASE_BREAK', () => {
    const abc = `X:1\nK:G\n| A |\n   %   PHRASE_BREAK   \n| B |\n%PHRASE_BREAK\n| C |`
    const split = splitOnPhraseBreaks(abc)
    expect(split.phrases).toHaveLength(3)
    expect(split.phrases).toEqual(['| A |', '| B |', '| C |'])
  })

  it('filters out empty phrase chunks (PHRASE_BREAK immediately after K:)', () => {
    const abc = `X:1\nK:G\n% PHRASE_BREAK\n| A |\n% PHRASE_BREAK\n| B |`
    const split = splitOnPhraseBreaks(abc)
    expect(split.phrases).toHaveLength(2)
    expect(split.phrases).toEqual(['| A |', '| B |'])
  })

  it('returns { header: "", phrases: [abc] } when no K: line present (graceful fallback)', () => {
    const abc = `X:1\nT:NoKey\n| G2 G G |`
    const split = splitOnPhraseBreaks(abc)
    expect(split.header).toBe('')
    expect(split.phrases).toEqual([abc])
  })

  it('trims surrounding whitespace from each phrase body', () => {
    const abc = `X:1\nK:G\n\n   | A |   \n\n% PHRASE_BREAK\n\n   | B |   \n`
    const split = splitOnPhraseBreaks(abc)
    expect(split.phrases).toEqual(['| A |', '| B |'])
  })
})

describe('buildPhraseAbc', () => {
  const split: SplitAbc = {
    header: 'X:1\nT:Test\nK:G',
    phrases: ['| A |', '| B |', '| C |'],
  }

  it('returns header + newline + phrase[index]', () => {
    expect(buildPhraseAbc(split, 0)).toBe('X:1\nT:Test\nK:G\n| A |')
    expect(buildPhraseAbc(split, 1)).toBe('X:1\nT:Test\nK:G\n| B |')
    expect(buildPhraseAbc(split, 2)).toBe('X:1\nT:Test\nK:G\n| C |')
  })

  it('falls back to first phrase when phraseIndex is out of bounds', () => {
    expect(buildPhraseAbc(split, 99)).toBe('X:1\nT:Test\nK:G\n| A |')
    expect(buildPhraseAbc(split, -1)).toBe('X:1\nT:Test\nK:G\n| A |')
  })

  it('returns header alone when phrases array is empty (no crash)', () => {
    const emptySplit: SplitAbc = { header: 'X:1\nK:G', phrases: [] }
    expect(buildPhraseAbc(emptySplit, 0)).toBe('X:1\nK:G')
  })

  it('roundtrip: splitOnPhraseBreaks then buildPhraseAbc reconstructs each phrase with header', () => {
    const split = splitOnPhraseBreaks(OLD_HUNDREDTH_TWO_PHRASES)
    const phrase0 = buildPhraseAbc(split, 0)
    expect(phrase0).toContain('K:G')
    expect(phrase0).toContain('| G2 G G | G F E D | E G F E | D2 D2 |')
    expect(phrase0).not.toContain('PHRASE_BREAK')
    const phrase1 = buildPhraseAbc(split, 1)
    expect(phrase1).toContain('| D2 D D | E G F E | D F E D | G2 G2 |')
  })
})

describe('countNoteHeads', () => {
  it('counts 8 bare notes in a two-bar fragment', () => {
    // 8 note heads: G A B c d c B A
    expect(countNoteHeads('| G2 A B c | d c B A |')).toBe(8)
  })

  it('counts chord as 1 and adds bare notes', () => {
    // [GBd]=1, then G G G=3 → total 4
    expect(countNoteHeads('| [GBd]2 G G G |')).toBe(4)
  })

  it('subtracts tied continuation', () => {
    // G-G2: '-' immediately precedes note letter, tie regex matches → subtracts 1 → result = 1
    expect(countNoteHeads('| G-G2 |')).toBe(1)
  })

  it('ignores w: lines', () => {
    // w: line stripped (isInfoFieldLine matches "w:..."); only | G2 G G | counts = 3
    expect(countNoteHeads('w: The Lord my shep- herd\n| G2 G G |')).toBe(3)
  })

  it('ignores grace notes', () => {
    // {ag} is a grace group (ignored), f e d c remain = 4
    expect(countNoteHeads('| {ag}f e d c |')).toBe(4)
  })

  it('excludes rests from count', () => {
    // z2 is a rest (ignored), G A B c = 4
    expect(countNoteHeads('| z2 G A B c |')).toBe(4)
  })

  it('Crimond-style phrase 4 returns >= 10', () => {
    // "| f e d c | B A G2- G2 | F G A B | c2 z2 |"
    // notes: f e d c B A G G F G A B c = 13 minus tied G (G2- G2 → 1 tie) = 12 >= 10
    const result = countNoteHeads('| f e d c | B A G2- G2 | F G A B | c2 z2 |')
    expect(result).toBeGreaterThanOrEqual(10)
  })
})
