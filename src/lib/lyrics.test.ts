import { describe, it, expect } from 'vitest'
import {
  splitStanzaIntoPhrasePortions,
  buildAbcWithSyllables,
} from './lyrics'

// Note: existing extractVerse1 / syllabifyForAbc tests live at
// tests/lib-utilities.test.ts and are NOT touched by this file.

const SHEPHERD_STANZA_1 = `1The Lord's my Shepherd
I'll not want
He makes me down to lie
In pastures green`

const SHEPHERD_STANZA_2 = `2My soul He doth restore
And me to walk
Within the paths of righteousness
For his own name's sake`

describe('splitStanzaIntoPhrasePortions', () => {
  it('CM 4-line stanza splits into 2 portions of 2 lines each (D-16 fixture)', () => {
    expect(splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'CM')).toEqual([
      "1The Lord's my Shepherd\nI'll not want",
      'He makes me down to lie\nIn pastures green',
    ])
  })

  it('CM with parenthesised long form normalises correctly', () => {
    expect(
      splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'CM (common meter, 8.6.8.6)'),
    ).toEqual([
      "1The Lord's my Shepherd\nI'll not want",
      'He makes me down to lie\nIn pastures green',
    ])
  })

  it('DCM 4-line stanza splits into 4 single-line portions', () => {
    expect(splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'DCM')).toEqual([
      "1The Lord's my Shepherd",
      "I'll not want",
      'He makes me down to lie',
      'In pastures green',
    ])
  })

  it('DCM 8-line stanza splits into 4 two-line portions', () => {
    const eightLine = `1Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8`
    expect(splitStanzaIntoPhrasePortions(eightLine, 'DCM')).toEqual([
      '1Line1\nLine2',
      'Line3\nLine4',
      'Line5\nLine6',
      'Line7\nLine8',
    ])
  })

  it('null meter returns the stanza unsplit (single-element array)', () => {
    expect(splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, null)).toEqual([
      SHEPHERD_STANZA_1,
    ])
  })

  it('undefined meter returns the stanza unsplit', () => {
    expect(splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, undefined)).toEqual([
      SHEPHERD_STANZA_1,
    ])
  })

  it('unknown meter returns the stanza unsplit', () => {
    expect(splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'BOGUS')).toEqual([
      SHEPHERD_STANZA_1,
    ])
  })

  it('empty stanza returns N empty strings (CM → 2)', () => {
    expect(splitStanzaIntoPhrasePortions('', 'CM')).toEqual(['', ''])
  })

  it('whitespace-only stanza returns N empty strings (DCM → 4)', () => {
    expect(splitStanzaIntoPhrasePortions('   \n  \n\n', 'DCM')).toEqual([
      '',
      '',
      '',
      '',
    ])
  })

  it('trims whitespace per line and filters blank lines before slicing', () => {
    const messy = `1Alpha\n  \nBeta\n\nGamma\n   Delta   `
    expect(splitStanzaIntoPhrasePortions(messy, 'CM')).toEqual([
      '1Alpha\nBeta',
      'Gamma\nDelta',
    ])
  })

  it('preserves verse-number prefix on first portion only', () => {
    const result = splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'CM')
    expect(result[0]).toMatch(/^1The Lord/)
    expect(result[1]).not.toMatch(/^\d/)
  })

  it('uneven L not divisible by N: final portion shorter (DCM, 5 lines → 4 portions)', () => {
    // ceil(5/4) = 2 lines per portion → [L1,L2],[L3,L4],[L5],[]
    const fiveLine = `1A\nB\nC\nD\nE`
    expect(splitStanzaIntoPhrasePortions(fiveLine, 'DCM')).toEqual([
      '1A\nB',
      'C\nD',
      'E',
      '',
    ])
  })
})

