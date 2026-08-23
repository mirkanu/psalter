// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { PsalmTabs } from './PsalmTabs'
import type { StructuredLyrics } from '@/lib/lyrics-structured'
import type { PsalmDetail } from '@/db/queries/psalms'

afterEach(() => {
  cleanup()
})

function makeVerses(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const verseNumber = i + 1
    const inRangeTopic = verseNumber === 20
    const outOfRangeTopic = verseNumber === 5
    return {
      id: verseNumber,
      verseNumber,
      kjvText: `KJV verse ${verseNumber}`,
      verseNavesTopics: inRangeTopic
        ? [{ navesTopic: { id: 1, name: 'InRangeTopic' } }]
        : outOfRangeTopic
          ? [{ navesTopic: { id: 2, name: 'OutOfRangeTopic' } }]
          : [],
      verseDoctrines: [],
    }
  })
}

function makeStructured(start: number, end: number): StructuredLyrics {
  const lines = []
  for (let v = start; v <= end; v++) {
    lines.push({ index: v - start, lines: [{ text: `Psalter line ${v}`, bibleVerseRef: v }] })
  }
  return lines
}

const dailyReadings = [
  // Overlaps 17-24
  { id: 1, dayNumber: 1, readingDate: null, notes: null, startingVerse: 17, endingVerse: 24 },
  // Does NOT overlap 17-24
  { id: 2, dayNumber: 2, readingDate: null, notes: null, startingVerse: 1, endingVerse: 8 },
  // Unscoped -- always overlaps
  { id: 3, dayNumber: 3, readingDate: null, notes: null, startingVerse: null, endingVerse: null },
]

/**
 * Models a real Psalm 119 sub-division psalmVersion: its own `lyricsStructured`
 * is ALREADY scoped to just its own 8 verses (17-24), but `psalm.verses` (KJV)
 * is the whole-psalm, unfiltered list (1-30 here standing in for 1-176) --
 * this mismatch is exactly what produces the ~168 phantom rows bug.
 */
function makeSubDivisionPsalm(): PsalmDetail {
  return {
    id: 119,
    book: null,
    author: null,
    bibleTitle: null,
    haddingtonIntro: null,
    sectionHeadings: [],
    psalmTopics: [],
    messianicPsalms: [],
    psalmVersions: [
      {
        id: 1,
        airtableId: null,
        psalmId: 119,
        psalterNumber: '119:17-24 (3)',
        lyricsImportedRaw: null,
        lyricsStructured: makeStructured(17, 24),
        meter: 'CM',
        versionLabel: null,
        firstLine: null,
        psalmVersionTunes: [],
      },
    ],
    verses: makeVerses(30),
    dailyReadings,
  } as unknown as PsalmDetail
}

/** Models a normal single-version psalm: structured lyrics cover every verse. */
function makeNormalPsalm(): PsalmDetail {
  return {
    id: 23,
    book: null,
    author: null,
    bibleTitle: null,
    haddingtonIntro: null,
    sectionHeadings: [],
    psalmTopics: [],
    messianicPsalms: [],
    psalmVersions: [
      {
        id: 1,
        airtableId: null,
        psalmId: 23,
        psalterNumber: '23',
        lyricsImportedRaw: null,
        lyricsStructured: makeStructured(1, 30),
        meter: 'CM',
        versionLabel: null,
        firstLine: null,
        psalmVersionTunes: [],
      },
    ],
    verses: makeVerses(30),
    dailyReadings,
  } as unknown as PsalmDetail
}

// Both the mobile and desktop layouts render their own <Tabs> instance with a
// trigger of the same accessible name. Clicking only the FIRST (mobile) match
// mounts just that instance's panel -- Base UI Tabs.Panel unmounts inactive
// panels by default (keepMounted=false), so the desktop instance (still on
// "overview") contributes nothing to the DOM we assert against.
function clickTab(name: string) {
  const triggers = screen.getAllByRole('tab', { name })
  fireEvent.click(triggers[0])
}

describe('PsalmTabs activeVerseRange scoping (opt-in)', () => {
  it('Parallel tab shows only in-range verse rows when activeVerseRange is set', () => {
    render(
      <PsalmTabs
        psalm={makeSubDivisionPsalm()}
        primaryTune={null}
        navesSlugMap={{}}
        topicSlugMap={{}}
        activeVerseRange={{ start: 17, end: 24 }}
      />,
    )
    clickTab('Parallel')
    const rows = screen.getAllByTestId('parallel-row')
    expect(rows.length).toBe(8)
    expect(screen.getByText('KJV verse 17')).toBeTruthy()
    expect(screen.getByText('KJV verse 24')).toBeTruthy()
    expect(screen.queryByText('KJV verse 16')).toBeNull()
    expect(screen.queryByText('KJV verse 25')).toBeNull()
  })

  it('365 Days tab shows only overlapping entries plus the unscoped entry when activeVerseRange is set', () => {
    render(
      <PsalmTabs
        psalm={makeSubDivisionPsalm()}
        primaryTune={null}
        navesSlugMap={{}}
        topicSlugMap={{}}
        activeVerseRange={{ start: 17, end: 24 }}
      />,
    )
    clickTab('365 Days')
    // entry 1 (17-24) overlaps; entry 3 (null/null) is unscoped -- both render.
    // entry 2 (1-8) does not overlap -- excluded.
    expect(screen.getAllByTestId('days-entry').length).toBe(2)
  })

  it('Cross-References lists only verses inside the active range', () => {
    render(
      <PsalmTabs
        psalm={makeSubDivisionPsalm()}
        primaryTune={null}
        navesSlugMap={{}}
        topicSlugMap={{}}
        activeVerseRange={{ start: 17, end: 24 }}
      />,
    )
    clickTab('Study')
    fireEvent.click(screen.getByText('Cross-References'))
    expect(screen.getByTestId('study-xref-verse-20')).toBeTruthy()
    expect(screen.queryByTestId('study-xref-verse-5')).toBeNull()
  })

  it('renders every verse/entry/xref unfiltered when activeVerseRange is absent (regression guard)', () => {
    render(
      <PsalmTabs psalm={makeNormalPsalm()} primaryTune={null} navesSlugMap={{}} topicSlugMap={{}} />,
    )

    clickTab('Parallel')
    expect(screen.getAllByTestId('parallel-row').length).toBe(30)

    clickTab('365 Days')
    expect(screen.getAllByTestId('days-entry').length).toBe(3)

    clickTab('Study')
    fireEvent.click(screen.getByText('Cross-References'))
    expect(screen.getByTestId('study-xref-verse-20')).toBeTruthy()
    expect(screen.getByTestId('study-xref-verse-5')).toBeTruthy()
  })

  it('renders every verse/entry unfiltered when activeVerseRange is explicitly null', () => {
    render(
      <PsalmTabs
        psalm={makeNormalPsalm()}
        primaryTune={null}
        navesSlugMap={{}}
        topicSlugMap={{}}
        activeVerseRange={null}
      />,
    )
    clickTab('Parallel')
    expect(screen.getAllByTestId('parallel-row').length).toBe(30)
  })
})
