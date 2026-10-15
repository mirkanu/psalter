// @vitest-environment jsdom
// Phase 20-02 (Task 1) — NotationRenderer Legacy view + GearPopover 5th radio.
//
// The full SingingView component is heavy (dependencies on useRouter,
// useSearchParams, useMediaQuery, sonner, etc.) and runs many effects on mount
// — most test value lives in the smaller, behaviour-focused contracts below:
//   - The 'legacy' view-mode literal is exposed in NotationRenderer's
//     data-view-mode root attribute + has the dedicated [data-legacy-embeds]
//     child container.
//   - The existing 'staff-split' view-mode still produces the expected root
//     attribute (no regression in the union extension).
//   - GearPopover renders the 5th "Legacy" radio with the Library icon, and
//     aria-checked reflects the current viewMode.
//
// NotationRenderer renders heavy children (AbcPlayer / scanned pages). The
// tests stub the abc/soundcloud inputs and use the LyrIxSurface the component
// exposes via the embedded StanzaList to keep the render focused.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { NotationRenderer } from '@/components/notation/NotationRenderer'
import { GearPopover } from '@/components/singing/GearPopover'
import type { ViewMode } from '@/components/notation/NotationRenderer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}))

afterEach(() => {
  cleanup()
})

// Minimal fake structured-lyrics payload — StanzaList reads verse numbers and
// lines. We only need enough structure for the legacy / staff-split branches
// to render without throwing.
function fakeLyricsStructured(): import('@/lib/lyrics-structured').StructuredLyrics {
  return {
    verses: [
      {
        number: 1,
        type: 'verse',
        lines: [{ text: 'The Lord is my shepherd', syllables: ['The', 'Lord', 'is', 'my', 'shep-herd'] }],
      },
    ],
  } as unknown as import('@/lib/lyrics-structured').StructuredLyrics
}

const baseRendererProps = {
  showLyrics: true,
  lyrics: 'The Lord is my shepherd',
  lyricsStructured: fakeLyricsStructured(),
  stanzaMeter: 'CM',
  meter: 'CM',
  abc: '',
  tuneName: 'Crimond',
  staffJpgUrl: null,
  solfegeJpgUrl: null,
  soundcloudUrl: 'https://soundcloud.com/example/recording',
  youtubeUrl: null,
} as const

describe('NotationRenderer — Phase 20-02 Legacy view (Task 1)', () => {
  it('renders a root element with data-view-mode="legacy" and a [data-legacy-embeds] child when viewMode="legacy"', () => {
    const { container } = render(
      <NotationRenderer
        {...baseRendererProps}
        viewMode="legacy"
      />,
    )
    const root = container.querySelector('[data-notation-renderer][data-view-mode="legacy"]')
    expect(root).not.toBeNull()
    const embeds = container.querySelector('[data-legacy-embeds]')
    expect(embeds).not.toBeNull()
    // SoundCloud iframe is the first embed (always-on per D-03); the MIDI
    // placeholder is omitted because the test abc is empty.
    const iframe = embeds!.querySelector('iframe[data-legacy-soundcloud]')
    expect(iframe).not.toBeNull()
  })

  it('still renders correctly for the existing primary view-mode "staff-split" (no regression)', () => {
    const { container } = render(
      <NotationRenderer
        {...baseRendererProps}
        viewMode="staff-split"
      />,
    )
    const root = container.querySelector('[data-notation-renderer][data-view-mode="staff-split"]')
    expect(root).not.toBeNull()
    // Legacy branch must NOT fire in the primary view
    expect(container.querySelector('[data-legacy-embeds]')).toBeNull()
  })
})

function renderGearPopover(overrides: Partial<React.ComponentProps<typeof GearPopover>> = {}) {
  const defaultProps: React.ComponentProps<typeof GearPopover> = {
    open: true,
    onOpenChange: vi.fn(),
    viewMode: 'staff-split' as ViewMode,
    onViewModeChange: vi.fn(),
    studyHref: '/study',
    onRestartTour: vi.fn(),
    showLyricsOption: true,
    staffAvailable: true,
    solfegeInlineAvailable: false,
    solfegeSplitAvailable: true,
    staffInlineApproved: true,
    hasActiveTune: true,
    onRequestTuneSelection: vi.fn(),
    originalScanAvailable: true,
    showOriginal: false,
    onShowOriginalChange: vi.fn(),
  }
  return render(<GearPopover {...defaultProps} {...overrides} />)
}

describe('GearPopover — Phase 20-02 Legacy radio (Task 1)', () => {
  it('renders the Legacy radio with aria-checked="true" when viewMode="legacy"', () => {
    renderGearPopover({ viewMode: 'legacy' })
    const legacyBtn = screen.getByRole('radio', { name: 'Legacy' })
    expect(legacyBtn).not.toBeNull()
    expect(legacyBtn.getAttribute('aria-checked')).toBe('true')
    expect(legacyBtn.getAttribute('data-view-option')).toBe('legacy')
  })

  it('Legacy radio has aria-checked="false" when viewMode is non-legacy', () => {
    renderGearPopover({ viewMode: 'staff-split' })
    const legacyBtn = screen.getByRole('radio', { name: 'Legacy' })
    expect(legacyBtn.getAttribute('aria-checked')).toBe('false')
  })
})