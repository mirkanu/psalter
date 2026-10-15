// Public build-version endpoint for the cache-bust mechanism.
//
// Returns ONLY `{ buildId: string }` from .next/BUILD_ID — the same
// 21-character hash Next.js emits at build start (postbuild runs
// scripts/capture-build-id.ts which stamps the value into this file).
// The BuildVersionGuard client component (mounted globally in layout.tsx)
// fetches this on every psalm-page mount and on bfcache restores, compares
// the response against localStorage `psalter.lastSeenBuildId`, and hard-
// reloads the page on mismatch. One hard reload per stale visitor per
// deploy is the deploy-boundary cost (D-30).
//
// Public endpoint — no auth check, no admin gate. /api/deploy-info is
// admin-only because it exposes commit SHA + message + deploy timestamp
// (internal repo structure). This endpoint deliberately mirrors only
// `{ buildId }` and nothing else: BUILD_ID is a Next.js-generated random
// hash that does not encode any user data, commit info, or repo
// structure, so it is safe to expose to anonymous visitors.
//
// Auth: deliberately NONE. Anonymous visitors may freely fetch this to
// verify their cached HTML matches the live build.
//
// Cache: `private, max-age=0, must-revalidate` on success — same policy
// as /api/deploy-info, so the browser always revalidates after a deploy.
// `no-store` on the 500 paths so a transient filesystem error isn't
// pinned into the CDN/Cloudflare Tunnel layer.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const buildId = readFileSync(
      join(process.cwd(), '.next', 'BUILD_ID'),
      'utf8',
    ).trim()

    if (!buildId) {
      // Empty file — same shape as a missing file. Per D-25: 500, no
      // silent placeholder that would mask a misconfigured deploy.
      return NextResponse.json(
        { error: 'BUILD_ID missing' },
        {
          status: 500,
          headers: { 'Cache-Control': 'no-store' },
        },
      )
    }

    return NextResponse.json(
      { buildId },
      {
        headers: {
          // Same policy as /api/deploy-info: per-tab correctness across
          // deploys. `private` excludes CDN caches (Cloudflare Tunnel)
          // from storing this; `max-age=0, must-revalidate` forces the
          // browser to send a conditional request on every fetch.
          'Cache-Control': 'private, max-age=0, must-revalidate',
        },
      },
    )
  } catch {
    // Filesystem unreadable — happen on a fresh checkout or before the
    // first build. Per D-25: 500 (NOT a 200 + placeholder). The psalm
    // page renders fine either way; the cache-bust is best-effort and
    // silently no-ops on network errors.
    return NextResponse.json(
      { error: 'BUILD_ID unreadable' },
      {
        status: 500,
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }
}