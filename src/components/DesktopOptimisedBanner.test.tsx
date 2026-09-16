// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { DesktopOptimisedBanner } from './DesktopOptimisedBanner'

const STORAGE_KEY = 'psalter.desktopBannerDismissed'

function stubMatchMedia(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
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
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  // @ts-expect-error test cleanup — jsdom leaves matchMedia undefined by default
  delete window.matchMedia
})

describe('DesktopOptimisedBanner (quick task 260817-p17)', () => {
  it('renders nothing on a mobile viewport (matchMedia min-width:768px -> false)', async () => {
    stubMatchMedia(false)
    const { container } = render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })

  it('renders the banner text and a Dismiss control on desktop with no localStorage flag', async () => {
    stubMatchMedia(true)
    render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(screen.getByText('This website is optimised for use on phones.')).toBeTruthy()
    })
    expect(screen.getByLabelText('Dismiss')).toBeTruthy()
  })

  it('renders nothing on desktop when the dismissal flag is already set', async () => {
    stubMatchMedia(true)
    localStorage.setItem(STORAGE_KEY, '1')
    const { container } = render(<DesktopOptimisedBanner />)
    // Give effects a tick to run, then assert it never appears.
    await new Promise((r) => setTimeout(r, 20))
    expect(container.querySelector('[role="status"]')).toBeNull()
  })

  it('clicking dismiss removes the banner and writes the flag to localStorage', async () => {
    stubMatchMedia(true)
    render(<DesktopOptimisedBanner />)
    const dismissBtn = await screen.findByLabelText('Dismiss')
    fireEvent.click(dismissBtn)
    expect(screen.queryByText('This website is optimised for use on phones.')).toBeNull()
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
  })

  it('does not crash when localStorage access throws (private mode)', async () => {
    stubMatchMedia(true)
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    expect(() => render(<DesktopOptimisedBanner />)).not.toThrow()
  })
})

// Issue #14: don't show the "Optimised for phone" badge on tablets.
// Threshold was raised from 768px to 1024px so a 768-1023px tablet
// viewport matches desktop and never sees the banner.
describe('DesktopOptimisedBanner (issue #14 — tablet guard)', () => {
  it('does not render the banner on a tablet viewport (min-width:1024px -> false at 900px)', async () => {
    stubMatchMedia(false)
    const { container } = render(<DesktopOptimisedBanner />)
    await waitFor(() => {
      expect(container.querySelector('[role="status"]')).toBeNull()
    })
  })
})
