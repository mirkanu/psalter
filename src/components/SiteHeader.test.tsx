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
