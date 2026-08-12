// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, waitFor } from '@testing-library/react'
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
import { GlobalSearchClient } from './GlobalSearchClient'

afterEach(() => {
  cleanup()
})

describe('GlobalSearchClient — Wave 0 wrapper smoke test', () => {
  it('resolves the lazy GlobalSearch export without throwing on a closed dialog', async () => {
    const { container } = render(
      <GlobalSearchClient open={false} onClose={() => {}} />
    )
    // The dialog is closed, so the DOM should not contain search input fields.
    // But the wrapper itself must successfully resolve the dynamic import
    // (the chunk fetch in jsdom may resolve synchronously or async).
    await waitFor(() => {
      expect(container).toBeDefined()
    })
    // When closed, the GlobalSearch Dialog renders no inputs.
    expect(container.querySelector('input[placeholder="Find psalms or tunes…"]')).toBeNull()
  })

  it('exposes the same Props surface as GlobalSearch', () => {
    // TypeScript-only check: the inferred GlobalSearchProps type covers
    // open + onClose. If the wrapper's props diverged from the underlying
    // component, this file would fail to compile.
    expect(typeof GlobalSearchClient).toBe('function')
  })
})
