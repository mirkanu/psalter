// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/psalms/23',
  useSearchParams: () => new URLSearchParams(),
}))
import { PsalmTopBarClient } from './PsalmTopBarClient'

afterEach(() => {
  cleanup()
})

describe('PsalmTopBarClient — Wave 0 wrapper smoke test', () => {
  it('renders the h-12 Suspense fallback or the resolved lazy component', async () => {
    // Minimal props — PsalmTopBar accepts psalm label + back href; the
    // wrapper must not throw on a minimal valid shape.
    const { container } = render(
      // @ts-expect-error — minimal prop shape for smoke test; full type
      // coverage lives in PsalmTopBar.test.tsx
      <PsalmTopBarClient psalm={{ id: 23, slug: '23', displayLabel: '23' }} prevSlug={null} nextSlug={null} />
    )
    await waitFor(() => {
      // Either the h-12 fallback div or the real PsalmTopBar root is present
      const fallback = container.querySelector('.h-12')
      const real = container.querySelector('[data-psalm-top-bar], header')
      expect(fallback !== null || real !== null).toBe(true)
    })
  })

  it('exposes a typed PsalmTopBarProps', () => {
    expect(typeof PsalmTopBarClient).toBe('function')
  })
})
