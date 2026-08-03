// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
// eslint-disable-next-line import/no-unresolved
import composerSource from './ChangelogComposer.tsx?raw'

const { useSessionMock, refreshMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(() => ({ data: null, isPending: true })),
  refreshMock: vi.fn(),
}))
vi.mock('@/lib/auth-client', () => ({ authClient: { useSession: useSessionMock } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }))

import { render, fireEvent, within, cleanup } from '@testing-library/react'
import { ChangelogComposer } from './ChangelogComposer'

const ADMIN_SESSION = { data: { user: { id: 'u1', role: 'admin' } }, isPending: false }
const USER_SESSION = { data: { user: { id: 'u2', role: 'user' } }, isPending: false }
const ANON_SESSION = { data: null, isPending: false }
const PENDING_SESSION = { data: null, isPending: true }

beforeEach(() => {
  refreshMock.mockClear()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown = { ok: true }) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('ChangelogComposer', () => {
  it('renders nothing while isPending is true', () => {
    useSessionMock.mockReturnValue(PENDING_SESSION)
    const { container } = render(<ChangelogComposer />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing for an anonymous session (data: null)', () => {
    useSessionMock.mockReturnValue(ANON_SESSION)
    const { container } = render(<ChangelogComposer />)
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing for a session with role 'user'", () => {
    useSessionMock.mockReturnValue(USER_SESSION)
    const { container } = render(<ChangelogComposer />)
    expect(container.firstChild).toBeNull()
  })

  it("renders a title input, a textarea, and a Publish post button for role 'admin'", () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    const { container } = render(<ChangelogComposer />)
    const scope = within(container)
    expect(scope.getByPlaceholderText('Post title')).not.toBeNull()
    expect(container.querySelector('textarea')).not.toBeNull()
    expect(scope.getByRole('button', { name: 'Publish post' })).not.toBeNull()
  })

  it('submitting POSTs /api/changelog with { title, body } as JSON', async () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    const fetchMock = stubFetch(200)
    const { container } = render(<ChangelogComposer />)
    const scope = within(container)
    fireEvent.change(scope.getByPlaceholderText('Post title'), { target: { value: 'Title' } })
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Body text' } })
    fireEvent.submit(container.querySelector('form')!)
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('/api/changelog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Title', body: 'Body text' }),
    })
  })

  it('on 200 clears the fields and calls router.refresh() exactly once', async () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    stubFetch(200)
    const { container } = render(<ChangelogComposer />)
    const scope = within(container)
    const titleInput = scope.getByPlaceholderText('Post title') as HTMLInputElement
    const bodyInput = container.querySelector('textarea') as HTMLTextAreaElement
    fireEvent.change(titleInput, { target: { value: 'Title' } })
    fireEvent.change(bodyInput, { target: { value: 'Body text' } })
    fireEvent.submit(container.querySelector('form')!)
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
    expect(titleInput.value).toBe('')
    expect(bodyInput.value).toBe('')
  })

  it("on a non-ok response shows \"Couldn't publish — please try again.\" and does not call router.refresh()", async () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    stubFetch(500)
    const { container } = render(<ChangelogComposer />)
    const scope = within(container)
    fireEvent.change(scope.getByPlaceholderText('Post title'), { target: { value: 'Title' } })
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Body text' } })
    fireEvent.submit(container.querySelector('form')!)
    await scope.findByText("Couldn't publish — please try again.")
    expect(refreshMock).not.toHaveBeenCalled()
  })

  it('disables the button and reads Publishing… while in flight', async () => {
    useSessionMock.mockReturnValue(ADMIN_SESSION)
    let resolveFetch: (r: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal('fetch', vi.fn(() => pending))
    const { container } = render(<ChangelogComposer />)
    const scope = within(container)
    fireEvent.change(scope.getByPlaceholderText('Post title'), { target: { value: 'Title' } })
    fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Body text' } })
    fireEvent.submit(container.querySelector('form')!)
    const button = (await scope.findByRole('button', { name: 'Publishing…' })) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    resolveFetch!(new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })

  it('the component source contains no branch that renders the composer when role !== admin', () => {
    expect(/role !== .admin./.test(composerSource)).toBe(true)
    expect((composerSource.match(/return null/g) ?? []).length).toBe(2)
  })
})
