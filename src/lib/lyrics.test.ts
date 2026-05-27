import { describe, it, expect } from 'vitest'
import { buildAbcWithSyllables, syllabifyForAbc } from './lyrics'

// Note: existing extractVerse1 / syllabifyForAbc tests live at
// tests/lib-utilities.test.ts and are NOT touched by this file.
//
// The retired splitStanzaIntoPhrasePortions heuristic was deleted in
// Phase 04.9.6 plan 04 along with its meter-string-driven cycle logic;
// alignment now reads structured stanza.lines directly via
// mapCycleToPhraseSyllableLines (see src/lib/stanza-cycles.ts and its
// dedicated test file).

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
    // Simulate Plan output: for phrase 0 of a CM tune we pass the CM-line-1+2
    // slice of each stanza as the "portion" string. (Pre-04.9.6-04 this was
    // computed via the retired splitStanzaIntoPhrasePortions helper; the
    // structured-lyrics replacement lives in stanza-cycles.ts and is exercised
    // by stanza-cycles.test.ts. This test still asserts the buildAbcWithSyllables
    // contract by passing the equivalent portion strings inline.)
    const stanzaPortionsForPhrase0 = [
      "1The Lord's my Shepherd\nI'll not want",
      '2My soul He doth restore\nAnd me to walk',
      "3Yea though I walk in death's dark vale\nYet will I fear none ill",
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

// ── PSALM_SYLLABLE_OVERRIDES — psalm vocabulary syllabification fixes ─────────
// These tests guard PSALM_SYLLABLE_OVERRIDES in lyrics.ts, which corrects
// systematic errors in the nlp-syllables library for archaic Psalter vocabulary.
// Each override ensures stanzas have matching syllable counts per metrical line,
// which is required for correct cross-stanza alignment in the staff view.
describe('syllabifyForAbc — PSALM_SYLLABLE_OVERRIDES (psalm vocabulary)', () => {
  // helper: count space-separated tokens in syllabifyForAbc output
  const tokenCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length

  it('prayer → 2 syllables: pray- er', () => {
    expect(syllabifyForAbc('prayer')).toBe('pray- er')
  })

  it('prayers → 2 syllables: pray- ers', () => {
    expect(syllabifyForAbc('prayers')).toBe('pray- ers')
  })

  it('prayer with trailing punctuation → pray- er,', () => {
    expect(syllabifyForAbc('prayer,')).toBe('pray- er,')
  })

  it('Prayer (capitalised) → pray- er (multi-syllable overrides are lowercase, same as NLP)', () => {
    // Override syllables are lowercase strings. Multi-syllable words do NOT
    // preserve capitalisation — consistent with NLP behaviour ("Praise" → "prai- se").
    // Single-syllable overrides (e.g. "Tongues") DO preserve case via the stripped path.
    expect(syllabifyForAbc('Prayer')).toBe('pray- er')
  })

  it('tongues → 1 syllable (no split)', () => {
    expect(syllabifyForAbc('tongues')).toBe('tongues')
  })

  it('Tongues (capitalised) → 1 syllable', () => {
    expect(syllabifyForAbc('Tongues')).toBe('Tongues')
  })

  it('enemy → 3 syllables: en- e- my', () => {
    expect(syllabifyForAbc('enemy')).toBe('en- e- my')
  })

  it('enemies → 3 syllables: en- e- mies', () => {
    expect(syllabifyForAbc('enemies')).toBe('en- e- mies')
  })

  it('iniquity → 4 syllables: in- iq- ui- ty', () => {
    expect(syllabifyForAbc('iniquity')).toBe('in- iq- ui- ty')
  })

  it('iniquity with trailing punctuation → in- iq- ui- ty:', () => {
    expect(syllabifyForAbc('iniquity:')).toBe('in- iq- ui- ty:')
  })

  it('iniquities → 4 syllables: in- iq- ui- ties', () => {
    expect(syllabifyForAbc('iniquities')).toBe('in- iq- ui- ties')
  })

  it('righteous → 2 syllables: righ- teous', () => {
    expect(syllabifyForAbc('righteous')).toBe('righ- teous')
  })

  it('Righteous (capitalised) → righ- teous (multi-syllable overrides are lowercase)', () => {
    expect(syllabifyForAbc('Righteous')).toBe('righ- teous')
  })

  it('righteousness → 3 syllables: righ- teous- ness', () => {
    expect(syllabifyForAbc('righteousness')).toBe('righ- teous- ness')
  })

  it('unrighteous → 3 syllables: un- righ- teous', () => {
    expect(syllabifyForAbc('unrighteous')).toBe('un- righ- teous')
  })

  it('unrighteousness → 4 syllables: un- righ- teous- ness', () => {
    expect(syllabifyForAbc('unrighteousness')).toBe('un- righ- teous- ness')
  })

  it('majesty → 3 syllables: maj- es- ty', () => {
    expect(syllabifyForAbc('majesty')).toBe('maj- es- ty')
  })

  // ── Full-line token-count regression tests (Psalm 64 alignment) ───────────
  it('Psalm 64 S1 L1: "When I to thee my prayer make," → 8 tokens (not 7)', () => {
    // Before fix: "prayer" counted as 1 → 7 tokens; after: "pray- er" = 2 → 8
    expect(tokenCount(syllabifyForAbc('When I to thee my prayer make,'))).toBe(8)
  })

  it('Psalm 64 S3 L1: "Who do their tongues with malice whet," → 8 tokens (not 9)', () => {
    // Before fix: "tongues" split as "ton- gues" (2) → 9 tokens; after: 1 → 8
    expect(tokenCount(syllabifyForAbc('Who do their tongues with malice whet,'))).toBe(8)
  })

  it('Psalm 64 S2 L1: "Me from their secret counsel hide" → 8 tokens (unchanged)', () => {
    // This stanza was already correct; must stay 8 after the fix
    expect(tokenCount(syllabifyForAbc('Me from their secret counsel hide'))).toBe(8)
  })
})
