import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from '@/lib/auth'
import { fetchTuneSlugById } from '@/db/queries/tunes'
import { isNumericTuneSlug } from '@/lib/tune-slug'

/**
 * Combined edge proxy for the psalter app.
 *
 * Next.js 16 renamed `middleware.ts` to `proxy.ts`. Both files cannot exist
 * at the same path; this file replaces the old `src/middleware.ts` and adds
 * issue-72 Server-Timing instrumentation on the slow routes.
 *
 * What this file does:
 *   1. /tunes/<id> → /tunes/<slug> 308 redirect (TUNE-05 — must be a real HTTP 308,
 *      not a client-side redirect).
 *   2. /api/dev/* — admin-gated JSON 401/403 (SEC-01/SEC-02).
 *   3. /precent/* — auth-gated, redirects to /login when the session cookie
 *      is missing (D-02).
 *   4. /dev/* — admin-gated, redirects to /login or /admin-only (D-01).
 *   5. Issue #72 instrumentation: append a `Server-Timing` header on /precent/*
 *      and /psalms/[id] so the page server-render budget is visible in
 *      DevTools alongside `cfEdge`/`cfOrigin`. The page component fills in
 *      detailed sub-metric timings via `startTimings()`.
 */

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // TUNE-05: legacy numeric tune ids must issue a real HTTP 308.
  const tuneIdMatch = pathname.match(/^\/tunes\/(\d+)$/)
  if (tuneIdMatch) {
    const legacyId = Number(tuneIdMatch[1])
    const slug = await fetchTuneSlugById(legacyId)
    if (slug && !isNumericTuneSlug(slug)) {
      return NextResponse.redirect(new URL(`/tunes/${slug}`, request.url), 308)
    }
    return NextResponse.next()
  }

  // SEC-01/SEC-02: /api/dev/* — admin-gated, must return JSON
  if (pathname.startsWith('/api/dev')) {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    return NextResponse.next()
  }

  // D-02: /precent/* — auth-gated
  if (pathname.startsWith('/precent')) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    }
    const response = NextResponse.next()
    response.headers.append('Server-Timing', 'proxy;dur=0;desc="issue-72 edge"')
    return response
  }

  // D-01: /dev/* — admin-gated
  if (pathname.startsWith('/dev')) {
    const session = await auth.api.getSession({ headers: request.headers })
    if (!session) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    }
    if (session.user.role !== 'admin') {
      return NextResponse.redirect(new URL('/admin-only', request.url))
    }
    return NextResponse.next()
  }

  // Issue #72: instrument /psalms/[id] for server-side timing visibility.
  if (pathname.startsWith('/psalms/')) {
    const response = NextResponse.next()
    response.headers.append('Server-Timing', 'proxy;dur=0;desc="issue-72 edge"')
    return response
  }

  // Issue #72: forward page-emitted Server-Timing into the response.
  // Page components cannot modify response headers (they are committed
  // before render), so the page sets the value as a request header
  // (x-issue-72-server-timing) and we lift it onto the response here.
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })
  const pageTiming = request.headers.get('x-issue-72-server-timing')
  if (pageTiming) {
    response.headers.append('Server-Timing', pageTiming)
  }
  response.headers.append('Server-Timing', 'proxy;dur=0;desc="issue-72 edge"')
  return response
}

export const config = {
  // Proxy always runs on the Node.js runtime in Next.js 16, so no
  // `runtime` export is allowed here. auth.api.getSession and
  // fetchTuneSlugById both need DB access — that is exactly why we are
  // not on edge.
  matcher: [
    '/dev',
    '/dev/:path*',
    '/api/dev/:path*',
    '/precent',
    '/precent/:path*',
    '/tunes/:id(\\d+)',
    '/psalms/:path*',
  ],
}
