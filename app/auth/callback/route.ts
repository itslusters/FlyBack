import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl

  const code      = searchParams.get('code')
  const next      = searchParams.get('next') ?? '/status'
  const error     = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDesc ?? error)
    return NextResponse.redirect(url)
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=Missing+auth+code', origin))
  }

  // 리다이렉트 응답을 먼저 만들고, 쿠키를 직접 이 응답에 심어야 함
  // cookies() from next/headers 를 쓰면 redirect 응답에 쿠키가 누락됨
  const safeNext = next.startsWith('/') ? next : '/status'
  const successRedirect = NextResponse.redirect(new URL(safeNext, origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // 세션 쿠키를 리다이렉트 응답에 직접 심기
          cookiesToSet.forEach(({ name, value, options }) =>
            successRedirect.cookies.set(name, value, options)
          )
        },
      },
    },
  )

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[auth/callback] exchangeCodeForSession:', exchangeError.message)
    const url = new URL('/login', origin)
    url.searchParams.set('error', '인증에 실패했습니다. 다시 시도해주세요.')
    return NextResponse.redirect(url)
  }

  return successRedirect
}
