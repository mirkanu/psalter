import { describe, it, expect } from 'vitest'
import { buildEmbeddedWline } from './build-embedded-wline'
import { splitOnPhraseBreaks, countNoteHeads } from './abc-phrases'

/**
 * Fixture: Crimond §8 worked example from lyric-to-note-alignment.md.
 *
 * Phrase 1 has 10 notes; 2 of them are slur-continuations (positions 4 and 7,
 * 1-indexed → 3 and 6 zero-indexed). That phrase carries 8 syllables.
 *
 * The remaining phrases (2,3,4) are simplified for the fixture: they have no
 * melismas and a 1:1 syllable:note ratio. CM line counts are 8/6/8/6.
 */
const CRIMOND_TOKENS: string[] = [
  // Phrase 1 (10 tokens) — §8 worked example
  'c', 'a', 'b', 'g', 'c\'', 'b', 'g', 'f', 'e', 'f',
  // Phrase 2 (6 tokens) — no melismas
  'c', 'a', 'b', 'g', 'a', 'f',
  // Phrase 3 (8 tokens) — no melismas
  'c', 'a', 'b', 'g', 'c\'', 'b', 'a', 'g',
  // Phrase 4 (6 tokens) — no melismas
  'c', 'a', 'b', 'g', 'a', 'f',
]

// Underlines at positions 3 and 6 in phrase 1 (g and g — §8 melisma continuations).
const CRIMOND_UNDERLINED: boolean[] = [
  false, false, false, true, false, false, true, false, false, false,
  false, false, false, false, false, false,
  false, false, false, false, false, false, false, false,
  false, false, false, false, false, false,
]

// CM stanza 1 Psalm 23: 8+6+8+6 = 28 syllables.
const CRIMOND_SYLLABLES: string[] = [
  'The', "Lord's", 'my', 'shep-', '-herd,', "I'll", 'not', 'want;',
  'he', 'makes', 'me', 'down', 'to', 'lie',
  'in', 'pas-', '-tures', 'green:', 'he', 'lead-', '-eth', 'me',
  'the', 'qui-', '-et', 'wat-', '-ers', 'by.',
]

// Hand-crafted ABC body whose note-head counts per phrase match
// the fixture (10, 6, 8, 6). Music doesn't have to be musically meaningful;
// only countNoteHeads must agree.
function buildCrimondAbcBody(opts: { phrase1BreakAfter?: number } = {}): string {
  // Phrase 1: 10 quarter notes (durations don't matter for countNoteHeads)
  const p1full = 'c a b g c\' b g f e f'
  // PHRASE_BREAK position variance — split phrase 1 vs phrase 2 differently
  // for the invariance test. By default the break sits after note 10.
  // If breakAfter is provided, slide a note from phrase 2 into phrase 1
  // OR vice versa to test invariance. We keep the music body identical
  // but move where the comment marker falls. Since phrase fixture
  // requires note counts to match w-line lengths, the invariance test
  // creates a DIFFERENT split that totals the same.
  const breakAfter = opts.phrase1BreakAfter ?? 10
  if (breakAfter === 10) {
    return [
      `X:1`,
      `T:Crimond Fixture`,
      `M:3/4`,
      `L:1/4`,
      `K:F`,
      p1full,
      `% PHRASE_BREAK`,
      `c a b g a f`,
      `% PHRASE_BREAK`,
      `c a b g c' b a g`,
      `% PHRASE_BREAK`,
      `c a b g a f`,
    ].join('\n')
  }
  // Alternate split for invariance test — break after 9 instead of 10
  // (steal one note from phrase 1 into phrase 2). For this we need a
  // DIFFERENT tokens/underline fixture so call sites are responsible
  // for keeping arrays consistent.
  if (breakAfter === 9) {
    return [
      `X:1`,
      `T:Crimond Fixture (alt)`,
      `M:3/4`,
      `L:1/4`,
      `K:F`,
      `c a b g c' b g f e`, // 9 notes
      `% PHRASE_BREAK`,
      `f c a b g a f`, // 7 notes (was 6, gained 1)
      `% PHRASE_BREAK`,
      `c a b g c' b a g`,
      `% PHRASE_BREAK`,
      `c a b g a f`,
    ].join('\n')
  }
  throw new Error(`unsupported breakAfter=${breakAfter}`)
}

function wTokenCount(phraseBody: string): number {
  const wLine = phraseBody
    .split('\n')
    .map((l) => l.trim())
    .find((l) => /^w:/.test(l))
  if (!wLine) return 0
  return wLine.replace(/^w:\s*/, '').trim().split(/\s+/).filter(Boolean).length
}

