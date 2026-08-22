// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { ParallelContent } from './PsalmTabs'
import type { StructuredLyrics } from '@/lib/lyrics-structured'
import type { PsalmDetail } from '@/db/queries/psalms'

afterEach(() => {
  cleanup()
})

function makeKjvVerses(verses: Array<{ id: number; verseNumber: number; kjvText: string }>) {
  return verses as unknown as PsalmDetail['verses']
}

describe('ParallelContent', () => {
  it('renders one parallel-row per merged verse with psalter + KJV text side by side (table path)', () => {
    const structured: StructuredLyrics = [
      {
        index: 0,
        lines: [
          { text: 'The Lord is my shepherd', bibleVerseRef: 1 },
          { text: 'I shall not want' },
          { text: 'He leadeth me', bibleVerseRef: 2 },
        ],
      },
    ]
    const kjvVerses = makeKjvVerses([
      { id: 1, verseNumber: 1, kjvText: 'The LORD is my shepherd; I shall not want.' },
      { id: 2, verseNumber: 2, kjvText: 'He leadeth me beside the still waters.' },
    ])
    render(<ParallelContent structured={structured} lyrics={null} kjvVerses={kjvVerses} />)

    expect(screen.getByTestId('parallel-table')).toBeTruthy()
    const rows = screen.getAllByTestId('parallel-row')
    expect(rows.length).toBe(2)
    // getByText normalises whitespace (collapses the pre-line newline to a
    // space), so match on the normalised text content rather than the raw
    // '\n'-joined string that the component actually renders.
    expect(screen.getByText('The Lord is my shepherd I shall not want')).toBeTruthy()
    expect(screen.getByText('The LORD is my shepherd; I shall not want.')).toBeTruthy()
    expect(screen.getByText('He leadeth me beside the still waters.')).toBeTruthy()
  })

  it('KJV cell wraps long prose instead of inheriting whitespace-nowrap', () => {
    const structured: StructuredLyrics = [
      { index: 0, lines: [{ text: 'The Lord is my shepherd', bibleVerseRef: 1 }] },
    ]
    const kjvVerses = makeKjvVerses([
      { id: 1, verseNumber: 1, kjvText: 'The LORD is my shepherd; I shall not want.' },
    ])
    render(<ParallelContent structured={structured} lyrics={null} kjvVerses={kjvVerses} />)
    const row = screen.getAllByTestId('parallel-row')[0]
    const kjvCell = row.querySelectorAll('td')[2]
    expect(kjvCell.className).toContain('whitespace-normal')
    expect(kjvCell.className).not.toContain('whitespace-nowrap')
  })

  it('Scottish Psalter cell keeps whitespace-pre-line', () => {
    const structured: StructuredLyrics = [
      { index: 0, lines: [{ text: 'The Lord is my shepherd', bibleVerseRef: 1 }] },
    ]
    const kjvVerses = makeKjvVerses([
      { id: 1, verseNumber: 1, kjvText: 'The LORD is my shepherd; I shall not want.' },
    ])
    render(<ParallelContent structured={structured} lyrics={null} kjvVerses={kjvVerses} />)
    const row = screen.getAllByTestId('parallel-row')[0]
    const psalterCell = row.querySelectorAll('td')[1]
    expect(psalterCell.className).toContain('whitespace-pre-line')
  })

  it('renders the legacy fallback (no table) when structured is null', () => {
    const kjvVerses = makeKjvVerses([{ id: 1, verseNumber: 1, kjvText: 'KJV text.' }])
    render(
      <ParallelContent
        structured={null}
        lyrics={'1The Lord is my shepherd\nI shall not want'}
        kjvVerses={kjvVerses}
      />,
    )
    expect(screen.getByTestId('parallel-fallback')).toBeTruthy()
    expect(screen.queryByTestId('parallel-table')).toBeNull()
  })
})
