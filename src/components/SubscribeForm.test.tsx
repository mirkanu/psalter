// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, within, cleanup } from '@testing-library/react'
import { SubscribeForm } from './SubscribeForm'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

function stubFetch(status: number, body: unknown = { ok: true }) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('SubscribeForm', () => {
  it('renders an input[type=email][required] and a Subscribe to Updates button', () => {
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com') as HTMLInputElement
    expect(input.getAttribute('type')).toBe('email')
    expect(input.hasAttribute('required')).toBe(true)
    expect(scope.getByRole('button', { name: 'Subscribe to Updates' })).not.toBeNull()
  })

  it('submitting POSTs to /api/subscribe with { email } as JSON', async () => {
    const fetchMock = stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await scope.findByText("You're subscribed — we'll email you when there's something new.")
    expect(fetchMock).toHaveBeenCalledWith('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a@b.com' }),
    })
  })

  it('on a 200 response the form is replaced by the exact success copy', async () => {
    stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const success = await scope.findByText("You're subscribed — we'll email you when there's something new.")
    expect(success).not.toBeNull()
    expect(container.querySelector('form')).toBeNull()
  })

  it('a 200 response for an already-subscribed address renders the identical success copy', async () => {
    stubFetch(200)
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'already@subscribed.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const success = await scope.findByText("You're subscribed — we'll email you when there's something new.")
    expect(success.textContent).toBe("You're subscribed — we'll email you when there's something new.")
  })

  it('on a 429 the form stays and shows a wait-and-retry message; on any other non-ok status it shows the generic error', async () => {
    stubFetch(429)
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    await scope.findByText(/wait a minute/i)
    expect(container.querySelector('form')).not.toBeNull()
    cleanup()

    stubFetch(500)
    const { container: container2 } = render(<SubscribeForm />)
    const scope2 = within(container2)
    const input2 = scope2.getByPlaceholderText('you@example.com')
    fireEvent.change(input2, { target: { value: 'a@b.com' } })
    const form2 = container2.querySelector('form')!
    fireEvent.submit(form2)
    await scope2.findByText('Something went wrong. Please try again.')
  })

  it('disables the button and reads Subscribing… while the request is in flight', async () => {
    let resolveFetch: (r: Response) => void
    const pending = new Promise<Response>((resolve) => {
      resolveFetch = resolve
    })
    vi.stubGlobal('fetch', vi.fn(() => pending))
    const { container } = render(<SubscribeForm />)
    const scope = within(container)
    const input = scope.getByPlaceholderText('you@example.com')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    const form = container.querySelector('form')!
    fireEvent.submit(form)
    const button = (await scope.findByRole('button', { name: 'Subscribing…' })) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    resolveFetch!(new Response(JSON.stringify({ ok: true }), { status: 200 }))
  })
})
