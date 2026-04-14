import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl

  const code     = searchParams.get('code')
  const next     = searchParams.get('next') ?? '/status'
  const error    = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  // Surface provider errors (e.g. user denied Google consent)
  if (error) {
    const url = new URL('/login', origin)
    url.searchParams.set('error', errorDesc ?? error)
    return NextResponse.redirect(url)
  }

  if (code) {
    // Next.js 15+: cookies() is async
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Server Component context — middleware will handle refresh
            }
          },
        },
      },
    )

    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      const safeNext = next.startsWith('/') ? next : '/dashboard'
      return NextResponse.redirect(new URL(safeNext, origin))
    }

    console.error('[auth/callback] exchangeCodeForSession:', exchangeError.message)
  }

  const url = new URL('/login', origin)
  url.searchParams.set('error', 'Could not authenticate — please try again.')
  return NextResponse.redirect(url)
}
