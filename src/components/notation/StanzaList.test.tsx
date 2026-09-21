// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StanzaList } from './StanzaList'
import type { Stanza } from '@/lib/lyrics-structured'

const PSALM_23_ST1: Stanza = {
  index: 0,
  lines: [
    { text: "The Lord's my shepherd, I'll not want.", bibleVerseRef: 1 },
    { text: 'He maketh me down to lie',               bibleVerseRef: 2 },
    { text: 'In pastures green: he leadeth me' },
    { text: 'the quiet waters by.' },
  ],
}

describe('StanzaList — verse numbers, CM indentation, subtitle', () => {
  it('renders <span class="verse-number"> for each line that has bibleVerseRef', () => {
    const { container } = render(<StanzaList stanzas={[PSALM_23_ST1]} />)
    const numbers = container.querySelectorAll('span.verse-number')
    expect(numbers.length).toBe(4) // one per line, blank when no ref
    expect(numbers[0].textContent).toBe('1')
    expect(numbers[1].textContent).toBe('2')
    expect(numbers[2].textContent).toBe('')
    expect(numbers[3].textContent).toBe('')
  })

  it('omits verse-number text (but keeps the column) for lines without bibleVerseRef', () => {
    const stanzaNoRefs: Stanza = {
      index: 0,
      lines: [{ text: 'Refrain line one' }, { text: 'Refrain line two' }],
    }
    const { container } = render(<StanzaList stanzas={[stanzaNoRefs]} />)
    const numbers = container.querySelectorAll('span.verse-number')
    expect(numbers.length).toBe(2)
    expect(numbers[0].textContent).toBe('')
    expect(numbers[1].textContent).toBe('')
  })

  it('wraps each stanza in a div group', () => {
    const { container } = render(<StanzaList stanzas={[PSALM_23_ST1]} />)
    expect(container.querySelectorAll('div.space-y-0').length).toBe(1)
  })

  it('returns null for empty stanzas array', () => {
    const { container } = render(<StanzaList stanzas={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders each stanza in document order', () => {
    const s0: Stanza = { index: 0, lines: [{ text: 'First', bibleVerseRef: 1 }] }
    const s1: Stanza = { index: 1, lines: [{ text: 'Second', bibleVerseRef: 2 }] }
    const { container } = render(<StanzaList stanzas={[s0, s1]} />)
    const stanzas = container.querySelectorAll('div.space-y-0')
    expect(stanzas.length).toBe(2)
    expect(stanzas[0].textContent).toContain('First')
    expect(stanzas[1].textContent).toContain('Second')
  })

  it('emits CM indentation classes on lines 2/4 of a 4-line stanza', () => {
    const stanza: Stanza = {
      index: 0,
      lines: [
        { text: 'L1', bibleVerseRef: 1 },
        { text: 'L2' },
        { text: 'L3' },
        { text: 'L4' },
      ],
    }
    const { container } = render(<StanzaList stanzas={[stanza]} stanzaMeter="CM" />)
    const rows = container.querySelectorAll('div.verse-line')
    expect(rows.length).toBe(4)
    expect(rows[0].className).toMatch(/\bverse-line\b/)
    expect(rows[1].className).toMatch(/\bcm-indent-2\b/)
    expect(rows[2].className).toMatch(/\bverse-line\b/)
    expect(rows[3].className).toMatch(/\bcm-indent-4\b/)
  })

  it('does NOT indent lines 2/4 for non-CM metres (LM/SM/etc.)', () => {
    const stanza: Stanza = {
      index: 0,
      lines: [
        { text: 'L1', bibleVerseRef: 1 },
        { text: 'L2' },
        { text: 'L3' },
        { text: 'L4' },
      ],
    }
    const { container } = render(<StanzaList stanzas={[stanza]} stanzaMeter="LM" />)
    const rows = container.querySelectorAll('div.verse-line')
    expect(rows.length).toBe(4)
    for (const row of rows) {
      expect(row.className).not.toMatch(/\bcm-indent/)
    }
  })
})
