'use client'

/**
 * LoginClient — auth form (Google OAuth + email magic link).
 *
 * State machine:
 *   idle → submitting → sent (magic link) | error
 *
 * Google OAuth:
 *   signInWithOAuth({ provider: 'google' }) → browser redirect → /auth/callback
 *
 * Magic link:
 *   signInWithOtp({ email }) → email sent → user clicks link → /auth/callback
 *
 * The `next` prop is threaded through the OAuth/magic-link redirectTo URL so
 * after authentication the user lands on their intended destination.
 */

import { useState }   from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link           from 'next/link'
import { Plane, ArrowLeft, Loader2, Mail, CheckCircle, AlertTriangle } from 'lucide-react'

// ─── SUPABASE BROWSER CLIENT ──────────────────────────────────────────────────

function useSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

// ─── GOOGLE SVG ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2a10.34 10.34 0 0 0-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908C16.658 14.252 17.64 11.945 17.64 9.2Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  )
}

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface Props {
  next:         string
  initialError: string | undefined
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function LoginClient({ next, initialError }: Props) {
  const supabase = useSupabase()

  const [email,       setEmail]       = useState('')
  const [status,      setStatus]      = useState<'idle' | 'loading' | 'sent'>('idle')
  const [error,       setError]       = useState<string | null>(initialError ?? null)
  const [googleBusy,  setGoogleBusy]  = useState(false)

  const callbackUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback?next=${encodeURIComponent(next)}`

  async function handleGoogle() {
    setGoogleBusy(true)
    setError(null)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options:  { redirectTo: callbackUrl },
    })
    if (oauthError) {
      setError(oauthError.message)
      setGoogleBusy(false)
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('loading')
    setError(null)
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl },
    })
    if (otpError) {
      setError(otpError.message)
      setStatus('idle')
    } else {
      setStatus('sent')
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

  return (
    <main className="flex min-h-[100svh] flex-col bg-[#08090a]">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-[14px] border-b border-white/[0.05]"
        style={{ background: 'rgba(8,9,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <Link href="/"
          className="flex items-center gap-1.5 text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
            <Plane className="h-3 w-3 text-white" />
          </div>
          <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
        </Link>
      </nav>

      {/* Centered card */}
      <div className="flex flex-1 items-center justify-center px-6 pb-16 pt-8">
        <div className="w-full max-w-[400px]">

          {/* GlowCard wrapper */}
          <div style={{ background: 'linear-gradient(180deg,rgba(99,140,255,0.16) 0%,transparent 100%)', padding: '1px' }}
            className="rounded-[16px]">
            <div className="rounded-[15px] bg-[#0c0d10] px-[32px] py-[36px] relative overflow-hidden">
              {/* Top-edge highlight */}
              <div aria-hidden className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,140,255,0.5) 50%, transparent)' }} />
              {/* Ambient glow */}
              <div aria-hidden className="absolute -top-20 left-1/2 -translate-x-1/2 h-40 w-40 rounded-full"
                style={{ background: '#638cff', opacity: 0.06, filter: 'blur(55px)' }} />

              {/* Logo */}
              <div className="mb-8 flex justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#638cff]">
                  <Plane className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Header */}
              <div className="mb-8 text-center">
                <h1 className="text-[24px] font-[590] leading-[1.2] tracking-[-0.02em] text-[#f7f8f8]">
                  Sign in to continue
                </h1>
                <p className="mt-2 text-[13px] leading-[19.5px] text-[#8a8f98]">
                  {next.startsWith('/flights/check')
                    ? 'Save and manage your flight compensation claims.'
                    : 'Get the compensation you\'re owed for flight disruptions.'}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-5 flex items-start gap-2 rounded-[8px] border border-[rgba(255,122,122,0.2)] bg-[rgba(255,122,122,0.08)] px-3.5 py-3 text-[13px] leading-[19.5px] text-[#ff7a7a]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Google OAuth */}
              <button
                onClick={handleGoogle}
                disabled={googleBusy || status === 'loading'}
                className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-[#f7f8f8] px-4 py-[11px] text-[14px] font-[590] leading-[21px] text-[#08090a] transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {googleBusy
                  ? <Loader2 className="h-[18px] w-[18px] animate-spin text-[#08090a]/40" />
                  : <GoogleIcon />}
                <span>{googleBusy ? 'Redirecting to Google\u2026' : 'Continue with Google'}</span>
              </button>

              {/* Divider */}
              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/[0.06]" />
                <span className="text-[12px] text-[#8a8f98]">or</span>
                <div className="h-px flex-1 bg-white/[0.06]" />
              </div>

              {/* Magic link form */}
              {status === 'sent' ? (
                <div className="rounded-[10px] border border-[rgba(85,204,255,0.2)] bg-[rgba(85,204,255,0.08)] px-5 py-6 text-center">
                  <CheckCircle className="mx-auto mb-3 h-7 w-7 text-[#55ccff]" />
                  <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">Check your email</p>
                  <p className="mt-2 text-[13px] leading-[19.5px] text-[#8a8f98]">
                    We sent a sign-in link to<br />
                    <span className="text-[#f7f8f8]">{email}</span>
                  </p>
                  <button
                    onClick={() => { setStatus('idle'); setEmail('') }}
                    className="mt-4 text-[13px] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors"
                  >
                    Try a different email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleMagicLink} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8f98]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      autoComplete="email"
                      className="w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] py-[11px] pl-11 pr-4 text-[14px] leading-[21px] text-[#f7f8f8] placeholder:text-[#8a8f98] outline-none transition-colors focus:border-white/[0.16] focus:bg-[#13151a]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!email.trim() || status === 'loading'}
                    className="flex w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.08] bg-white/[0.05] py-[11px] text-[14px] font-[590] leading-[21px] text-[#f7f8f8] transition-colors hover:bg-white/[0.08] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {status === 'loading'
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending link\u2026</>
                      : 'Continue with email'}
                  </button>
                </form>
              )}

              {/* Fine print */}
              <p className="mt-8 text-center text-[12px] leading-relaxed text-[#8a8f98]">
                By signing in you agree to FlyBack&apos;s{' '}
                <Link href="/terms" className="text-[#8a8f98] underline underline-offset-2 hover:text-[#f7f8f8] transition-colors">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#8a8f98] underline underline-offset-2 hover:text-[#f7f8f8] transition-colors">Privacy Policy</Link>.
              </p>

            </div>
          </div>

        </div>
      </div>
    </main>
  )
}
