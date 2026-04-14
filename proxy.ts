/**
 * Next.js Proxy (formerly middleware.ts — renamed for Next.js 16+)
 *
 * Two jobs:
 *   1. SESSION REFRESH — calls supabase.auth.getUser() on every request so the
 *      library can silently rotate expiring JWTs via Set-Cookie.
 *
 *   2. ROUTE GUARDS — redirects unauthenticated users away from protected paths,
 *      and already-authenticated users away from the login page.
 */

import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PROTECTED   = ['/dashboard']
const AUTH_ROUTES = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 환경변수 없으면 Supabase 클라이언트 생성 건너뜀 (500 방지)
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      // @supabase/ssr 0.5.0+ 필수 API: getAll / setAll
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // 세션 갱신 — 절대 제거 금지
  const { data: { user } } = await supabase.auth.getUser()

  // 미인증 → 보호 경로: 로그인으로 리다이렉트
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
