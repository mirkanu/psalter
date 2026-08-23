// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { DaysContent, MessianicContent } from './PsalmTabs'
import type { PsalmDetail } from '@/db/queries/psalms'

afterEach(() => {
  cleanup()
})

describe('DaysContent View All link', () => {
  it('renders the /daily link alongside populated entries', () => {
    const entries = [
      {
        id: 1,
        dayNumber: 1,
        readingDate: null,
        startingVerse: null,
        endingVerse: null,
        notes: null,
      },
    ] as unknown as PsalmDetail['dailyReadings']
    render(<DaysContent entries={entries} psalmId={23} />)
    expect(screen.getByTestId('days-entries')).toBeTruthy()
    expect(screen.getByTestId('days-view-all').getAttribute('href')).toBe('/daily')
  })

  it('renders the /daily link alongside the empty-state message', () => {
    render(<DaysContent entries={[]} psalmId={23} />)
    expect(screen.getByText('No reading plan entry for this psalm.')).toBeTruthy()
    expect(screen.getByTestId('days-view-all').getAttribute('href')).toBe('/daily')
  })
})

describe('MessianicContent View All link', () => {
  it('renders the /explore?tab=messianic link alongside a populated record', () => {
    const messianic = {
      classification: 'Type',
      ntVerification: 'Matt 1:1',
      messianicVerses: 'v.1-2',
    } as unknown as PsalmDetail['messianicPsalms'][number]
    render(<MessianicContent messianic={messianic} />)
    expect(screen.getByText('Type')).toBeTruthy()
    expect(screen.getByTestId('messianic-view-all').getAttribute('href')).toBe(
      '/explore?tab=messianic',
    )
  })

  it('renders the /explore?tab=messianic link alongside the empty-state message', () => {
    render(<MessianicContent messianic={null} />)
    expect(screen.getByText('No messianic data recorded for this psalm.')).toBeTruthy()
    expect(screen.getByTestId('messianic-view-all').getAttribute('href')).toBe(
      '/explore?tab=messianic',
    )
  })
})
