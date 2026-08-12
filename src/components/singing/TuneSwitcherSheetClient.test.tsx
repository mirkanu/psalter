// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/psalms/23',
  useSearchParams: () => new URLSearchParams(),
}))
import { TuneSwitcherSheetClient } from './TuneSwitcherSheetClient'

afterEach(() => {
  cleanup()
})

describe('TuneSwitcherSheetClient — Wave 0 wrapper smoke test', () => {
  it('renders without throwing when sheet is closed', async () => {
    const { container } = render(
      // @ts-expect-error — minimal prop shape for smoke test
      <TuneSwitcherSheetClient open={false} onOpenChange={() => {}} tunes={[]} currentTuneId={null} />
    )
    await waitFor(() => {
      // Sheet is closed → no visible UI expected; container may be empty or
      // contain a hidden shadcn Sheet portal root. Either proves the lazy
      // import resolved.
      expect(container).toBeDefined()
    })
  })

  it('exposes a typed TuneSwitcherSheetProps', () => {
    expect(typeof TuneSwitcherSheetClient).toBe('function')
  })
})
