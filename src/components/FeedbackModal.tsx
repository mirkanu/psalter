'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [includeUrl, setIncludeUrl] = useState(true)

  function reset() {
    setStatus('idle'); setMessage(''); setName(''); setEmail(''); setIncludeUrl(true)
  }

  function handleClose() {
    reset(); onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          name: name || null,
          email: email || null,
          pageUrl: includeUrl ? window.location.href : null,
        }),
      })
      if (!res.ok) throw new Error('server error')
      setStatus('success')
    } catch (err) {
      console.error('[FeedbackModal] submission failed:', err)
      setStatus('error')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Send Feedback</DialogTitle></DialogHeader>
        {status === 'success' ? (
          <div className="space-y-3 text-center py-4">
            <h3 className="font-semibold">Thank you for your feedback</h3>
            <p className="text-sm text-muted-foreground">We&apos;ll review your message and get back to you if needed.</p>
            <Button onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fb-message">Your message</Label>
              <Textarea id="fb-message" required rows={4} className="resize-none"
                placeholder="Suggestions, feedback, or corrections…"
                value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-name">Name (optional)</Label>
              <Input id="fb-name" type="text" placeholder="Your name"
                value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fb-email">Email (optional)</Label>
              <Input id="fb-email" type="email" placeholder="your@email.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="fb-url" checked={includeUrl} onCheckedChange={(v) => setIncludeUrl(!!v)} />
              <Label htmlFor="fb-url">Include current page URL</Label>
            </div>
            {status === 'error' && (
              <p className="text-sm text-destructive">Something went wrong. Please try again, or email us directly.</p>
            )}
            <div className="flex justify-end">
              <Button type="submit" disabled={status === 'loading'} className="w-full sm:w-auto">
                {status === 'loading' ? 'Sending…' : 'Send feedback'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
