'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SubscribeForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'rate-limited'>('idle')
  const [email, setEmail] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.status === 429) {
        setStatus('rate-limited')
        return
      }
      if (!res.ok) throw new Error('server error')
      // Deliberately unconditional: the server returns an identical 200 for a new and an
      // already-subscribed address, and this component must not invent a distinction that
      // would leak list membership.
      setStatus('success')
    } catch (err) {
      console.error('[SubscribeForm] subscribe failed:', err)
      setStatus('error')
    }
  }

  return (
    <section className="mt-12 space-y-3" data-subscribe-section>
      <h2 className="text-lg font-semibold">Get notified of updates</h2>
      {status === 'success' ? (
        <p className="text-sm text-muted-foreground" data-subscribe-success>
          You&apos;re subscribed — we&apos;ll email you when there&apos;s something new.
        </p>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">Get an email when we publish an update.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
            <Input
              type="email"
              required
              placeholder="you@example.com"
              aria-label="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sm:max-w-xs"
            />
            <Button type="submit" disabled={status === 'loading'} className="w-full sm:w-auto">
              {status === 'loading' ? 'Subscribing…' : 'Subscribe to Updates'}
            </Button>
          </form>
          {status === 'error' && (
            <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          )}
          {status === 'rate-limited' && (
            <p className="text-sm text-destructive">
              You&apos;ve tried several times just now. Please wait a minute and try again.
            </p>
          )}
        </>
      )}
    </section>
  )
}
