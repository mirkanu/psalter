// Admin-only deploy metadata endpoint.
//
// Returns the git commit time, short sha, and subject of the running
// build so the admin footer can show "Deployed x ago". Captured at build
// time by scripts/capture-deploy-info.ts (wired into the `prebuild`
// npm script), which writes data/deploy-info.json. This route reads
// that file on every request.
//
// Auth: getAdminSessionOr401 — the footer is admin-only because the
// deploy timestamp + commit hash give away internal repo structure.
// Anonymous users get 401, non-admin logged-in users get 403.
//
// Cache: a long max-age is safe because the data is fixed until the
// next deploy (and the next deploy is the only event that changes it,
// after which pm2 restart + a fresh client load picks up the new value).

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextResponse } from 'next/server'
import { getAdminSessionOr401 } from '@/lib/admin-auth'

interface DeployInfoFile {
  /** Wall-clock time at build start (= when the running bundle was produced). */
  deployedAt: number
  /** HEAD commit's author/committer time. Distinct from deployedAt so the
   *  label reflects when the running code went live, not when the source
   *  was last edited. */
  commitTime: number
  commit: string
  commitLong: string
  message: string
}

export const dynamic = 'force-dynamic'

export async function GET() {
  const { res: authRes } = await getAdminSessionOr401()
  if (authRes) return authRes

  let info: DeployInfoFile | null = null
  try {
    const raw = readFileSync(
      join(process.cwd(), 'data', 'deploy-info.json'),
      'utf8',
    )
    info = JSON.parse(raw) as DeployInfoFile
  } catch {
    // File missing or malformed — happens on a fresh checkout before
    // prebuild has run. Return a 200 with sensible fallbacks so the
    // footer can show "Deploy time unknown" instead of an error toast.
    return NextResponse.json(
      {
        deployedAt: null,
        commitTime: null,
        commit: 'unknown',
        commitLong: '',
        message: '',
      },
      {
        headers: {
          // Don't cache the fallback — once the file exists we want
          // the real value immediately.
          'Cache-Control': 'no-store',
        },
      },
    )
  }

  return NextResponse.json(info, {
    headers: {
      // Always-fresh: the deploy-info JSON file changes on every deploy,
      // but the browser cannot know that without revalidating. `private`
      // excludes the CDN (Cloudflare Tunnel) from caching; `max-age=0,
      // must-revalidate` forces the browser to send a conditional request
      // (If-Modified-Since) on every fetch — the server returns 304 when
      // unchanged, 200 with new JSON after a deploy. Avoids the 24h
      // staleness window that a longer max-age would create (the old
      // `private, max-age=86400` header made different tabs show different
      // commits depending on what each had cached).
      'Cache-Control': 'private, max-age=0, must-revalidate',
    },
  })
}