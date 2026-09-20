// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { DesktopOptimisedBanner } from './DesktopOptimisedBanner'

const STORAGE_KEY = 'psalter.desktopBannerDismissed'

interface MediaStub {
  matches: boolean
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

describe('DesktopOptimisedBanner (quick task 260817-p17)', () => {
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
})
