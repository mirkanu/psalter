// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, findByText } from '@testing-library/react'
import { SubscribeForm } from './SubscribeForm'

afterEach(() => {
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown = { ok: true }) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('SubscribeForm', () => {
  it('renders an input[type=email][required] and a Subscribe to Updates button', () => {
    render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    expect(input).toHaveAttribute('type', 'email')
    expect(input).toHaveAttribute('required')
    expect(screen.getByRole('button', { name: 'Subscribe to Updates' })).toBeInTheDocument()
  })

  it('submitting POSTs to /api/subscribe with { email } as JSON', async () => {
    const fetchMock = stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await findByText(container, "You're subscribed — we'll email you when there's something new.")
    expect(fetchMock).toHaveBeenCalledWith('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
  })

  it('on a 200 response the form is replaced by the exact success copy', async () => {
    stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const success = await findByText(container, "You're subscribed — we'll email you when there's something new.")
    expect(success).toBeInTheDocument()
    expect(container.querySelector('form')).toBeNull()
  })

  it('a 200 response for an already-subscribed address renders the identical success copy', async () => {
    stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'already@subscribed.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const success = await findByText(container, "You're subscribed — we'll email you when there's something new.")
    expect(success.textContent).toBe("You're subscribed — we'll email you when there's something new.")
  })

  it('on a 429 the form stays and shows a wait-and-retry message; on any other non-ok status it shows the generic error', async () => {
    stubFetch(429)
    const { container, unmount } = render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await findByText(container, /wait a minute/i)
    expect(container.querySelector('form')).not.toBeNull()
    unmount()

    stubFetch(500)
    const { container: container2 } = render(<SubscribeForm />)
    const input2 = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input2, { target: { value: 'a@b.com' } })
    const form2 = container2.querySelector('form')!
    fireEvent.submit(form2)
    await findByText(container2, 'Something went wrong. Please try again.')
  })

  it('disables the button and reads Subscribing… while the request is in flight', async () => {
    let resolveFetch: (r: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal('fetch', vi.fn(() => pending))
    const { container } = render(<SubscribeForm />)
    const input = screen.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const button = await screen.findByRole('button', { name: 'Subscribing…' })
    expect(button).toBeDisabled()
    resolveFetch!(new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })
})
