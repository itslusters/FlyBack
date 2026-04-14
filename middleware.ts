/**
 * Next.js Edge Middleware
 *
 * Two jobs:
 *   1. SESSION REFRESH — calls supabase.auth.getUser() on every request so the
 *      library can silently rotate expiring JWTs via Set-Cookie. Without this,
 *      server components see stale sessions after the JWT expires (~1 hour).
 *
 *   2. ROUTE GUARDS — redirects unauthenticated users away from protected paths,
 *      and already-authenticated users away from the login page.
 *
 * Protected paths  : /dashboard (data requires a signed-in owner)
 * Auth-only paths  : /login, /signup (skip if already signed in)
 * Public paths     : /, /flights/check (check is free, saving requires auth)
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED   = ['/dashboard']
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Build a mutable response — cookie writes below will mutate this reference.
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => {
          // Write to both the mutated request and the outgoing response so all
          // downstream server components see the refreshed token immediately.
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    },
  )

  // This call is what refreshes the session — do NOT remove it.
  const { data: { user } } = await supabase.auth.getUser()

  // ── Route guards ──────────────────────────────────────────────────────────

  // Unauthenticated → protected route: redirect to login, preserve destination
  if (!user && PROTECTED.some(p => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated → login/signup: redirect to dashboard (already signed in)
  if (user && AUTH_ROUTES.some(p => pathname === p)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Run on all routes EXCEPT:
     *   - Next.js internals (_next/static, _next/image)
     *   - Static assets with common extensions
     *   - favicon.ico
     *
     * This broad matcher is intentional: every server-rendered route needs
     * the session refresh so tokens stay valid across the whole app.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
