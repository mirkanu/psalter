// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { StudyContent } from './PsalmTabs'
import type { PsalmDetail } from '@/db/queries/psalms'

afterEach(() => {
  cleanup()
})

function makePsalm(verses: unknown[]): PsalmDetail {
  return {
    id: 23,
    haddingtonIntro: null,
    verses,
  } as unknown as PsalmDetail
}

describe('StudyContent cross-references section', () => {
  it('renders a linked badge when the topic id is in navesSlugMap', () => {
    const psalm = makePsalm([
      {
        id: 1,
        verseNumber: 1,
        kjvText: 'text',
        verseNavesTopics: [{ navesTopic: { id: 5, name: 'Praise' } }],
        verseDoctrines: [],
      },
    ])
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    const link = screen.getByText('Praise').closest('a')
    expect(link).not.toBeNull()
    expect(link?.getAttribute('href')).toBe('/explore/naves/praise')
  })

  it('renders a bare badge (no anchor) when the topic id is NOT in navesSlugMap', () => {
    const psalm = makePsalm([
      {
        id: 1,
        verseNumber: 1,
        kjvText: 'text',
        verseNavesTopics: [{ navesTopic: { id: 99, name: 'Obscure Topic' } }],
        verseDoctrines: [],
      },
    ])
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    expect(screen.getByText('Obscure Topic').closest('a')).toBeNull()
  })

  it('renders a doctrine name', () => {
    const psalm = makePsalm([
      {
        id: 1,
        verseNumber: 1,
        kjvText: 'text',
        verseNavesTopics: [],
        verseDoctrines: [{ doctrine: { id: 7, name: 'Justification' } }],
      },
    ])
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    expect(screen.getByText('Justification')).toBeTruthy()
  })

  it('omits a row for verses with neither topics nor doctrines', () => {
    const psalm = makePsalm([
      {
        id: 1,
        verseNumber: 1,
        kjvText: 'text',
        verseNavesTopics: [{ navesTopic: { id: 5, name: 'Praise' } }],
        verseDoctrines: [],
      },
      {
        id: 2,
        verseNumber: 2,
        kjvText: 'text',
        verseNavesTopics: [],
        verseDoctrines: [],
      },
    ])
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    expect(screen.getByTestId('study-xref-verse-1')).toBeTruthy()
    expect(screen.queryByTestId('study-xref-verse-2')).toBeNull()
  })

  it('omits the whole section when no verse has topics or doctrines', () => {
    const psalm = makePsalm([
      {
        id: 1,
        verseNumber: 1,
        kjvText: 'text',
        verseNavesTopics: [],
        verseDoctrines: [],
      },
    ])
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    expect(screen.queryByTestId('study-xref')).toBeNull()
  })
})
