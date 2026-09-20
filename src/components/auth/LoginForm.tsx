'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { FeedbackModal } from '@/components/FeedbackModal'

export function LoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [feedbackOpen, setFeedbackOpen] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const { error: signInError } = await authClient.signIn.email({ email, password })
      if (signInError) {
        setError(signInError.message ?? 'Login failed')
        return
      }
      const raw = searchParams.get('callbackUrl') ?? '/precent'
      // RESEARCH Pitfall 6: only allow relative same-site paths (D-05)
      const destination = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/precent'
      // Hard navigation, not router.push: the client router cache holds the
      // pre-login RSC payload for /precent, which is its redirect back to /login.
      window.location.assign(destination)
    })
  }

  return (
    <>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Precentor sign in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Sign in'}
            </Button>
            {/* Issue #10: surface the account-request path on the login screen
                so uninvited visitors see how to ask, instead of bouncing
                away. The footnote-style hint keeps it subordinate to the
                primary "Sign in" action and survives phone widths. */}
            <p className="text-muted-foreground text-xs pt-2 border-t">
              Don&apos;t have an account yet?{' '}
              <button
                type="button"
                onClick={() => setFeedbackOpen(true)}
                className="underline underline-offset-2 hover:text-foreground transition-colors"
              >
                Send a request for an account.
              </button>
            </p>
          </form>
        </CardContent>
      </Card>
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </>
  )
}
