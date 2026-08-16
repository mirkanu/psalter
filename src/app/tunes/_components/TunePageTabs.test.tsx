// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'

const { useSearchParamsMock, routerReplaceMock, usePathnameMock } = vi.hoisted(() => ({
  useSearchParamsMock: vi.fn(() => new URLSearchParams()),
  routerReplaceMock: vi.fn(),
  usePathnameMock: vi.fn(() => '/tunes/darwall'),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
  usePathname: usePathnameMock,
  useSearchParams: useSearchParamsMock,
}))

vi.mock('@/components/TuneScoreSection', () => ({
  TuneScoreSection: () => <div data-testid="tune-score-section" />,
}))
vi.mock('@/components/TuneMiniBarSection', () => ({
  TuneMiniBarSection: () => <div data-testid="tune-mini-bar-section" />,
}))
vi.mock('@/components/TuneDetailClient', () => ({
  TuneDetailClient: () => <div data-testid="tune-detail-client" />,
}))

import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { TunePageTabs, type TunePageTabsProps } from './TunePageTabs'
import type { CoreNotationProps } from '@/lib/notation-renderer-props'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  useSearchParamsMock.mockReturnValue(new URLSearchParams())
})

const baseNotationProps = {} as CoreNotationProps

function baseProps(overrides: Partial<TunePageTabsProps> = {}): TunePageTabsProps {
  return {
    tuneName: 'Darwall',
    tuneId: 57,
    meter: 'CM',
    moods: ['Joyful'],
    numberIn1979RpPsalter: 148,
    numInPrcaPsalter: null,
    hasFamousHymn: false,
    famousHymn: null,
    precentingComment: null,
    notationProps: baseNotationProps,
    staffPages: [],
    solfegePages: [],
    bestAbc: 'X:1\nK:C\nCDEF|',
    soundcloudUrl: null,
    youtubeUrl: null,
    ...overrides,
  }
}

describe('TunePageTabs', () => {
  it('renders both tab triggers with labels Details and Notation', () => {
    render(<TunePageTabs {...baseProps()} />)
    expect(screen.getByRole('tab', { name: 'Details' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Notation' })).toBeTruthy()
  })

  it('defaults to the Details tab when ?tab= is absent', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams())
    render(<TunePageTabs {...baseProps()} />)
    const detailsTab = screen.getByRole('tab', { name: 'Details' })
    expect(detailsTab.getAttribute('data-active')).not.toBeNull()
  })

  it('activates the Notation tab when ?tab=notation is present', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(<TunePageTabs {...baseProps()} />)
    const notationTab = screen.getByRole('tab', { name: 'Notation' })
    expect(notationTab.getAttribute('data-active')).not.toBeNull()
    expect(screen.getByTestId('tune-score-section')).toBeTruthy()
  })

  it('falls back to Details for an unknown ?tab= value (allowlist, T-16-05)', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=foo'))
    render(<TunePageTabs {...baseProps()} />)
    const detailsTab = screen.getByRole('tab', { name: 'Details' })
    expect(detailsTab.getAttribute('data-active')).not.toBeNull()
  })

  it('clicking the Notation trigger calls router.replace with ?tab=notation and scroll:false', () => {
    render(<TunePageTabs {...baseProps()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Notation' }))
    expect(routerReplaceMock).toHaveBeenCalledWith('/tunes/darwall?tab=notation', { scroll: false })
  })

  it('clicking the Details trigger calls router.replace with ?tab=details and scroll:false', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(<TunePageTabs {...baseProps()} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))
    expect(routerReplaceMock).toHaveBeenCalledWith('/tunes/darwall?tab=details', { scroll: false })
  })

  it('renders metadata fields (Mood) in the Details tab', () => {
    // Phase 16 R3: "Sing this tune" (Recommended Psalms + Other Psalms) was
    // moved OUT of the Details tab — it's now rendered below the tabs in the
    // /tunes/[slug] page via <PsalmsByTuneSection>. TunePageTabs only owns the
    // Details metadata grid + the Notation tab.
    render(<TunePageTabs {...baseProps()} />)
    expect(screen.getByText('Mood')).toBeTruthy()
  })

  it('renders TuneScoreSection and TuneMiniBarSection in the Notation tab when bestAbc is non-null', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(<TunePageTabs {...baseProps({ bestAbc: 'X:1\nK:C\nCDEF|' })} />)
    expect(screen.getByTestId('tune-score-section')).toBeTruthy()
    expect(screen.getByTestId('tune-mini-bar-section')).toBeTruthy()
  })

  it('falls back to TuneDetailClient (JPG-only) when bestAbc is null but images exist', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(
      <TunePageTabs
        {...baseProps({ bestAbc: null, staffPages: ['/img/staff-1.jpg'] })}
      />,
    )
    expect(screen.queryByTestId('tune-score-section')).toBeNull()
    expect(screen.getByTestId('tune-detail-client')).toBeTruthy()
  })

  it('shows a "Notation not available" placeholder when there is no ABC, no images, and no audio', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(
      <TunePageTabs
        {...baseProps({ bestAbc: null, staffPages: [], solfegePages: [], soundcloudUrl: null, youtubeUrl: null })}
      />,
    )
    expect(screen.getByText('Notation not available for this tune.')).toBeTruthy()
  })
})
