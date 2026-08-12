// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
import { PsalmListingGridClient } from './PsalmListingGridClient'
import type { PsalmRow } from './PsalmListingGrid'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
})

const psalms: PsalmRow[] = [
  { id: 23, versionId: null, displayLabel: '23', slug: '23', firstLine: 'The Lord is my shepherd', meter: 'CM', kjvExcerpt: null },
  { id: 100, versionId: null, displayLabel: '100', slug: '100', firstLine: 'Make a joyful noise', meter: 'CM', kjvExcerpt: null },
]

describe('PsalmListingGridClient — Wave 0 wrapper smoke test', () => {
  it('resolves the lazy PsalmListingGrid export and renders psalm boxes', async () => {
    const { container } = render(<PsalmListingGridClient psalms={psalms} />)
    // Wait for the dynamic chunk to load + the lazy grid to render.
    await waitFor(() => {
      const boxes = container.querySelectorAll('[data-psalm-box]')
      // 2 psalms => at least one of them renders a [data-psalm-box] element.
      expect(boxes.length).toBeGreaterThanOrEqual(1)
    }, { timeout: 5000 })
  })

  it('exposes the same Props surface as PsalmListingGrid (psalms + optional onSelect + optional hideExport)', () => {
    // TypeScript-only check: if the wrapper's Props diverged from the underlying
    // component's prop shape, this file would not compile. The function type is
    // verified at runtime.
    expect(typeof PsalmListingGridClient).toBe('function')
    // Confirm the wrapper accepts the optional hideExport prop without throwing.
    const { container } = render(
      <PsalmListingGridClient psalms={psalms} hideExport onSelect={() => {}} />
    )
    expect(container).toBeDefined()
  })
})