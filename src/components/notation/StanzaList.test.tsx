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

describe('StanzaList — RENDER-03 inline verse superscripts', () => {
  it('renders <sup class="verse-number"> for each line that has bibleVerseRef', () => {
    const { container } = render(<StanzaList stanzas={[PSALM_23_ST1]} />)
    const sups = container.querySelectorAll('sup.verse-number')
    expect(sups.length).toBe(2)
    expect(sups[0].textContent).toBe('1')
    expect(sups[1].textContent).toBe('2')
  })

  it('omits <sup> for lines without bibleVerseRef', () => {
    const stanzaNoRefs: Stanza = {
      index: 0,
      lines: [{ text: 'Refrain line one' }, { text: 'Refrain line two' }],
    }
    const { container } = render(<StanzaList stanzas={[stanzaNoRefs]} />)
    expect(container.querySelectorAll('sup.verse-number').length).toBe(0)
  })

  it('uses verse-text class on stanza paragraph (reuses existing CSS)', () => {
    const { container } = render(<StanzaList stanzas={[PSALM_23_ST1]} />)
    expect(container.querySelectorAll('p.verse-text').length).toBeGreaterThanOrEqual(1)
  })

  it('returns null for empty stanzas array', () => {
    const { container } = render(<StanzaList stanzas={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders each stanza in document order', () => {
    const s0: Stanza = { index: 0, lines: [{ text: 'First', bibleVerseRef: 1 }] }
    const s1: Stanza = { index: 1, lines: [{ text: 'Second', bibleVerseRef: 2 }] }
    const { container } = render(<StanzaList stanzas={[s0, s1]} />)
    const paragraphs = container.querySelectorAll('p.verse-text')
    expect(paragraphs[0].textContent).toContain('First')
    expect(paragraphs[1].textContent).toContain('Second')
  })
})
