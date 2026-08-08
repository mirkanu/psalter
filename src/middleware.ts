import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from '@/lib/auth'
import { fetchTuneSlugById } from '@/db/queries/tunes'
import { isNumericTuneSlug } from '@/lib/tune-slug'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // TUNE-05: legacy numeric tune ids (/tunes/169) must issue a real HTTP 308, not just a
  // client-side redirect. Doing this in the page component doesn't work: src/app/tunes/[slug]/
  // has a sibling loading.tsx, which makes Next.js stream the 200 shell before the page's async
  // permanentRedirect() call resolves — the status code is already committed by then, so it
  // silently degrades to a meta-refresh/JS redirect invisible to crawlers, curl, and link
  // checkers. Middleware runs before any rendering starts, so the redirect here is always real.
  const tuneIdMatch = pathname.match(/^\/tunes\/(\d+)$/)
  if (tuneIdMatch) {
    const legacyId = Number(tuneIdMatch[1])
    const slug = await fetchTuneSlugById(legacyId)
    if (slug && !isNumericTuneSlug(slug)) {
      return NextResponse.redirect(new URL(`/tunes/${slug}`, request.url), 308)
    }
    return NextResponse.next()
  }

  // SEC-01/SEC-02: /api/dev/* requires admin role (full DB-backed session check).
  // API routes must return JSON 401/403, never a redirect — a 307 to an HTML
  // login page is useless to a fetch() caller and would surface as a confusing
  // non-2xx-but-not-error response. Checked before the /dev branch below.
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

  // D-02: /precent/* requires any authenticated session (fast cookie check)
  if (pathname.startsWith('/precent')) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const callbackUrl = encodeURIComponent(pathname)
      return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url))
    }
    return NextResponse.next()
  }

  // D-01: /dev/* requires admin role (full DB-backed session check)
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

  return NextResponse.next()
}

export const config = {
  runtime: 'nodejs',                       // MANDATORY — auth.api.getSession opens a DB socket
  matcher: [
    '/dev',
    '/dev/:path*',
    '/api/dev/:path*',
    '/precent',
    '/precent/:path*',
    '/tunes/:id(\\d+)',
  ],
}