describe('buildAbcWithSyllables', () => {
  const PHRASE_ABC = `X:1
T:Test
M:C
L:1/4
K:G
| G2 G G | G F E D |`

  it('empty stanzaPortions array returns cleaned ABC with no w: lines', () => {
    const out = buildAbcWithSyllables(PHRASE_ABC, [])
    expect(out).not.toMatch(/^w:/m)
    expect(out).toContain('| G2 G G | G F E D |')
  })

  it('single portion produces one w: line with syllabified lyrics', () => {
    const out = buildAbcWithSyllables(PHRASE_ABC, [
      "1The Lord's my Shepherd\nI'll not want",
    ])
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(1)
    expect(wLines[0]).toContain("1The")
    // Newline inside portion flattened to space:
    expect(wLines[0]).not.toContain('\n')
    // syllabifyForAbc lowercases multi-syllable words and inserts the
    // hyphen at the syllable boundary nlp-syllables computes
    // ("Shepherd" -> "she- pherd")
    expect(wLines[0]).toContain('she- pherd')
  })

  it('multiple portions produce multiple consecutive w: lines in order (3-stanza CM fixture)', () => {
    const portions = [
      "1The Lord's my Shepherd\nI'll not want",
      '2My soul He doth restore\nAnd me to walk',
      '3Yea though I walk in death\'s dark vale',
    ]
    const out = buildAbcWithSyllables(PHRASE_ABC, portions)
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(3)
    expect(wLines[0]).toContain('1The')
    expect(wLines[1]).toContain('2My')
    expect(wLines[2]).toContain('3Yea')
    // Each w: line contains ONLY that stanza's portion content
    expect(wLines[0]).not.toContain('2My')
    expect(wLines[1]).not.toContain('3Yea')
  })

  it('empty-string portions are skipped (no w: emitted for that stanza)', () => {
    const portions = ['1Alpha line one', '', '3Gamma line one']
    const out = buildAbcWithSyllables(PHRASE_ABC, portions)
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(2)
    // Multi-syllable words are lowercased by syllabifyForAbc, but the digit
    // verse prefix sticks to the (now lowercase) first syllable.
    expect(wLines[0]).toContain('1al- pha')
    expect(wLines[1]).toContain('3gam')
  })

  it('whitespace-only portions are skipped', () => {
    const portions = ['1Alpha', '   ', '\n\n']
    const out = buildAbcWithSyllables(PHRASE_ABC, portions)
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(1)
  })

  it('pre-existing w: lines in input ABC are stripped before new ones appended', () => {
    const withOldW = `X:1\nK:G\n| G2 G G |\nw: old- stale ly- rics\nw: more- old\n| F E D2 |`
    const out = buildAbcWithSyllables(withOldW, ['1New lyrics here'])
    expect(out).not.toContain('old')
    expect(out).not.toContain('stale')
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(1)
    expect(wLines[0]).toContain('1New')
  })

  it('blank lines collapsed (abcjs Pitfall 1: blank line ends tune)', () => {
    const withBlanks = `X:1\nK:G\n\n\n| G2 G G |\n\n| F E D2 |\n\n`
    const out = buildAbcWithSyllables(withBlanks, ['1Test'])
    expect(out).not.toMatch(/\n\n+/)
  })

  it('newlines inside a portion flattened to spaces before syllabifying', () => {
    const portions = ['1Line one\nLine two']
    const out = buildAbcWithSyllables(PHRASE_ABC, portions)
    const wLine = out.split('\n').find((l) => l.startsWith('w:'))
    expect(wLine).toBeDefined()
    expect(wLine).not.toContain('\n')
    expect(wLine).toContain('Line')
  })

  it('output ends without trailing blank line', () => {
    const out = buildAbcWithSyllables(PHRASE_ABC, ['1Test'])
    expect(out).not.toMatch(/\n\s*$/)
  })

  it('3-stanza phrase-1 D-16 contract: each w: line contains only that stanza\'s lines 1+2', () => {
    // Simulate Plan output: for phrase 0 of a CM tune we pass portion-0 of each stanza
    const stanzaPortionsForPhrase0 = [
      splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_1, 'CM')[0],
      splitStanzaIntoPhrasePortions(SHEPHERD_STANZA_2, 'CM')[0],
      splitStanzaIntoPhrasePortions(
        '3Yea though I walk in death\'s dark vale\nYet will I fear none ill\nFor thou art with me\nAnd thy rod and staff me comfort still',
        'CM',
      )[0],
    ]
    const out = buildAbcWithSyllables(PHRASE_ABC, stanzaPortionsForPhrase0)
    const wLines = out.split('\n').filter((l) => l.startsWith('w:'))
    expect(wLines).toHaveLength(3)
    // Each w: line should reference its stanza's FIRST portion (lines 1+2 of a CM stanza)
    expect(wLines[0]).toContain('1The')
    expect(wLines[0]).toContain("not want") // line 2 of stanza 1 lyrics
    expect(wLines[0]).not.toContain('makes me') // line 3 → portion 1, not here
    expect(wLines[1]).toContain('2My')
    expect(wLines[1]).toContain('walk') // line 2 of stanza 2 lyrics
    expect(wLines[2]).toContain('3Yea')
  })
})
