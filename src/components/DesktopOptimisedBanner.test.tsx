// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { DesktopOptimisedBanner } from './DesktopOptimisedBanner'
import { TourProvider, useTour } from './TourProvider'

const STORAGE_KEY = 'psalter.desktopBannerDismissed'

interface MediaStub {
  matches: boolean
  media: string
  onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => unknown) | null
  addEventListener: (type: string, listener: EventListener) => void
  removeEventListener: (type: string, listener: EventListener) => void
  addListener: (cb: (ev: MediaQueryListEvent) => void) => void
  removeListener: (cb: (ev: MediaQueryListEvent) => void) => void
  dispatchEvent: (ev: Event) => boolean
}

/**
 * jsdom never carries a real matchMedia. Provide a query-aware stub so each
 * test can flag specific queries as matching (e.g. `(min-width: 768px)` for
 * desktop, or `(display-mode: standalone)` for home-screen PWA) without
 * leaking that into unrelated queries.
 */
function stubMatchMedia(rules: Array<{ query: string; matches: boolean }>): void {
  const map = new Map(rules.map((r) => [r.query, r.matches] as const))
  window.matchMedia = ((query: string): MediaStub => ({
    matches: map.get(query) ?? false,
    media: query,
    onchange: null,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

beforeEach(() => {
  localStorage.clear()
  // jsdom defaults to an empty UA (no platform string), so isPhoneDevice()
  // returns false in every test without further stubbing. Simulate "phone"
  // environments on the tests that exercise the suppression paths by
  // replacing navigator.userAgent.
  Object.defineProperty(navigator, 'userAgent', {
    value:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    configurable: true,
  })
  // jsdom does not define navigator.standalone; ensure the "PWA" test path is
  // detectable when explicitly requested.
  Object.defineProperty(navigator, 'standalone', {
    value: undefined,
    configurable: true,
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  // @ts-expect-error test cleanup — jsdom leaves matchMedia undefined by default
  delete window.matchMedia
  Object.defineProperty(navigator, 'userAgent', {
    value: '',
    configurable: true,
  })
})

describe('DesktopOptimisedBanner (quick task 260817-p17; Phase 21 D-07 hides during tour via TourProvider)', () => {
  it('renders nothing on a mobile viewport (matchMedia min-width:768px -> false)', async () => {
    stubMatchMedia([{ query: '(min-width: 768px)', matches: false }])
    const { container } = render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  it('renders the banner text and a Dismiss control on desktop with no localStorage flag', async () => {
    // Empty UA → not a phone → desktop browser tab; standalone unknown → false.
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(screen.getByText('This website is optimised for use on phones.')).toBeTruthy()
    })
    expect(screen.getByLabelText('Dismiss')).toBeTruthy()
  })

  it('renders nothing on desktop when the dismissal flag is already set', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    localStorage.setItem(STORAGE_KEY, '1')
    const { container } = render(<DesktopOptimisedBanner />)
    // Give effects a tick to run, then assert it never appears.
    await new Promise((r) => setTimeout(r, 20))
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('clicking dismiss removes the banner and writes the flag to localStorage', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    render(<DesktopOptimisedBanner />)
    const dismissBtn = await screen.findByLabelText('Dismiss')
    fireEvent.click(dismissBtn)
    expect(screen.queryByText('This website is optimised for use on phones.')).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
  })

  it('does not crash when localStorage access throws (private mode)', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => render(<DesktopOptimisedBanner />)).not.toThrow()
  })

  // Issue #14: the banner must not appear on phone-class devices even if
  // their viewport is ≥768px (iPhone landscape / Android Chrome split-screen
  // / iPadOS "request desktop website" mode). UA is patched in beforeEach.
  it('hides on a phone UA even when the viewport is desktop-width', async () => {
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    const { container } = render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  it('hides when running as an installed home-screen PWA', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: true },
    ])
    const { container } = render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  // Phase 21 (D-07): DesktopOptimisedBanner reads useTour().isOpen from the
  // TourProvider context. While the tour is open the banner hides even on
  // desktop without a dismissal flag — the spotlight cutout would otherwise
  // be occluded by the phone-optimised banner.
  it('Phase 21 D-07: hides during an active tour even when the dismissal flag is unset', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    const tourRef = { current: null as ReturnType<typeof useTour> | null }
    function CapturingSibling() {
      const api = useTour()
      tourRef.current = api
      return null
    }
    const { container } = render(
      <TourProvider>
        <CapturingSibling />
        <DesktopOptimisedBanner />
      </TourProvider>,
    )
    // Initial render — tour closed, banner visible.
    await waitFor(() => {
      expect(screen.getByText('This website is optimised for use on phones.')).toBeTruthy()
    })
    expect(tourRef.current).not.toBeNull()
    // Open the tour — banner should vanish.
    tourRef.current!.show()
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  // Phase 21 (D-07): once tour.dismiss() runs, the banner pops back into
  // view — even if no permanent localStorage flag has been written — because
  // isOpen returns to false and the dismissed-check no longer short-circuits.
  it('Phase 21 D-07: re-appears after the tour closes (when not permanently dismissed)', async () => {
    Object.defineProperty(navigator, 'userAgent', { value: '', configurable: true })
    stubMatchMedia([
      { query: '(min-width: 768px)', matches: true },
      { query: '(display-mode: standalone)', matches: false },
    ])
    const tourRef = { current: null as ReturnType<typeof useTour> | null }
    function CapturingSibling() {
      const api = useTour()
      tourRef.current = api
      return null
    }
    const { container } = render(
      <TourProvider>
        <CapturingSibling />
        <DesktopOptimisedBanner />
      </TourProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText('This website is optimised for use on phones.')).toBeTruthy()
    })
    expect(tourRef.current).not.toBeNull()
    tourRef.current!.show()
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
    tourRef.current!.dismiss()
    await waitFor(() => {
      expect(screen.getByText('This website is optimised for use on phones.')).toBeTruthy()
    })
  })
})
