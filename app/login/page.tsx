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

// Never statically prerender — auth pages must always be dynamic
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: '로그인',
  robots: { index: false },
}

interface Props {
  // Next.js 15+: searchParams is a Promise
  searchParams: Promise<{ next?: string; error?: string }>
}

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <Suspense>
      <LoginClient
        next={params.next ?? '/status'}
        initialError={params.error}
      />
    </Suspense>
  )
}
