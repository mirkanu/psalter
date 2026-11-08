// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, waitFor, cleanup } from '@testing-library/react'
import { PrecentingBar } from './PrecentingBar'

const { mockRefresh } = vi.hoisted(() => ({ mockRefresh: vi.fn() }))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: mockRefresh, replace: vi.fn(), back: vi.fn() }),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  mockRefresh.mockClear()
})

function stubFetch(impl: () => Promise<unknown>) {
  const fetchMock = vi.fn(impl)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderBar(overrides: Partial<React.ComponentProps<typeof PrecentingBar>> = {}) {
  return render(<PrecentingBar setId={50} pos={1} total={3} {...overrides} />)
}

describe('PrecentingBar — stale-page self-heal', () => {
  it('refreshes the page when the live item count differs from the server-rendered total', async () => {
    const fetchMock = stubFetch(async () => ({ ok: true, json: async () => ({ count: 4 }) }))
    renderBar({ total: 3 })
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/precent/50/items', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
  })

  it('does not refresh when the live item count matches the server-rendered total', async () => {
    const fetchMock = stubFetch(async () => ({ ok: true, json: async () => ({ count: 3 }) }))
    renderBar({ total: 3 })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it('swallows a failed request and still renders the counter', async () => {
    const fetchMock = stubFetch(async () => {
      throw new Error('network down')
    })
    const { container } = renderBar({ total: 3 })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
    expect(container.textContent).toContain('1 / 3')
  })

  it('ignores a non-ok response', async () => {
    const fetchMock = stubFetch(async () => ({
      ok: false,
      status: 401,
      json: async () => ({ count: 9 }),
    }))
    renderBar({ total: 3 })
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
