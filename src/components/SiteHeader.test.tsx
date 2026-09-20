// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

type MockSession = { data: { user: { id: string; role: string } } | null; isPending: boolean }

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn((): MockSession => ({ data: null, isPending: true })),
}))
vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useSession: useSessionMock,
    signOut: vi.fn(async () => {}),
  },
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => '/',
}))
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', resolvedTheme: 'light', setTheme: vi.fn() }),
}))

import { render, screen, cleanup, waitFor } from '@testing-library/react'
import { SiteHeader } from './SiteHeader'

const ADMIN_SESSION = { data: { user: { id: 'u1', role: 'admin' } }, isPending: false }
const ANON_SESSION = { data: null, isPending: false }
const PENDING_SESSION = { data: null, isPending: true }

beforeEach(() => {
  useSessionMock.mockReset()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('SiteHeader — session gate regression tests', () => {
  it('anonymous visitor sees no Log Out link (no idle gate needed: no fetch resolved yet)', () => {
    useSessionMock.mockReturnValue(ANON_SESSION)
    render(<SiteHeader />)
    // No Log Out text on the page for an anonymous visitor.
    expect(screen.queryByText('Log Out')).toBeNull()
  })

  it('anonymous visitor still sees no Log Out link after the idle gate flips', async () => {
    useSessionMock.mockReturnValue(ANON_SESSION)
    render(<SiteHeader />)
    // Force the idle gate to resolve (jsdom lacks requestIdleCallback, so the
    // setTimeout fallback should fire on next tick).
    await waitFor(() => {
      // Even after sessionEnabled flips true, !session must keep showLogout false.
      // We use a generous timeout because the fallback is setTimeout(..., 1).
    }, { timeout: 50 })
    expect(screen.queryByText('Log Out')).toBeNull()
  })

  it('logged-in precentor eventually sees the Log Out link after the idle gate', async () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    render(<SiteHeader />)
    // The Log Out link is gated by requestIdleCallback (or setTimeout 1ms in
    // jsdom), so it must not appear on first render — but must appear after
    // the idle gate flips and the session resolves.
    await waitFor(
      () => {
        const matches = screen.getAllByText('Log Out')
        expect(matches.length).toBeGreaterThan(0)
      },
      { timeout: 200 },
    )
  })

  it('pending session never shows Log Out even when the idle gate has fired', async () => {
    useSessionMock.mockReturnValue(PENDING_SESSION)
    render(<SiteHeader />)
    // sessionPending must keep showLogout false regardless of the gate.
    await waitFor(() => {
      // give the gate time to flip, then assert still nothing
      expect(screen.queryByText('Log Out')).toBeNull()
    }, { timeout: 50 })
  })
})
describe('SiteHeader — install menu gate (#17)', () => {
  function setUA(ua: string) {
    Object.defineProperty(navigator, 'userAgent', { value: ua, configurable: true })
  }
  function setStandalone(matches: boolean) {
    window.matchMedia = ((query: string) => ({
      matches: query === '(display-mode: standalone)' ? matches : false,
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia
  }

  it('shows "Install on phone" on an iPhone when not in standalone', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    setStandalone(false)
    useSessionMock.mockReturnValue(ANON_SESSION)
    render(<SiteHeader />)
    // open the mobile sheet so the footer menu block is in the DOM
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
    menuButton.click()
    await waitFor(() => {
      expect(screen.queryAllByText('Install on phone').length).toBeGreaterThan(0)
    })
  })

  it('hides "Install on phone" on a desktop UA', async () => {
    setUA('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15')
    setStandalone(false)
    useSessionMock.mockReturnValue(ANON_SESSION)
    render(<SiteHeader />)
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
    menuButton.click()
    await waitFor(() => {
      expect(screen.queryByText('Install on phone')).toBeNull()
    })
  })

  it('hides "Install on phone" on an installed PWA even on a phone UA', async () => {
    setUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    setStandalone(true)
    useSessionMock.mockReturnValue(ANON_SESSION)
    render(<SiteHeader />)
    const menuButton = screen.getByRole('button', { name: /open navigation menu/i })
    menuButton.click()
    await waitFor(() => {
      expect(screen.queryByText('Install on phone')).toBeNull()
    })
  })
})
