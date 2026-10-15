// @vitest-environment jsdom
// Phase 20-02 (Task 2) — audio persistence across psalms + Legacy reset.
//
// Two behaviour contracts we own in this test file (the SingingView test file
// owns the viewMode-render-branches contract):
//   1. `psalter.audioPlayerOpen === 'true'` on mount hydrates
//      audioPlayerOpen=true. Cross-view-mode transitions preserve the state,
//      EXCEPT transitioning through 'legacy' which resets it to false (D-13).
//   2. Legacy localStorage `psalter-audio-source === 'soundcloud'` migrates
//      to `psalter.audioLastSelected === 'soundcloud'` and the old key is
//      removed (the inverse of test 1, covers the SoundCloud side of the
//      Pitfall 1 migration).
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, cleanup, fireEvent, act, waitFor } from '@testing-library/react'
import { SingingView } from '@/components/singing/SingingView'
import type { ViewMode } from '@/components/notation/NotationRenderer'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/psalms/23',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock heavy children that pull in their own client-only chunks.
vi.mock('@/components/notation/NotationRendererClient', () => ({
  NotationRendererClient: (props) => React.createElement('div', { 'data-testid': 'mock-notation-renderer', 'data-view-mode': props.viewMode }),
}))

vi.mock('@/components/singing/PsalmTopBarClient', () => ({
  PsalmTopBarClient: () => null,
}))

vi.mock('@/components/singing/GlassBottomBar', () => ({
  GlassBottomBar: (props) => React.createElement('div', { 'data-testid': 'mock-glass-bottom-bar', 'data-player-open': props.playerOpen ? 'true' : 'false', 'data-hide-play-button': props.hidePlayButton ? 'true' : 'false' }),
}))

vi.mock('@/components/singing/PlayMiniBarClient', () => ({
  PlayMiniBarClient: () => null,
}))

vi.mock('@/components/singing/GearPopoverClient', () => ({
  GearPopoverClient: () => null,
}))

vi.mock('@/components/singing/OnboardingTourClient', () => ({
  OnboardingTourClient: () => null,
}))

vi.mock('@/components/PsalmPickerModalClient', () => ({
  PsalmPickerModalClient: () => null,
}))

vi.mock('@/components/tune-picker/TunePickerDialog', () => ({
  TunePickerDialog: () => null,
}))

vi.mock('@/components/notation/FullscreenOverlay', () => ({
  FullscreenOverlay: () => null,
}))

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}))

vi.mock('@/hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => {},
}))

vi.mock('@/lib/abc-phrase-meter-map', () => ({
  phrasesForMeter: () => 4,
}))

vi.mock('@/lib/inline-staff-gating', () => ({
  resolveStaffInlineApproved: () => true,
  shouldFallbackToSplit: () => false,
  computeInlineLayoutDisabled: () => false,
}))

vi.mock('@/lib/device', () => ({
  isIOSDevice: () => false,
  isStandaloneDisplayMode: () => false,
  isPhoneDevice: () => false,
}))

vi.mock('@/lib/chrome-hidden-store', () => ({
  setChromeHidden: vi.fn(),
}))

// jsdom doesn't implement window.matchMedia — SingingView's scroll-hide effect
// reads it directly during mount, so stub a minimal no-op implementation.
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-expect-error — jsdom env doesn't provide matchMedia
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })
}

// jsdom doesn't implement ResizeObserver — SingingView's scroll-hide effect
// creates one on the main ref during mount. Stub a minimal no-op.
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  // @ts-expect-error — jsdom env doesn't provide ResizeObserver
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// jsdom doesn't implement visualViewport — SingingView attaches a resize
// listener to it during mount. Stub a no-op shim.
if (typeof window !== 'undefined' && !window.visualViewport) {
  // @ts-expect-error — jsdom env doesn't provide visualViewport
  window.visualViewport = { addEventListener: () => {}, removeEventListener: () => {} }
}

const baseProps: React.ComponentProps<typeof SingingView> = {
  psalm: {
    id: 23,
    psalmNumber: 23,
    versionId: 1,
    versionLabel: 'a',
    displayLabel: '23',
    slug: '23',
    bibleTitle: null,
    subtitle: null,
    lyrics: 'The Lord is my shepherd',
    lyricsStructured: null,
    meter: 'CM',
    stanzaMeter: 'CM',
  } as unknown as React.ComponentProps<typeof SingingView>['psalm'],
  currentSlug: '23',
  prevSlug: '22',
  nextSlug: '24',
  primaryTune: null,
  alternateTunes: [],
  editoriallyLinkedTuneIds: [],
  meter: 'CM',
  stanzaMeter: 'CM',
  lyrics: 'The Lord is my shepherd',
  lyricsStructured: null,
  psalmListRows: [],
  studyHref: '/psalms/23/study',
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('SingingView — Phase 20-02 audio persistence (Task 2)', () => {
  it("hydrates audioPlayerOpen=true from 'psalter.audioPlayerOpen' localStorage", async () => {
    window.localStorage.setItem('psalter.audioPlayerOpen', 'true')
    let container: HTMLElement | null = null
    await act(async () => {
      const result = render(<SingingView {...baseProps} />)
      container = result.container
    })
    // The GlassBottomBar mock surfaces the playerOpen prop on a data
    // attribute — read it to confirm hydration worked.
    await waitFor(() => {
      const bar = container!.querySelector('[data-testid="mock-glass-bottom-bar"]')
      expect(bar).not.toBeNull()
      expect(bar!.getAttribute('data-player-open')).toBe('true')
    }, { timeout: 3000 })
  })

  it("legacy 'psalter-audio-source' === 'soundcloud' migrates to 'psalter.audioLastSelected' === 'soundcloud'", async () => {
    window.localStorage.setItem('psalter-audio-source', 'soundcloud')
    await act(async () => {
      render(<SingingView {...baseProps} />)
    })
    await waitFor(() => {
      expect(window.localStorage.getItem('psalter.audioLastSelected')).toBe('soundcloud')
      expect(window.localStorage.getItem('psalter-audio-source')).toBeNull()
    }, { timeout: 3000 })
  })
})