'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { authClient } from '@/lib/auth-client'
import type { ChangelogPost } from '@/db/queries/changelog'

interface ChangelogPostCardProps {
  post: ChangelogPost
}

/**
 * The Edit button's visibility is a UI affordance only — PATCH /api/changelog/[id]
 * independently enforces getAdminSessionOr401(). Never treat this as authorization.
 */
export function ChangelogPostCard({ post }: ChangelogPostCardProps) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const isAdmin = !isPending && !!session && session.user?.role === 'admin'

  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(post.title)
  const [body, setBody] = useState(post.body)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  function startEdit() {
    setTitle(post.title)
    setBody(post.body)
    setStatus('idle')
    setIsEditing(true)
  }

  function cancelEdit() {
    setTitle(post.title)
    setBody(post.body)
    setStatus('idle')
    setIsEditing(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch(`/api/changelog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body }),
      })
      if (!res.ok) throw new Error('server error')
      setStatus('idle')
      setIsEditing(false)
      router.refresh()
    } catch (err) {
      console.error('[ChangelogPostCard] save failed:', err)
      setStatus('error')
    }
  }

  if (isEditing) {
    return (
      <Card className="border-l-4 border-l-primary" data-changelog-post data-changelog-post-editing>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Badge variant="secondary">Admin</Badge>
            Edit post
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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
              <p className="text-sm text-destructive">Couldn&apos;t save — please try again.</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelEdit} disabled={status === 'loading'}>
                Cancel
              </Button>
              <Button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? 'Saving…' : 'Save changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-changelog-post>
      <CardHeader className="flex flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="text-lg font-semibold">{post.title}</CardTitle>
          <time
            className="text-sm text-muted-foreground"
            dateTime={post.createdAt.toISOString()}
          >
            {format(post.createdAt, 'd MMMM yyyy')}
          </time>
        </div>
        {isAdmin && (
          <Button type="button" variant="outline" size="sm" onClick={startEdit} data-changelog-post-edit-button>
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm whitespace-pre-wrap">{post.body}</p>
      </CardContent>
    </Card>
  )
}
