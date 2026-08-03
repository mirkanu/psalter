// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { UnsubscribeButton } from './UnsubscribeButton'

describe('UnsubscribeButton', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    cleanup()
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('renders a button labelled Unsubscribe and the masked email passed in', () => {
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeTruthy()
    expect(screen.getByText('j***@example.com')).toBeTruthy()
  })

  it('clicking POSTs to /api/unsubscribe with { token } as JSON', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'tok-1' }),
    })
  })

  it('on 200 shows the unsubscribed confirmation copy and a Back to Psalter link', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    })
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    await waitFor(() =>
      expect(
        screen.getByText("You've been unsubscribed. You won't receive further update emails.")
      ).toBeTruthy()
    )
    const link = screen.getByRole('link', { name: 'Back to Psalter' })
    expect(link.getAttribute('href')).toBe('/')
  })

  it('on 404 shows the dead-end copy and removes the button (no retry)', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'invalid or already-used token' }),
    })
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    await waitFor(() =>
      expect(
        screen.getByText('This unsubscribe link is invalid or has already been used.')
      ).toBeTruthy()
    )
    expect(screen.queryByRole('button', { name: /Unsubscribe/ })).toBeNull()
  })

  it('on a 500 shows the retry copy and the button REMAINS', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'server error' }),
    })
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    await waitFor(() =>
      expect(screen.getByText('Something went wrong. Please try again.')).toBeTruthy()
    )
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeTruthy()
  })

  it('while in flight the button is disabled and reads Unsubscribing…', async () => {
    let resolveFetch: (value: unknown) => void = () => {}
    ;(global.fetch as ReturnType<typeof vi.fn>).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFetch = resolve
      })
    )
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    fireEvent.click(screen.getByRole('button', { name: 'Unsubscribe' }))
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: 'Unsubscribing…' })
      expect(btn).toBeTruthy()
      expect((btn as HTMLButtonElement).disabled).toBe(true)
    })
    resolveFetch({ ok: true, status: 200, json: async () => ({ ok: true }) })
    await waitFor(() =>
      expect(
        screen.getByText("You've been unsubscribed. You won't receive further update emails.")
      ).toBeTruthy()
    )
  })

  it('fires no network request on mount — fetch has zero calls until the button is clicked', () => {
    render(<UnsubscribeButton token="tok-1" maskedEmail="j***@example.com" />)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
