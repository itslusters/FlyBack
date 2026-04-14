/**
 * /login — Auth entry point
 *
 * Server Component: renders metadata and reads `?next=` / `?error=` from URL.
 * All actual auth calls (Google OAuth, magic link) live in LoginClient
 * because they need the Supabase browser client.
 *
 * The middleware already redirects authenticated users away from this page,
 * so no server-side auth check is needed here.
 */

import type { Metadata }  from 'next'
import { Suspense }        from 'react'
import LoginClient         from './components/LoginClient'

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false },   // login page should not be indexed
}

interface Props {
  searchParams: { next?: string; error?: string }
}

export default function LoginPage({ searchParams }: Props) {
  return (
    // Suspense boundary: LoginClient reads searchParams which is async in Next 14
    <Suspense>
      <LoginClient
        next={searchParams.next ?? '/status'}
        initialError={searchParams.error}
      />
    </Suspense>
  )
}
