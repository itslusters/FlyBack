/**
 * /status — 클레임 대시보드
 * Server Component: Supabase에서 클레임 데이터 조회
 * Client Component: 인터랙티브 타임라인 UI (StatusClient)
 */

import { createServerClient } from '@supabase/ssr'
import { cookies }            from 'next/headers'
import { redirect }           from 'next/navigation'
import StatusClient           from './components/StatusClient'

export const dynamic = 'force-dynamic'

export default async function StatusPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => {
          try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/status')

  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return <StatusClient claims={claims ?? []} userEmail={user.email ?? ''} />
}
