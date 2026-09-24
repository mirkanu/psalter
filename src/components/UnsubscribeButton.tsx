'use client'

import { useState } from 'react'
import Link from "@/components/Link"
import { Button, buttonVariants } from '@/components/ui/button'

interface UnsubscribeButtonProps {
  token: string
  maskedEmail: string
}

export function UnsubscribeButton({ token, maskedEmail }: UnsubscribeButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'gone' | 'error'>('idle')

  async function handleClick() {
    setStatus('loading')
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      if (res.status === 404) {
        setStatus('gone')
        return
      }
      if (!res.ok) throw new Error('server error')
      setStatus('success')
    } catch (err) {
      console.error('[UnsubscribeButton] unsubscribe failed:', err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="space-y-6" data-unsubscribe-success>
        <p className="text-sm text-muted-foreground">
          You&apos;ve been unsubscribed. You won&apos;t receive further update emails.
        </p>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Back to Psalter
        </Link>
      </div>
    )
  }

  if (status === 'gone') {
    return (
      <p className="text-sm text-muted-foreground" data-unsubscribe-gone>
        This unsubscribe link is invalid or has already been used.
      </p>
    )
  }

  return (
    <div className="space-y-3" data-unsubscribe-form>
      <p className="text-sm text-muted-foreground">{maskedEmail}</p>
      <Button
        variant="outline"
        className="mt-6"
        disabled={status === 'loading'}
        onClick={handleClick}
      >
        {status === 'loading' ? 'Unsubscribing…' : 'Unsubscribe'}
      </Button>
      {status === 'error' && (
        <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
      )}
    </div>
  )
}
