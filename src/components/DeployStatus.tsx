'use client'

// Admin-only "Deployed x ago" indicator for the footer.
//
// Visibility gate: uses Better Auth's useSession() to detect whether
// the current user has role=admin. The session check is UI visibility
// only — the data endpoint at /api/deploy-info independently enforces
// getAdminSessionOr401, so non-admins can't fetch this even by hitting
// the API directly. (See ChangelogComposer's "visibility only" comment
// for the same pattern.)
//
// Refresh strategy: fetches on mount, then ticks every 60s so the
// relative-time display stays fresh without a page reload. The API
// itself sends `Cache-Control: private, max-age=86400`, so the network
// request only fires when the cached response expires (or after the
// tab is closed and reopened).
//
// Tooltip: full commit sha + subject for traceability when the admin
// is debugging "is the running code what I think it is".

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

interface DeployInfo {
  deployedAt: number | null
  commit: string
  commitLong?: string
  message?: string
}

const TICK_MS = 60_000 // refresh the relative-time label every minute

function formatRelative(ms: number): string {
  const now = Date.now()
  const diffSec = Math.max(0, Math.floor((now - ms) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} hr${diffHr === 1 ? '' : 's'} ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`
  const diffMonth = Math.floor(diffDay / 30)
  if (diffMonth < 12) return `${diffMonth} mo ago`
  const diffYear = Math.floor(diffDay / 365)
  return `${diffYear} yr${diffYear === 1 ? '' : 's'} ago`
}

export function DeployStatus() {
  // Visibility gate — mirror ChangelogComposer / SiteHeader.
  const { data: session, isPending } = authClient.useSession()
  const isAdmin = !isPending && !!session && session.user?.role === 'admin'

  const [info, setInfo] = useState<DeployInfo | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/deploy-info', { credentials: 'same-origin' })
        if (!res.ok) return
        const data = (await res.json()) as DeployInfo
        if (!cancelled) setInfo(data)
      } catch {
        // Network error / offline — leave prior state. The "Deployed x ago"
        // label is informational; failing silent is fine.
      }
    }

    void load()
    const id = setInterval(() => {
      // Tick the relative-time display.
      setTick((n) => n + 1)
      // Refresh data every hour in case a deploy happened while the
      // tab was open. Cheaper than fetching every minute.
      void load()
    }, TICK_MS)

    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [isAdmin])

  if (!isAdmin || !info) return null

  const label =
    info.deployedAt == null
      ? 'Deploy time unknown'
      : `Deployed ${formatRelative(info.deployedAt)}`

  const tooltip =
    info.deployedAt == null
      ? 'data/deploy-info.json missing — run npm run build'
      : `${info.commitLong || info.commit} — ${info.message || '(no message)'}`

  return (
    <span
      className="text-xs text-muted-foreground/70 font-mono tabular-nums"
      title={tooltip}
      data-deploy-status
    >
      {label}
    </span>
  )
}