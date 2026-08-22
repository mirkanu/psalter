import { describe, it, expect } from 'vitest'
import { groupLinesByBibleVerse, buildParallelRows } from './parallel-verses'
import type { StructuredLyrics } from './lyrics-structured'

describe('groupLinesByBibleVerse', () => {
  it('carries lines forward until the next bibleVerseRef', () => {
    const stanzas: StructuredLyrics = [
      {
        index: 0,
        lines: [
          { text: 'a', bibleVerseRef: 1 },
          { text: 'b' },
          { text: 'c', bibleVerseRef: 2 },
          { text: 'd' },
        ],
      },
    ]
    expect(groupLinesByBibleVerse(stanzas)).toEqual([
      { verseNumber: 1, lines: ['a', 'b'] },
      { verseNumber: 2, lines: ['c', 'd'] },
    ])
  })

  it('lets a verse span a stanza boundary in document order', () => {
    const stanzas: StructuredLyrics = [
      {
        index: 0,
        lines: [
          { text: 'w' },
          { text: 'x' },
          { text: 'y', bibleVerseRef: 3 },
        ],
      },
      {
        index: 1,
        lines: [
          { text: 'z' },
          { text: 'more' },
          { text: 'next', bibleVerseRef: 4 },
        ],
      },
    ]
    const groups = groupLinesByBibleVerse(stanzas)
    const verse3 = groups.find((g) => g.verseNumber === 3)
    expect(verse3?.lines).toEqual(['y', 'z', 'more'])
  })

  it('groups lines before any ref under verseNumber null', () => {
    const stanzas: StructuredLyrics = [
      { index: 0, lines: [{ text: 'intro-a' }, { text: 'intro-b' }] },
    ]
    expect(groupLinesByBibleVerse(stanzas)).toEqual([
      { verseNumber: null, lines: ['intro-a', 'intro-b'] },
    ])
  })

  it('returns [] for empty input', () => {
    expect(groupLinesByBibleVerse([])).toEqual([])
  })
})

describe('buildParallelRows', () => {
  const stanzas: StructuredLyrics = [
    {
      index: 0,
      lines: [
        { text: 'a', bibleVerseRef: 1 },
        { text: 'b' },
        { text: 'c', bibleVerseRef: 2 },
      ],
    },
  ]

  it('merges a verse present on both sides into one row with both texts', () => {
    const kjv = [
      { verseNumber: 1, kjvText: 'KJV one' },
      { verseNumber: 2, kjvText: 'KJV two' },
    ]
    const rows = buildParallelRows(stanzas, kjv)
    const row1 = rows.find((r) => r.verseNumber === 1)
    expect(row1?.psalterLines).toEqual(['a', 'b'])
    expect(row1?.kjvText).toBe('KJV one')
  })

  it('still yields a row for a KJV verse with no psalter group', () => {
    const kjv = [{ verseNumber: 99, kjvText: 'orphan KJV verse' }]
    const rows = buildParallelRows(stanzas, kjv)
    const row99 = rows.find((r) => r.verseNumber === 99)
    expect(row99).toBeDefined()
    expect(row99?.psalterLines).toEqual([])
    expect(row99?.kjvText).toBe('orphan KJV verse')
  })

  it('still yields a row for a psalter group with no KJV verse', () => {
    const rows = buildParallelRows(stanzas, [])
    const row1 = rows.find((r) => r.verseNumber === 1)
    expect(row1).toBeDefined()
    expect(row1?.kjvText).toBeNull()
  })

  it('sorts rows by verse number ascending with a null group first', () => {
    const withIntro: StructuredLyrics = [
      {
        index: 0,
        lines: [{ text: 'intro' }, { text: 'a', bibleVerseRef: 1 }],
      },
    ]
    const kjv = [{ verseNumber: 1, kjvText: 'one' }]
    const rows = buildParallelRows(withIntro, kjv)
    expect(rows.map((r) => r.verseNumber)).toEqual([null, 1])
  })

  it('never emits the same verse number in two rows', () => {
    const kjv = [
      { verseNumber: 1, kjvText: 'one' },
      { verseNumber: 2, kjvText: 'two' },
    ]
    const rows = buildParallelRows(stanzas, kjv)
    const numbers = rows.map((r) => r.verseNumber)
    expect(new Set(numbers).size).toBe(numbers.length)
  })
})