describe('buildEmbeddedWline', () => {
  it('Test 1 — Crimond §8 worked example: emits _ at documented melisma positions', () => {
    const result = buildEmbeddedWline({
      tokens: CRIMOND_TOKENS,
      underlined: CRIMOND_UNDERLINED,
      syllables: CRIMOND_SYLLABLES,
      existingAbc: buildCrimondAbcBody(),
    })

    expect(result.passesValidation).toBe(true)
    expect(result.warnings).toEqual([])

    const split = splitOnPhraseBreaks(result.abc)
    expect(split.phrases).toHaveLength(4)

    const wLines = split.phrases.map((p) =>
      p
        .split('\n')
        .map((l) => l.trim())
        .find((l) => /^w:/.test(l)),
    )

    // Phrase 1: 10 tokens, _ at positions 4 and 7 (1-indexed).
    // Per §8: "The Lord's my _ shep herd, _ I'll not want;"
    // (Plus comma normalisation — fixture syllables include trailing
    //  punctuation as-is.)
    expect(wLines[0]).toBe("w: The Lord's my _ shep- -herd, _ I'll not want;")
    // Subsequent phrases: trivial syllabic mapping
    expect(wLines[1]).toBe('w: he makes me down to lie')
    expect(wLines[2]).toBe('w: in pas- -tures green: he lead- -eth me')
    expect(wLines[3]).toBe('w: the qui- -et wat- -ers by.')
  })

  it('Test 2 — Single-source-of-truth invariant: countNoteHeads === wTokenCount per phrase', () => {
    const result = buildEmbeddedWline({
      tokens: CRIMOND_TOKENS,
      underlined: CRIMOND_UNDERLINED,
      syllables: CRIMOND_SYLLABLES,
      existingAbc: buildCrimondAbcBody(),
    })
    expect(result.passesValidation).toBe(true)
    const split = splitOnPhraseBreaks(result.abc)
    for (const phrase of split.phrases) {
      expect(wTokenCount(phrase)).toBe(countNoteHeads(phrase))
    }
    // Also check perPhrase diagnostics report the same numbers
    for (const p of result.perPhrase) {
      expect(p.wTokenCount).toBe(p.noteHeadCount)
    }
  })

  it('Test 3 — PHRASE_BREAK invariance: w-token sequence is independent of break placement', () => {
    // Same OCR data (tokens/underlines/syllables) — two different PHRASE_BREAK splits.
    // Token-stream consumed by the algorithm is identical; emitted w-tokens (with PHRASE_BREAK
    // separators removed) must be identical too.
    const r1 = buildEmbeddedWline({
      tokens: CRIMOND_TOKENS,
      underlined: CRIMOND_UNDERLINED,
      syllables: CRIMOND_SYLLABLES,
      existingAbc: buildCrimondAbcBody({ phrase1BreakAfter: 10 }),
    })
    const r2 = buildEmbeddedWline({
      tokens: CRIMOND_TOKENS,
      underlined: CRIMOND_UNDERLINED,
      syllables: CRIMOND_SYLLABLES,
      existingAbc: buildCrimondAbcBody({ phrase1BreakAfter: 9 }),
    })

    expect(r1.passesValidation).toBe(true)
    expect(r2.passesValidation).toBe(true)

    const collect = (abc: string): string =>
      splitOnPhraseBreaks(abc)
        .phrases.flatMap((p) =>
          p
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => /^w:/.test(l))
            .map((l) => l.replace(/^w:\s*/, '').trim()),
        )
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()

    expect(collect(r1.abc)).toBe(collect(r2.abc))
  })

  it('Test 4 — Validation failure: syllable count mismatch surfaces as passesValidation=false (no throw)', () => {
    // Drop one syllable so non-underlined count (28) !== syllables.length (27)
    const tooFew = CRIMOND_SYLLABLES.slice(0, 27)
    let result: ReturnType<typeof buildEmbeddedWline> | undefined
    expect(() => {
      result = buildEmbeddedWline({
        tokens: CRIMOND_TOKENS,
        underlined: CRIMOND_UNDERLINED,
        syllables: tooFew,
        existingAbc: buildCrimondAbcBody(),
      })
    }).not.toThrow()
    expect(result!.passesValidation).toBe(false)
    expect(result!.warnings.length).toBeGreaterThan(0)
    // At least one warning should name the mismatch
    expect(result!.warnings.some((w) => /syllable|mismatch|count/i.test(w))).toBe(true)
  })

  it('Test 5 — Multi-note melisma: underline spanning 3 notes emits _ _ _', () => {
    // Fixture: a single phrase of 4 notes; 3 are underlined → "syl _ _ _"
    const tokens = ['d', 'r', 'm', 'f']
    const underlined = [false, true, true, true]
    const syllables = ['lo']
    const existingAbc = ['X:1', 'T:Multi', 'L:1/4', 'K:C', 'C D E F'].join('\n')
    const result = buildEmbeddedWline({ tokens, underlined, syllables, existingAbc })

    expect(result.passesValidation).toBe(true)
    const split = splitOnPhraseBreaks(result.abc)
    const wLine = split.phrases[0]
      .split('\n')
      .map((l) => l.trim())
      .find((l) => /^w:/.test(l))
    expect(wLine).toBe('w: lo _ _ _')
  })

  it('Test 6 — Edge case: zero syllables OR zero tokens returns passesValidation=false without throwing', () => {
    const existingAbc = ['X:1', 'T:Empty', 'L:1/4', 'K:C', 'C D'].join('\n')

    let r1: ReturnType<typeof buildEmbeddedWline> | undefined
    expect(() => {
      r1 = buildEmbeddedWline({
        tokens: [],
        underlined: [],
        syllables: ['foo'],
        existingAbc,
      })
    }).not.toThrow()
    expect(r1!.passesValidation).toBe(false)
    expect(r1!.warnings.length).toBeGreaterThan(0)

    let r2: ReturnType<typeof buildEmbeddedWline> | undefined
    expect(() => {
      r2 = buildEmbeddedWline({
        tokens: ['c', 'd'],
        underlined: [false, false],
        syllables: [],
        existingAbc,
      })
    }).not.toThrow()
    expect(r2!.passesValidation).toBe(false)
    expect(r2!.warnings.length).toBeGreaterThan(0)
  })
})
