/**
 * Next.js Proxy (formerly middleware.ts — renamed for Next.js 16+)
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

export async function proxy(request: NextRequest) {
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

  // 미인증 → 보호 경로: 로그인 페이지로 리다이렉트
  if (!user && PROTECTED.some(p => pathname.startsWith(p))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 인증됨 → 로그인/회원가입: 대시보드로 리다이렉트
  if (user && AUTH_ROUTES.some(p => pathname === p)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
