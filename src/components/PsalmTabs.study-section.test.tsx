// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
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

function makePsalmWithId(id: number): PsalmDetail {
  return {
    id,
    haddingtonIntro: null,
    verses: [],
  } as unknown as PsalmDetail
}

function openXrefs() {
  fireEvent.click(screen.getByText('Cross-References'))
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
    openXrefs()
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
    openXrefs()
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
    openXrefs()
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
    openXrefs()
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
    expect(screen.queryByText('Cross-References')).toBeNull()
  })
})

describe('StudyContent collapsible sections + KJV Text removal', () => {
  function makeFullPsalm(overrides: Partial<{ haddingtonIntro: string | null }> = {}) {
    return {
      id: 23,
      haddingtonIntro: 'An introduction to this psalm.',
      verses: [
        {
          id: 1,
          verseNumber: 1,
          kjvText: 'In the beginning...',
          verseNavesTopics: [{ navesTopic: { id: 5, name: 'Praise' } }],
          verseDoctrines: [],
        },
      ],
      ...overrides,
    } as unknown as PsalmDetail
  }

  it('renders no "KJV Text" heading even when kjvVerses is non-empty', () => {
    const psalm = makeFullPsalm()
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    expect(screen.queryByText('KJV Text')).toBeNull()
  })

  it('shows the Haddington Introduction trigger but not its body on first render', () => {
    const psalm = makeFullPsalm()
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    expect(screen.getByText('Haddington Introduction')).toBeTruthy()
    expect(screen.queryByText('An introduction to this psalm.')).toBeNull()
  })

  it('reveals the Haddington Introduction body after clicking the trigger', () => {
    const psalm = makeFullPsalm()
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    const trigger = screen.getByText('Haddington Introduction')
    fireEvent.click(trigger)
    expect(screen.getByText('An introduction to this psalm.')).toBeTruthy()
  })

  it('shows the Cross-References trigger but not its badges on first render', () => {
    const psalm = makeFullPsalm()
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    expect(screen.getByText('Cross-References')).toBeTruthy()
    expect(screen.queryByText('Praise')).toBeNull()
  })

  it('reveals Cross-References badges after clicking the trigger', () => {
    const psalm = makeFullPsalm()
    render(
      <StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{ '5': 'praise' }} />,
    )
    openXrefs()
    expect(screen.getByText('Praise')).toBeTruthy()
  })
})

describe('StudyContent external resource links', () => {
  function openExternalResources() {
    fireEvent.click(screen.getByText('External Resources'))
  }

  it('resolves the three external resource URLs for psalm 16 (exercises zero-padding)', () => {
    const psalm = makePsalmWithId(16)
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    openExternalResources()
    expect(
      screen.getByText('PRCA Sermons').closest('a')?.getAttribute('href'),
    ).toBe('https://www.sermonaudio.com/gb/sermons/scripture/PSA/16?searchKeyword=%22protestant+reformed%22')
    expect(
      screen.getByText("Spurgeon's Commentary").closest('a')?.getAttribute('href'),
    ).toBe('https://gracegems.org/Spurgeon/016.htm')
    expect(
      screen.getByText('Commentaries by Calvin, Henry, Geneva and more').closest('a')?.getAttribute('href'),
    ).toBe('https://relight.app/bible/Ps.16')
  })

  it('resolves the three external resource URLs for psalm 150 (padStart no-op)', () => {
    const psalm = makePsalmWithId(150)
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    openExternalResources()
    expect(
      screen.getByText('PRCA Sermons').closest('a')?.getAttribute('href'),
    ).toBe('https://www.sermonaudio.com/gb/sermons/scripture/PSA/150?searchKeyword=%22protestant+reformed%22')
    expect(
      screen.getByText("Spurgeon's Commentary").closest('a')?.getAttribute('href'),
    ).toBe('https://gracegems.org/Spurgeon/150.htm')
    expect(
      screen.getByText('Commentaries by Calvin, Henry, Geneva and more').closest('a')?.getAttribute('href'),
    ).toBe('https://relight.app/bible/Ps.150')
  })

  it('keeps target="_blank" and rel="noopener noreferrer" on all three anchors (T-sox-01)', () => {
    const psalm = makePsalmWithId(23)
    render(<StudyContent psalm={psalm} kjvVerses={psalm.verses} navesSlugMap={{}} />)
    openExternalResources()
    const labels = [
      'PRCA Sermons',
      "Spurgeon's Commentary",
      'Commentaries by Calvin, Henry, Geneva and more',
    ]
    for (const label of labels) {
      const anchor = screen.getByText(label).closest('a')
      expect(anchor?.getAttribute('target')).toBe('_blank')
      expect(anchor?.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })
})
