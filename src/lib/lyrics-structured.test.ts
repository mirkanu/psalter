import { describe, it, expect } from 'vitest'
import {
  parseLyrics,
  serialiseLyrics,
  type Stanza,
  type Line,
} from './lyrics-structured'

// Silence unused-type warnings — these are re-exported here so any future
// shape drift surfaces as a test-file compile error rather than a runtime
// surprise.
void (null as unknown as Stanza)
void (null as unknown as Line)

// ---------- Fixtures (verbatim whitespace, preserved via template literals) ----------

const PSALM_23_ST1 = `1The Lord's my shepherd, I'll not want.
2He maketh me down to lie
In pastures green: he leadeth me
the quiet waters by.`

const F1_CONTINUATION = `1The Lord doth reign, and clothed is he
with majesty most bright
his works do show him cloth'd to be
and girt about with might.

The world is also stablished
that it cannot depart.
His throne is fixed of old, and he
is from everlasting.`

const F2_MIDLINE_SPACE = `5Thy wondrous works I will record.
6 By men the might shall be extoll'd
of thy dread acts; and I
abroad thy greatness will declare.`

const F3_MIDLINE_NOSPACE = `4His eyes do see, his eye-lids try
5men's sons. The just he proves:
But his soul hates the wicked man,
and him that vi'lence loves.`

const F4_REFRAIN = `For certainly
His mercies dure
most firm and sure
eternally.`

const F5_COLOPHON = `1The prayers of David
end with this line.
the third line here
the fourth line too.
#The prayers of David the son of Jesse are ended.`

const F6_BAD_LINE_COUNT = `1Line one
line two
line three
line four
line five`

// ---------- Tests ----------

describe('parseLyrics — Psalm 23 canonical (D-16)', () => {
  it('assigns bibleVerseRef=1 on line 0 and bibleVerseRef=2 on line 1', () => {
    const r = parseLyrics(PSALM_23_ST1, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.stanzas).toHaveLength(1)
    expect(r.stanzas[0].index).toBe(0)
    expect(r.stanzas[0].lines).toHaveLength(4)
    expect(r.stanzas[0].lines[0].bibleVerseRef).toBe(1)
    expect(r.stanzas[0].lines[0].text).toBe("The Lord's my shepherd, I'll not want.")
    expect(r.stanzas[0].lines[1].bibleVerseRef).toBe(2)
    expect(r.stanzas[0].lines[1].text).toBe('He maketh me down to lie')
    expect(r.stanzas[0].lines[2].bibleVerseRef).toBeUndefined()
    expect(r.stanzas[0].lines[2].text).toBe('In pastures green: he leadeth me')
    expect(r.stanzas[0].lines[3].bibleVerseRef).toBeUndefined()
    expect(r.stanzas[0].lines[3].text).toBe('the quiet waters by.')
  })
})

describe('parseLyrics — F-1 continuation stanza', () => {
  it('leaves bibleVerseRef undefined on the continuation stanza first line', () => {
    const r = parseLyrics(F1_CONTINUATION, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.stanzas).toHaveLength(2)
    expect(r.stanzas[1].index).toBe(1)
    expect(r.stanzas[1].lines[0].bibleVerseRef).toBeUndefined()
    expect(r.stanzas[1].lines[0].text).toMatch(/^The world/)
  })
})

describe('parseLyrics — F-2 mid-line digit with space', () => {
  it('extracts bibleVerseRef=6 from "6 By ..." and strips the digit + space', () => {
    const r = parseLyrics(F2_MIDLINE_SPACE, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.stanzas[0].lines[1].bibleVerseRef).toBe(6)
    expect(r.stanzas[0].lines[1].text.startsWith('By')).toBe(true)
  })
})

describe('parseLyrics — F-3 mid-line digit glued to letter', () => {
  it('extracts bibleVerseRef=5 from "5men\'s ..." and strips the digit', () => {
    const r = parseLyrics(F3_MIDLINE_NOSPACE, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.stanzas[0].lines[1].bibleVerseRef).toBe(5)
    expect(r.stanzas[0].lines[1].text.startsWith("men's")).toBe(true)
  })
})

describe('parseLyrics — F-4 refrain (no digits anywhere)', () => {
  it('returns ok=true with every line having bibleVerseRef undefined', () => {
    const r = parseLyrics(F4_REFRAIN, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    for (const stanza of r.stanzas) {
      for (const line of stanza.lines) {
        expect(line.bibleVerseRef).toBeUndefined()
      }
    }
  })
})

describe('parseLyrics — F-5 colophon quarantine', () => {
  it('returns ok=false with reason mentioning colophon', () => {
    const r = parseLyrics(F5_COLOPHON, 'CM')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason.toLowerCase()).toMatch(/colophon/)
  })
})

describe('parseLyrics — F-6 meter mismatch quarantine', () => {
  it('returns ok=false when non-blank-line count is not a multiple of meter', () => {
    const r = parseLyrics(F6_BAD_LINE_COUNT, 'CM')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason.toLowerCase()).toMatch(/multiple/)
  })
})

describe('parseLyrics — F-7 unknown / undeclared meter', () => {
  it('returns ok=false with reason mentioning unknown meter or METRICAL_LINES', () => {
    const r = parseLyrics(PSALM_23_ST1, 'BOGUS_METER_XYZ')
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason.toLowerCase()).toMatch(/unknown meter|metrical_lines/)
  })

  it('returns ok=false with reason mentioning unknown meter when meter is null', () => {
    const r = parseLyrics(PSALM_23_ST1, null)
    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.reason.toLowerCase()).toMatch(/unknown meter|metrical_lines/)
  })
})

describe('serialiseLyrics — strict round-trip (D-05)', () => {
  const NORMALISE = (s: string) =>
    s
      .replace(/\n\s*\n+/g, '\n\n')
      .replace(/[ \t]+$/gm, '')
      .replace(/(\d+)\s+(?=[A-Za-z])/g, '$1')
      .trim()

  it.each([
    ['Psalm 23 st1', PSALM_23_ST1],
    ['F-1 continuation', F1_CONTINUATION],
    ['F-2 midline space', F2_MIDLINE_SPACE],
    ['F-3 midline glued', F3_MIDLINE_NOSPACE],
    ['F-4 refrain', F4_REFRAIN],
  ])('round-trips %s lossless modulo whitespace', (_label, blob) => {
    const r = parseLyrics(blob, 'CM')
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(NORMALISE(serialiseLyrics(r.stanzas))).toBe(NORMALISE(blob))
  })
})
