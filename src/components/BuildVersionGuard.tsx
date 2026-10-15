'use client'

// BuildVersionGuard — single mechanism for the build-version cache bust.
//
// Covers BOTH stale-build trigger conditions (D-26):
//   1. iOS Safari back/forward cache (bfcache) restores — `pageshow`
//      fires with `event.persisted === true` after a tab restore.
//   2. Generic "stale build" — a fresh page load on any device, where
//      the visitor navigated away from the tab and came back later.
//
// On any trigger, fetches /api/build-version, compares the response's
// `buildId` against localStorage `psalter.lastSeenBuildId`, and hard-
// reloads the page on mismatch. First-ever load (empty localStorage)
// is NOT a reload — empty storage means "no last-seen", not "stale";
// we just record the buildId and move on.
//
// Per-load cost (D-30): one fetch + one localStorage read + one string
// compare = ~10-100µs. Deploy-boundary cost: one hard reload per stale
// visitor per deploy. Acceptable per the decision contract.
//
// Render: null. Pure side-effect component. The hidden <span> below
// exists solely to anchor a `data-build-version-guard` attribute for
// Playwright assertion of mechanism mount (per UI-SPEC.md Visual markers).
//
// Mounted once at the root layout (next to InstallDialogHost /
// InstallAsAppBanner). The component's position in the tree does not
// affect its behaviour — it only registers window listeners and runs
// a single fetch on mount.

import { useEffect } from 'react'

const STORAGE_LAST_SEEN_BUILD_ID = 'psalter.lastSeenBuildId'

export function BuildVersionGuard(): React.ReactElement | null {
  useEffect(() => {
    let cancelled = false

    async function checkAndReload(): Promise<void> {
      try {
        const res = await fetch('/api/build-version', { cache: 'no-store' })
        if (!res.ok) return // 500 case — ignore, page renders fine
        const data = (await res.json()) as { buildId?: unknown }
        if (typeof data.buildId !== 'string' || !data.buildId) return

        let stored: string | null = null
        try {
          stored = localStorage.getItem(STORAGE_LAST_SEEN_BUILD_ID)
        } catch {
          stored = null
        }

        if (stored === null) {
          // First ever load: just record the buildId, no reload.
          try {
            localStorage.setItem(STORAGE_LAST_SEEN_BUILD_ID, data.buildId)
          } catch {
            // ignore — localStorage may be unavailable
          }
        } else if (stored !== data.buildId) {
          // Mismatch: hard reload, then store new buildId. Set the new
          // value BEFORE reload so the post-reload hydrate sees a
          // matching value and does not loop.
          try {
            localStorage.setItem(STORAGE_LAST_SEEN_BUILD_ID, data.buildId)
          } catch {
            // ignore
          }
          if (!cancelled) {
            window.location.reload()
          }
        }
        // else: stored === data.buildId, no action.
      } catch {
        // Network error / offline — leave prior state. Cache-bust is
        // best-effort; failing silent is fine.
      }
    }

    // Mount-time check
    void checkAndReload()

    // bfcache restore: pageshow fires on every page load including
    // bfcache restores; event.persisted === true is the bfcache signal.
    // First-page-load fires pageshow with persisted=false — that path
    // is a no-op here because the mount-time check above already ran.
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        void checkAndReload()
      }
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

  // Playwright marker: data-build-version-guard. The hidden <span> is
  // zero-layout-impact; its sole role is to expose the attribute so
  // tests can assert mechanism mount.
  return <span data-build-version-guard hidden />
}