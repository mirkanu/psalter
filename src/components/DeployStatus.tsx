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
// itself sends `Cache-Control: private, max-age=0, must-revalidate`, so
// every fetch triggers a conditional GET (304 if unchanged, 200 after
// a deploy). The 60s tick interval is the only rate-limiter.
//
// Tooltip: full commit sha + subject for traceability when the admin
// is debugging "is the running code what I think it is".

import { useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import bundleBuildInfo from '@/generated/build-info.json'

interface DeployInfo {
  /** Wall-clock time at build start (= when the running bundle was produced). */
  deployedAt: number | null
  /** HEAD commit's author/committer time. Shown in the tooltip only —
   *  the main label uses deployedAt, not this, so the indicator matches
   *  when the running code went live rather than when the source was
   *  last edited. */
  commitTime?: number | null
  commit: string
  commitLong?: string
  message?: string
  /** Next.js BUILD_ID. Set by scripts/capture-build-id.ts (postbuild) and
   *  read by /api/deploy-info. Compared against document.documentElement's
   *  data-build-id (SSR'd from .next/BUILD_ID by layout.tsx) to detect a
   *  stale cached HTML response — the JS bundle's commit can be fresh
   *  while the HTML it lives in still references older chunks. */
  buildId?: string
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

function formatTimestamp(ms: number): string {
  // ISO-like, but in UTC for unambiguous tooltip display.
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 16) + ' UTC'
}

export function DeployStatus() {
  // Visibility gate — mirror ChangelogComposer / SiteHeader.
  const { data: session, isPending } = authClient.useSession()
  const isAdmin = !isPending && !!session && session.user?.role === 'admin'

  const [info, setInfo] = useState<DeployInfo | null>(null)
  const [, setTick] = useState(0)
  // Cache-buster: a random per-mount id added to the URL. Each new tab
  // mount (or hard refresh) gets a fresh URL, so the browser cannot serve
  // a stale /api/deploy-info response from a previous deploy's cache.
  // Within the same tab session the URL is stable, so 304-Not-Modified
  // still works for the 60s ticks. Complements the API's
  // `max-age=0, must-revalidate` header (which only affects NEW
  // responses — already-cached stale ones would otherwise linger until
  // their original max-age expires).
  const [cacheBuster] = useState(() => Math.random().toString(36).slice(2, 10))

  // The commit baked into the JS bundle this component was shipped in.
  // Captured at build time by scripts/capture-deploy-info.ts. If this
  // doesn't match what /api/deploy-info reports, the tab is running stale
  // JS (the footer would otherwise lie about which build is live).
  const bundleCommit = bundleBuildInfo.commit as string

  useEffect(() => {
    if (!isAdmin) return
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/deploy-info?v=${cacheBuster}`, { credentials: 'same-origin' })
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

  // HTML-staleness check: the SSR'd <html data-build-id> attribute must
  // match what /api/deploy-info reports. If they differ, the browser
  // cached the HTML from an earlier deploy — even if the JS bundle inside
  // it (with its own baked-in commit) was somehow refreshed, the HTML
  // still references older content-hashed chunks via <script src> tags.
  // The user observes this as the page rendering one version while the
  // footer reports another. We surface it as the most urgent warning.
  // Skipped when either side is missing or "unknown" — in those cases
  // build verification is inconclusive, not failed.
  const domBuildId = document.documentElement.dataset.buildId ?? ''
  const isHtmlStale =
    !!info.buildId &&
    !!domBuildId &&
    info.buildId !== 'unknown' &&
    domBuildId !== 'unknown' &&
    info.buildId !== domBuildId

  // JS-bundle staleness (existing check): if the server reports a different
  // commit than the one baked into this JS bundle, the tab is running an
  // older build. This happens when the user reloads (soft refresh) instead
  // of hard-refreshing — the browser keeps the old HTML + JS chunks while
  // the server's deploy-info reflects the new deploy. Surface it loudly so
  // the admin knows to hard-refresh before trusting what they see. HTML
  // staleness takes priority because it implies JS staleness too.
  const isJsStale =
    !isHtmlStale && !!info.commit && info.commit !== bundleCommit
  const isStale = isHtmlStale || isJsStale

  const label =
    info.deployedAt == null
      ? 'Deploy time unknown'
      : `Deployed ${formatRelative(info.deployedAt)} · ${info.commit}`

  // Tooltip splits the signals so the admin can see at a glance:
  //   - WHEN the running code went live (deployedAt = build start)
  //   - WHAT source the bundle is based on (commit + commitTime + message)
  //   - BUILD_ID for debugging "is this tab actually on the latest HTML?"
  const tooltip =
    info.deployedAt == null
      ? 'data/deploy-info.json missing — run npm run build'
      : [
          `Built: ${formatTimestamp(info.deployedAt)}`,
          `Commit: ${info.commitLong || info.commit}${
            info.commitTime ? ` (${formatTimestamp(info.commitTime)})` : ''
          }`,
          info.buildId ? `Build ID: ${info.buildId}` : null,
          info.message ? `Message: ${info.message}` : null,
          isHtmlStale
            ? `⚠ Stale HTML cached (this tab's <html data-build-id> is ${domBuildId}; server is ${info.buildId}). Hard-refresh to load the latest HTML.`
            : isJsStale
              ? `⚠ Stale JS bundle (this tab loaded ${bundleCommit}). Hard-refresh to load ${info.commit}.`
              : null,
        ]
          .filter(Boolean)
          .join('\n')

  if (isHtmlStale) {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline cursor-pointer"
        title={tooltip}
        data-deploy-status
        data-stale="html"
      >
        ⚠ Stale HTML ({domBuildId.slice(0, 8)}) — current is {info.buildId?.slice(0, 8)}. Click to hard-refresh.
      </button>
    )
  }

  if (isJsStale) {
    return (
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="text-xs font-mono tabular-nums text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline cursor-pointer"
        title={tooltip}
        data-deploy-status
        data-stale="true"
      >
        ⚠ Stale build ({bundleCommit}) — server is on {info.commit}. Click to hard-refresh.
      </button>
    )
  }

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