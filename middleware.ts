import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { auth } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
  matcher: ['/dev/:path*', '/precent/:path*'],
}
