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
    isApproved: true,
    staffPages: [],
    solfegePages: [],
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

  it('always renders TuneScoreSection in the Notation tab, regardless of abc/image availability', () => {
    // 2026-08-16 (Phase 16 R3 sign-off round): TunePageTabs no longer branches
    // on hasAbc/hasImages/hasAudio — a single NotationRenderer instance
    // (via TuneScoreSection, driven by tunePageMode) now owns every case:
    // live abcjs, JPG fallback (staff-split/solfege-split), and the final
    // "not available" message. TuneDetailClient (the old branch) was removed
    // because it duplicated the audio player that now lives above the tabs.
    // TuneScoreSection is mocked here, so this only proves TunePageTabs always
    // renders it — the fallback behaviour itself lives in NotationRenderer and
    // was verified live via Playwright screenshots (no abcjs unit coverage
    // exists for that 1700-line component yet).
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(<TunePageTabs {...baseProps({ staffPages: [], solfegePages: [] })} />)
    expect(screen.getByTestId('tune-score-section')).toBeTruthy()
  })

  // Issue #15: hide notation on /tunes/[slug] for tunes that are not Approved.
  it('hides the Notation tab when isApproved is false', () => {
    render(<TunePageTabs {...baseProps({ isApproved: false })} />)
    expect(screen.queryByRole('tab', { name: 'Notation' })).toBeNull()
    expect(screen.queryByTestId('tune-score-section')).toBeNull()
  })

  it('ignores ?tab=notation when isApproved is false (defaults to Details)', () => {
    useSearchParamsMock.mockReturnValue(new URLSearchParams('tab=notation'))
    render(<TunePageTabs {...baseProps({ isApproved: false })} />)
    const detailsTab = screen.getByRole('tab', { name: 'Details' })
    expect(detailsTab.getAttribute('data-active')).not.toBeNull()
    expect(screen.queryByTestId('tune-score-section')).toBeNull()
  })
})
