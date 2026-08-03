'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'

/**
 * Admin-only inline post composer (CHLG-02).
 *
 * This session check decides VISIBILITY ONLY. It is not a security boundary — anyone can
 * call POST /api/changelog directly, which is why that route independently enforces
 * getAdminSessionOr401(). Never treat this component as authorization.
 *
 * `isPending` is branched before `data` because better-auth reports isPending: true on the
 * first client render and throughout SSR; checking `data` first would flash the composer
 * (or flash its absence) for one frame.
 */
export function ChangelogComposer() {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  if (isPending) return null
  if (!session || session.user?.role !== 'admin') return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/changelog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      if (!res.ok) throw new Error('server error')
      setTitle('')
      setBody('')
      setStatus('idle')
      router.refresh()
    } catch (err) {
      console.error('[ChangelogComposer] publish failed:', err)
      setStatus('error')
    }
  }

  return (
    <Card className="border-l-4 border-l-primary mt-6" data-changelog-composer>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Badge variant="secondary">Admin</Badge>
          Write a post
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            required
            placeholder="Post title"
            aria-label="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            required
            rows={6}
            placeholder="What changed?"
            aria-label="Post body"
            className="resize-none"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          {status === 'error' && (
            <p className="text-sm text-destructive">Couldn&apos;t publish — please try again.</p>
          )}
          <div className="flex justify-end">
            <Button type="submit" disabled={status === 'loading'} className="w-full sm:w-auto">
              {status === 'loading' ? 'Publishing…' : 'Publish post'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
