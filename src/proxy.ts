import { NextRequest, NextResponse } from 'next/server'

/**
 * Edge-side timing proxy for issue #72.
 *
 * Why a proxy? In Next.js 16 App Router, `headers().set('Server-Timing', ...)`
 * inside a Server Component is silently dropped — the response headers are
 * already committed by the time the page renders. The proxy layer is the
 * ONLY place where we can attach a response header to the HTML response.
 *
 * What this measures:
 *   This proxy returns synchronously (no DB calls, no auth logic on the slow
 *   route — auth runs in the page itself). So we emit `dur=0` here as a
 *   sanity check: the proxy is *not* the bottleneck on /precent/[id]/sing/[pos].
 *   The browser DevTools Network panel will show `proxy;dur=0` alongside
 *   `cfEdge;dur=...` and `cfOrigin;dur=...`, which lets us prove the delay
 *   is in `cfOrigin` (Neon Postgres) rather than in our edge code.
 *
 * Header format: <name>;dur=<ms>;desc="..." — multiple values are
 * comma-separated by browsers. We append, never overwrite.
 */

export function proxy(_request: NextRequest) {
  const response = NextResponse.next()
  response.headers.append('Server-Timing', 'proxy;dur=0;desc="issue-72 edge"')
  return response
}

export const config = {
  // Keep this matcher aligned with the issue-72 surface we want to measure:
  // /precent/* is the page users complain about. /psalms/[id] is the
  // comparable public route so we can see whether the slow path is
  // specific to /precent or affects all RSC routes.
  matcher: [
    '/precent/:path*',
    '/psalms/:path*',
  ],
}
