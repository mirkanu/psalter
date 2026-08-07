// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'

type MockSession = { data: { user: { id: string; role: string } } | null; isPending: boolean }

const { useSessionMock, refreshMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn((): MockSession => ({ data: null, isPending: true })),
  refreshMock: vi.fn(),
}))
vi.mock('@/lib/auth-client', () => ({ authClient: { useSession: useSessionMock } }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refreshMock }) }))

import { render, fireEvent, within, cleanup } from '@testing-library/react'
import { ChangelogPostCard } from './ChangelogPostCard'
import type { ChangelogPost } from '@/db/queries/changelog'

const POST: ChangelogPost = {
  id: 1,
  title: 'New tune list',
  body: 'Line one\nLine two',
  createdAt: new Date('2026-08-02T10:00:00.000Z'),
}

const ADMIN_SESSION = { data: { user: { id: 'u1', role: 'admin' } }, isPending: false }
const USER_SESSION = { data: { user: { id: 'u2', role: 'user' } }, isPending: false }
const ANON_SESSION = { data: null, isPending: false }
const PENDING_SESSION = { data: null, isPending: true }

beforeEach(() => {
  useSessionMock.mockReturnValue(ANON_SESSION)
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

describe('ChangelogPostCard', () => {
  it('renders the post title text', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    expect(container.textContent).toContain('New tune list')
  })

  it('renders a <time> element with ISO dateTime and d MMMM yyyy text', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const time = container.querySelector('time')
    expect(time).not.toBeNull()
    expect(time?.getAttribute('dateTime')).toBe(POST.createdAt.toISOString())
    expect(time?.textContent).toBe('2 August 2026')
  })

  it('renders the body with a whitespace-pre-wrap class so line breaks survive', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const body = container.querySelector('.whitespace-pre-wrap')
    expect(body).not.toBeNull()
    expect(body?.textContent).toBe('Line one\nLine two')
  })

  it('does not carry the border-l-primary accent stripe', () => {
    const { container } = render(<ChangelogPostCard post={POST} />)
    const card = container.querySelector('[data-changelog-post]')
    expect(card?.className ?? '').not.toContain('border-l-primary')
  })

  describe('Edit button visibility', () => {
    it('shows no Edit button while isPending is true', () => {
      useSessionMock.mockReturnValue(PENDING_SESSION)
      const { container } = render(<ChangelogPostCard post={POST} />)
      expect(container.querySelector('[data-changelog-post-edit-button]')).toBeNull()
    })

    it('shows no Edit button for an anonymous session', () => {
      useSessionMock.mockReturnValue(ANON_SESSION)
      const { container } = render(<ChangelogPostCard post={POST} />)
      expect(container.querySelector('[data-changelog-post-edit-button]')).toBeNull()
    })

    it("shows no Edit button for a session with role 'user'", () => {
      useSessionMock.mockReturnValue(USER_SESSION)
      const { container } = render(<ChangelogPostCard post={POST} />)
      expect(container.querySelector('[data-changelog-post-edit-button]')).toBeNull()
    })

    it("shows an Edit button for role 'admin'", () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      const { container } = render(<ChangelogPostCard post={POST} />)
      expect(container.querySelector('[data-changelog-post-edit-button]')).not.toBeNull()
    })
  })

  describe('editing', () => {
    it('clicking Edit swaps in a form pre-filled with the post title and body', () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      const { container } = render(<ChangelogPostCard post={POST} />)
      fireEvent.click(container.querySelector('[data-changelog-post-edit-button]')!)
      const titleInput = container.querySelector('input') as HTMLInputElement
      const bodyInput = container.querySelector('textarea') as HTMLTextAreaElement
      expect(titleInput.value).toBe('New tune list')
      expect(bodyInput.value).toBe('Line one\nLine two')
    })

    it('Cancel discards edits and returns to the read view without saving', () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      const fetchMock = stubFetch(200)
      const { container } = render(<ChangelogPostCard post={POST} />)
      fireEvent.click(container.querySelector('[data-changelog-post-edit-button]')!)
      fireEvent.change(container.querySelector('input')!, { target: { value: 'Changed title' } })
      const scope = within(container)
      fireEvent.click(scope.getByRole('button', { name: 'Cancel' }))
      expect(container.textContent).toContain('New tune list')
      expect(container.querySelector('form')).toBeNull()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('Save changes PATCHes /api/changelog/{id} with { title, body } as JSON', async () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      const fetchMock = stubFetch(200)
      const { container } = render(<ChangelogPostCard post={POST} />)
      fireEvent.click(container.querySelector('[data-changelog-post-edit-button]')!)
      fireEvent.change(container.querySelector('input')!, { target: { value: 'Updated title' } })
      fireEvent.change(container.querySelector('textarea')!, { target: { value: 'Updated body' } })
      fireEvent.submit(container.querySelector('form')!)
      await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
      expect(fetchMock).toHaveBeenCalledWith('/api/changelog/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated title', body: 'Updated body' }),
      })
    })

    it('on 200 returns to the read view and calls router.refresh() exactly once', async () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      stubFetch(200)
      const { container } = render(<ChangelogPostCard post={POST} />)
      fireEvent.click(container.querySelector('[data-changelog-post-edit-button]')!)
      fireEvent.submit(container.querySelector('form')!)
      await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
      expect(container.querySelector('form')).toBeNull()
    })

    it("on a non-ok response shows \"Couldn't save — please try again.\" and stays in edit mode", async () => {
      useSessionMock.mockReturnValue(ADMIN_SESSION)
      stubFetch(500)
      const { container } = render(<ChangelogPostCard post={POST} />)
      fireEvent.click(container.querySelector('[data-changelog-post-edit-button]')!)
      fireEvent.submit(container.querySelector('form')!)
      const scope = within(container)
      await scope.findByText("Couldn't save — please try again.")
      expect(refreshMock).not.toHaveBeenCalled()
      expect(container.querySelector('form')).not.toBeNull()
    })
  })
})
