// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/psalms/23',
  useSearchParams: () => new URLSearchParams(),
}))

import { render, cleanup } from '@testing-library/react'
import { TuneSwitcherSheet } from './TuneSwitcherSheet'
import type { TuneOption } from './types'

afterEach(() => {
  cleanup()
})

function makeTune(id: number, name: string, weightedHistoricalFrequency: number): TuneOption {
  return {
    id,
    name,
    slug: name.toLowerCase(),
    meter: 'CM',
    abcNotation: null,
    abcSatb: null,
    scoreJpgUrl: null,
    solfegeJpgUrl: null,
    soundcloudUrl: null,
    youtubeUrl: null,
    doubleLength: false,
    solfegeOcrText: null,
    melismaPositions: null,
    phraseShapeOverride: null,
    staffPages: [],
    solfegePages: [],
    melismaStatus: null,
    weightedHistoricalFrequency,
    historicalUsageCount: 0,
  }
}

const tunes = [
  makeTune(1, 'Alpha', 0.01),
  makeTune(2, 'Bravo', 0.3),
  makeTune(3, 'Zulu', 0),
  makeTune(7, 'Mike', 0),
  makeTune(9, 'Alpha2', 0.5),
]
const tuneTiers = { backupTuneIds: [7], historicalTuneIds: [3, 9] }

// Sheet content renders via a Radix Portal into document.body, not into render()'s container.
describe('TuneSwitcherSheet', () => {
  it('renders three tier headings in Backup → Historical → Other order', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    const headings = Array.from(document.body.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings.map((h) => h.textContent)).toEqual([
      'Backup tune',
      'Historically sung for this psalm',
      'Other tunes',
    ])
  })

  it('rows appear in sortTunesByTier order', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    const rows = Array.from(document.body.querySelectorAll('[data-tune-slug]'))
    expect(rows.map((r) => r.getAttribute('data-tune-slug'))).toEqual(['7', '9', '3', '2', '1'])
  })

  it('the current tune is highlighted inside its own tier, not hoisted to the top', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    const current = document.body.querySelector('[data-tune-slug="2"]')
    expect(current?.getAttribute('aria-current')).toBe('true')
    const rows = Array.from(document.body.querySelectorAll('[data-tune-slug]'))
    expect(rows[0].getAttribute('data-tune-slug')).not.toBe('2')
  })

  it('exactly one row is marked current', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    const currentRows = document.body.querySelectorAll('[aria-current="true"]')
    expect(currentRows.length).toBe(1)
  })

  it('with no tier data every tune falls under a single Other heading', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={undefined}
        meterLabel="CM"
      />,
    )
    const headings = Array.from(document.body.querySelectorAll('[data-tune-tier-heading]'))
    expect(headings.length).toBe(1)
    expect(headings[0].textContent).toBe('Other tunes')
  })

  it('empty tune list shows the empty message', () => {
    const { getByText } = render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={[]}
        currentTuneId={null}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    expect(getByText('No tunes available for this psalm.')).toBeTruthy()
    expect(document.body.querySelectorAll('[data-tune-slug]').length).toBe(0)
  })

  it('the Current badge still renders for the active tune', () => {
    render(
      <TuneSwitcherSheet
        open={true}
        onOpenChange={vi.fn()}
        tunes={tunes}
        currentTuneId={2}
        tuneTiers={tuneTiers}
        meterLabel="CM"
      />,
    )
    const current = document.body.querySelector('[data-tune-slug="2"]')
    expect(current?.textContent).toContain('Current')
  })
})
