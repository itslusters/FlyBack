'use client'

/**
 * FlyBack — Landing Page
 * Design system: Linear (linear.app)
 *
 * TOKEN REFERENCE (zero deviation):
 *   bg            #08090a
 *   text-primary  #f7f8f8   (token: text-muted)
 *   text-secondary #8a8f98  (token: text)
 *   primary       #638cff   Electric Blue
 *   secondary     #55ccff   Cyan Bright
 *   accent        #818fff   Lavender Blue
 *   radius lg=10px · xl=20px · full=30px
 *   spacing 2xs=28px · sm=88px · md=104px · lg=122px
 *   type  button=13px/19.5px/w400
 *         heading-3=20px/30px/w590
 *         body=16px/24px/w400
 *         link=14px/21px/w510
 *
 * CARD GRADIENT BORDER (Linear signature):
 *   outer: linear-gradient(180deg, rgba(99,140,255,0.18)→transparent) padding:1px
 *   inner: bg #0c0d10 + radial glow at top-center
 *   top edge: horizontal gradient highlight line
 */

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Plane, Search, Calendar, ArrowRight, ChevronDown,
  CheckCircle, Shield, Globe, Lock, Zap, Award,
  FileText, Briefcase, Building2, Heart, ArrowUpRight,
} from 'lucide-react'

const E = [0.25, 0.46, 0.45, 0.94] as const

// ─── LINEAR GRADIENT-BORDER CARD ─────────────────────────────────────────────
// Replicates linear.app's signature feature card treatment:
//   · 1px gradient border: bright at top-center, fades to transparent at bottom
//   · Horizontal top-edge highlight line
//   · Radial ambient glow inside (top-center)

function GlowCard({
  children,
  className = '',
  glowColor = '#638cff',
  glowOpacity = 0.07,
}: {
  children: React.ReactNode
  className?: string
  glowColor?: string
  glowOpacity?: number
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{
        background: `linear-gradient(180deg, rgba(99,140,255,0.16) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)`,
        padding: '1px',
      }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-[19px] bg-[#0c0d10]">
        {/* Top edge highlight — horizontal gradient line */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 0%, ${glowColor}55 30%, ${glowColor}88 50%, ${glowColor}55 70%, transparent 100%)` }}
        />
        {/* Ambient inner glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{
            width: '70%',
            height: '220px',
            marginTop: '-60px',
            background: glowColor,
            opacity: glowOpacity,
            filter: 'blur(55px)',
          }}
        />
        {children}
      </div>
    </div>
  )
}

// ─── REVEAL ───────────────────────────────────────────────────────────────────

function Reveal({ children, delay = 0, className = '' }: {
  children: React.ReactNode; delay?: number; className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.48, delay, ease: E }}
    >{children}</motion.div>
  )
}

// ─── GRADIENT TEXT ────────────────────────────────────────────────────────────
// Linear uses a blue→lavender→cyan gradient on accent words

function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      background: 'linear-gradient(135deg, #638cff 0%, #818fff 50%, #55ccff 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
    }}>
      {children}
    </span>
  )
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────

function SearchBar() {
  const router = useRouter()
  const [flight, setFlight] = useState('')
  const [date, setDate] = useState('')

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    console.log('[FlyBack] check →', { flight, date })
    const p = new URLSearchParams()
    if (flight.trim()) p.set('flight', flight.trim().toUpperCase())
    if (date) p.set('date', date)
    router.push(`/check${p.toString() ? '?' + p.toString() : ''}`)
  }

  return (
    <form onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0f1013] sm:flex-row"
      style={{ boxShadow: '0 0 0 1px rgba(99,140,255,0.08), 0 8px 32px rgba(0,0,0,0.4)' }}
    >
      <label className="flex flex-1 cursor-text items-center gap-[10px] border-b border-white/[0.05] px-4 py-3 sm:border-b-0 sm:border-r">
        <Search className="h-[14px] w-[14px] shrink-0 text-[#8a8f98]" />
        <input
          type="text" value={flight} onChange={e => setFlight(e.target.value)}
          placeholder="Flight — KE 907"
          className="w-full bg-transparent text-[16px] leading-[24px] text-[#f7f8f8] placeholder:text-[#8a8f98]/60 outline-none"
        />
      </label>
      <label className="flex cursor-text items-center gap-[10px] border-b border-white/[0.05] px-4 py-3 sm:w-[160px] sm:border-b-0 sm:border-r">
        <Calendar className="h-[14px] w-[14px] shrink-0 text-[#8a8f98]" />
        <input
          type="date" value={date} onChange={e => setDate(e.target.value)}
          className="w-full bg-transparent text-[16px] leading-[24px] text-[#f7f8f8]/60 outline-none [color-scheme:dark]"
        />
      </label>
      {/* button: 13px/19.5px/w400 */}
      <button type="submit"
        className="flex items-center justify-center gap-2 bg-[#638cff] px-5 py-3 text-[13px] leading-[19.5px] text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
      >
        Check eligibility
      </button>
    </form>
  )
}

// ─── MOCK UI — FLIGHT RESULT ──────────────────────────────────────────────────
// Linear-style product illustration: dark panel, thin borders, blue highlights

function MockFlight() {
  return (
    <div className="w-full select-none">
      {/* Browser-chrome frame */}
      <div
        className="overflow-hidden rounded-[10px] border border-white/[0.06]"
        style={{ background: '#08090a' }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.05] px-4 py-[10px]">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.12]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.08]" />
            <div className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-[6px] border border-white/[0.06] bg-white/[0.04] px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-[#638cff]/60" />
            <span className="text-[11px] text-[#8a8f98]">flyback.app/check</span>
          </div>
        </div>

        {/* App content */}
        <div className="p-5">
          {/* Status */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 ring-1 ring-emerald-500/20">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-[590] text-emerald-400">Eligible · EU261 Art.7</span>
            </div>
            <span className="font-mono text-[11px] text-[#8a8f98]">KE 907</span>
          </div>

          {/* Route */}
          <div className="mb-5 flex items-center gap-3">
            <div>
              <p className="font-mono text-[28px] font-bold leading-none text-[#f7f8f8]">ICN</p>
              <p className="mt-0.5 text-[11px] text-[#8a8f98]">Seoul</p>
            </div>
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(99,140,255,0.2) 0%, rgba(99,140,255,0.5) 50%, rgba(99,140,255,0.2) 100%)' }} />
              <div className="rounded-full bg-[#638cff] px-2 py-0.5">
                <Plane className="h-2.5 w-2.5 rotate-90 text-white" />
              </div>
              <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, rgba(99,140,255,0.2) 0%, rgba(99,140,255,0.5) 50%, rgba(99,140,255,0.2) 100%)' }} />
            </div>
            <div className="text-right">
              <p className="font-mono text-[28px] font-bold leading-none text-[#f7f8f8]">LHR</p>
              <p className="mt-0.5 text-[11px] text-[#8a8f98]">London</p>
            </div>
          </div>

          {/* Compensation amount */}
          <div
            className="rounded-[10px] p-4"
            style={{
              background: 'linear-gradient(135deg, rgba(99,140,255,0.10) 0%, rgba(129,143,255,0.06) 100%)',
              border: '1px solid rgba(99,140,255,0.15)',
            }}
          >
            <p className="mb-1 text-[11px] uppercase tracking-wide text-[#8a8f98]">Compensation</p>
            <div className="flex items-end gap-3">
              <p
                className="font-mono text-[48px] font-bold leading-none"
                style={{ background: 'linear-gradient(135deg, #638cff 0%, #818fff 60%, #55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
              >€600</p>
              <div className="pb-1">
                <p className="text-[12px] text-[#8a8f98]">≈ ₩900,000</p>
                <p className="text-[12px] text-[#8a8f98]">4h 12m delay · 9,012 km</p>
              </div>
            </div>
          </div>

          {/* Action row */}
          <div className="mt-4 flex gap-2">
            <button
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#638cff] py-2.5 text-[13px] leading-[19.5px] text-white"
            >Generate letter</button>
            <button
              className="flex items-center justify-center gap-1.5 rounded-[10px] border border-white/[0.08] px-4 py-2.5 text-[13px] leading-[19.5px] text-[#8a8f98] hover:text-[#f7f8f8]"
            >Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MOCK UI — CALCULATION ────────────────────────────────────────────────────

function MockCalc() {
  return (
    <div className="w-full select-none rounded-[10px] border border-white/[0.06] bg-[#08090a]">
      <div className="border-b border-white/[0.05] px-4 py-3">
        <p className="text-[13px] font-[590] text-[#f7f8f8]">EU261 calculation</p>
      </div>
      <div className="p-4 space-y-[1px]">
        {[
          { l: 'Distance', v: '9,012 km', accent: false },
          { l: 'Threshold', v: '> 3,500 km', accent: false },
          { l: 'Regulation', v: 'EU261', accent: false },
          { l: 'Article', v: '7(1)(c)', accent: false },
          { l: 'Delay', v: '4h 12m', accent: false },
        ].map(({ l, v }) => (
          <div key={l} className="flex items-center justify-between rounded-[6px] px-3 py-2 hover:bg-white/[0.02]">
            <span className="text-[13px] text-[#8a8f98]">{l}</span>
            <span className="font-mono text-[13px] text-[#f7f8f8]">{v}</span>
          </div>
        ))}
        <div
          className="mt-2 flex items-center justify-between rounded-[8px] px-3 py-3"
          style={{ background: 'linear-gradient(135deg, rgba(99,140,255,0.10) 0%, rgba(85,204,255,0.06) 100%)', border: '1px solid rgba(99,140,255,0.15)' }}
        >
          <span className="text-[13px] font-[590] text-[#f7f8f8]">Entitlement</span>
          <span
            className="font-mono text-[16px] font-[590]"
            style={{ background: 'linear-gradient(135deg, #638cff 0%, #55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >€600</span>
        </div>
      </div>
    </div>
  )
}

// ─── MOCK UI — CLAIM LETTER ───────────────────────────────────────────────────

function MockLetter() {
  return (
    <div className="w-full select-none rounded-[10px] border border-white/[0.06] bg-[#08090a]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-[#638cff]" />
          <p className="text-[13px] font-[590] text-[#f7f8f8]">Claim letter</p>
        </div>
        <span className="rounded-full bg-[#638cff]/10 px-2 py-0.5 text-[11px] text-[#638cff] ring-1 ring-[#638cff]/20">Ready</span>
      </div>
      <div className="space-y-2 p-4">
        {[
          { w: 'w-full', opacity: 'opacity-30' },
          { w: 'w-[90%]', opacity: 'opacity-20' },
          { w: 'w-[95%]', opacity: 'opacity-20' },
          { w: 'w-[70%]', opacity: 'opacity-15' },
        ].map(({ w, opacity }, i) => (
          <div key={i} className={`h-2 rounded-full bg-[#f7f8f8] ${w} ${opacity}`} />
        ))}
        <div className="pt-2 space-y-1">
          {[
            { w: 'w-full', opacity: 'opacity-25' },
            { w: 'w-[88%]', opacity: 'opacity-20' },
            { w: 'w-[92%]', opacity: 'opacity-20' },
            { w: 'w-[60%]', opacity: 'opacity-15' },
          ].map(({ w, opacity }, i) => (
            <div key={i} className={`h-1.5 rounded-full bg-[#f7f8f8] ${w} ${opacity}`} />
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <div className="flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[#638cff] py-2">
            <span className="text-[12px] text-white">Download PDF</span>
          </div>
          <div className="flex items-center justify-center rounded-[8px] border border-white/[0.08] px-4 py-2">
            <span className="text-[12px] text-[#8a8f98]">Copy</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MOCK UI — DASHBOARD TIMELINE ────────────────────────────────────────────

function MockDashboard() {
  const claims = [
    { id: 'BA 0007', route: 'ICN → LHR', amount: '€600', status: 'Submitted', color: '#638cff' },
    { id: 'KE 902',  route: 'ICN → CDG', amount: '€400', status: 'Resolved',  color: '#55ccff' },
    { id: 'OZ 521',  route: 'ICN → FRA', amount: '€250', status: 'Pending',   color: '#818fff' },
  ]
  return (
    <div className="w-full select-none rounded-[10px] border border-white/[0.06] bg-[#08090a]">
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <p className="text-[13px] font-[590] text-[#f7f8f8]">My claims</p>
        <p className="font-mono text-[13px] font-[590]"
          style={{ background: 'linear-gradient(90deg, #638cff 0%, #55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          €1,250 total
        </p>
      </div>
      <div className="p-2">
        {claims.map((c, i) => (
          <div key={c.id}
            className="flex items-center gap-3 rounded-[8px] px-3 py-2.5 transition-colors hover:bg-white/[0.03]"
          >
            {/* Timeline dot */}
            <div className="relative flex flex-col items-center">
              <div className="h-2 w-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}60` }} />
              {i < claims.length - 1 && (
                <div className="mt-1 h-6 w-px bg-white/[0.06]" />
              )}
            </div>
            <div className="flex flex-1 items-center justify-between">
              <div>
                <p className="font-mono text-[13px] font-[590] text-[#f7f8f8]">{c.id}</p>
                <p className="text-[11px] text-[#8a8f98]">{c.route}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[13px] font-[590] text-[#f7f8f8]">{c.amount}</p>
                <p className="text-[11px]" style={{ color: c.color }}>{c.status}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/[0.05]">
      <button onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        {/* heading-4: 16px/24px/w590 */}
        <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0">
          <ChevronDown className="h-4 w-4 text-[#8a8f98]" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="a"
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: E }}
            className="overflow-hidden"
          >
            {/* body: 16px/24px/w400 */}
            <p className="pb-5 text-[16px] leading-[24px] text-[#8a8f98]">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function Page() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">

      {/* ── NAV ──────────────────────────────────────────────────────────── */}
      {/* navigation: 16px/24px/w400 */}
      <header
        className="fixed top-0 z-30 w-full border-b border-white/[0.05]"
        style={{ background: 'rgba(8,9,10,0.85)', backdropFilter: 'blur(20px)' }}
      >
        <nav className="relative mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[14px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
              <Plane className="h-3 w-3 text-white" />
            </div>
            <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
          </Link>

          {/* Center links */}
          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-[28px] md:flex">
            {([['Features','#features'],['Compensation','#how'],['Security','#security'],['FAQ','#faq']] as [string,string][]).map(([l,h]) => (
              <li key={l}>
                <a href={h} className="text-[16px] leading-[24px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">{l}</a>
              </li>
            ))}
          </ul>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="hidden text-[16px] leading-[24px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8] sm:block"
            >Log in</Link>
            {/* Primary button: white bg, dark text — Linear convention */}
            <Link href="/check"
              className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] transition-opacity hover:opacity-90"
            >Get started</Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      {/* py-[122px] = spacing-lg */}
      <section className="relative overflow-hidden px-6 pb-[88px] pt-[calc(122px+56px)] text-center">

        {/* Ambient glow from center-top */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Central radial glow */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
            style={{ width: '640px', height: '400px', marginTop: '-100px', background: 'radial-gradient(ellipse at center, rgba(99,140,255,0.10) 0%, rgba(129,143,255,0.06) 40%, transparent 70%)', filter: 'blur(1px)' }}
          />
          {/* Thin vertical beam */}
          <div className="absolute left-1/2 top-0 w-px -translate-x-1/2"
            style={{ height: '300px', background: 'linear-gradient(180deg, rgba(99,140,255,0.5) 0%, transparent 100%)' }}
          />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '80px 80px' }}
          />
        </div>

        <div className="relative mx-auto flex max-w-[760px] flex-col items-center gap-[28px]">

          {/* Badge — radius-full: 30px */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.36 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-[14px] py-[6px]"
            style={{ boxShadow: '0 0 0 1px rgba(99,140,255,0.12)' }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-[#55ccff]" style={{ boxShadow: '0 0 6px #55ccff' }} />
            {/* button: 13px/19.5px */}
            <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">EU261 · UK261 · No win, no fee</span>
          </motion.div>

          {/* Hero heading — marketing scale, Inter w590 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.52, delay: 0.08, ease: E }}
            className="text-[72px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]"
          >
            Flight delayed?<br />
            <GradText>Get €600 back.</GradText>
          </motion.h1>

          {/* Sub — body: 16px/24px/w400 */}
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.16 }}
            className="max-w-[480px] text-[16px] leading-[24px] text-[#8a8f98]"
          >
            Enter your flight number. FlyBack calculates your EU261/UK261 entitlement in seconds
            and writes the compensation demand letter for you.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.24 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            {/* Primary: white bg — Linear convention */}
            <Link href="/check"
              className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#08090a] transition-opacity hover:opacity-88"
            >
              Check my flight <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            {/* Secondary: ghost */}
            <Link href="#features"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.1] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]"
            >
              See how it works
            </Link>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, delay: 0.32 }}
            className="w-full"
          >
            <SearchBar />
          </motion.div>

        </div>
      </section>

      {/* ── FEATURE SHOWCASE (Linear-style card grid) ─────────────────────── */}
      {/* py-[88px] = spacing-sm */}
      <section id="features" className="px-6 py-[88px]">
        <div className="mx-auto max-w-[1200px]">

          {/* Section label — heading-3: 20px/30px/w590 */}
          <Reveal className="mb-[28px] text-center">
            <p className="text-[13px] leading-[19.5px] text-[#638cff]">Product</p>
            <h2 className="mt-2 text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">
              Check. Calculate. Claim.
            </h2>
            <p className="mt-2 text-[16px] leading-[24px] text-[#8a8f98]">
              Three steps. No lawyers. No paperwork.
            </p>
          </Reveal>

          {/* Row 1: Large card + small card */}
          <div className="grid gap-[28px] lg:grid-cols-3">

            {/* Large card: Flight check (spans 2 cols) */}
            <Reveal className="lg:col-span-2" delay={0}>
              <GlowCard className="h-full" glowColor="#638cff" glowOpacity={0.06}>
                <div className="flex h-full flex-col p-[28px]">
                  <p className="mb-1 text-[13px] leading-[19.5px] text-[#638cff]">01</p>
                  {/* heading-4: 16px/24px/w590 */}
                  <h3 className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">
                    Instant eligibility check
                  </h3>
                  <p className="mb-[28px] text-[16px] leading-[24px] text-[#8a8f98]">
                    Haversine distance · EU261 Article 7 tiers · Results in 3 seconds
                  </p>
                  <div className="flex-1">
                    <MockFlight />
                  </div>
                </div>
              </GlowCard>
            </Reveal>

            {/* Small card: Legal calculation */}
            <Reveal delay={0.06}>
              <GlowCard className="h-full" glowColor="#818fff" glowOpacity={0.07}>
                <div className="flex h-full flex-col p-[28px]">
                  <p className="mb-1 text-[13px] leading-[19.5px] text-[#818fff]">02</p>
                  <h3 className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">
                    Exact legal calculation
                  </h3>
                  <p className="mb-[28px] text-[16px] leading-[24px] text-[#8a8f98]">
                    ≤1,500km→€250 · ≤3,500km→€400 · &gt;3,500km→€600
                  </p>
                  <div className="flex-1">
                    <MockCalc />
                  </div>
                </div>
              </GlowCard>
            </Reveal>

          </div>

          {/* Row 2: Two equal cards */}
          <div className="mt-[28px] grid gap-[28px] sm:grid-cols-2">

            <Reveal delay={0.04}>
              <GlowCard className="h-full" glowColor="#55ccff" glowOpacity={0.06}>
                <div className="flex h-full flex-col p-[28px]">
                  <p className="mb-1 text-[13px] leading-[19.5px] text-[#55ccff]">03</p>
                  <h3 className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">
                    Claim letter generated
                  </h3>
                  <p className="mb-[28px] text-[16px] leading-[24px] text-[#8a8f98]">
                    Legally-precise demand letter citing exact regulation article, distance, and delay duration.
                  </p>
                  <div className="flex-1">
                    <MockLetter />
                  </div>
                </div>
              </GlowCard>
            </Reveal>

            <Reveal delay={0.08}>
              <GlowCard className="h-full" glowColor="#638cff" glowOpacity={0.06}>
                <div className="flex h-full flex-col p-[28px]">
                  <p className="mb-1 text-[13px] leading-[19.5px] text-[#638cff]">04</p>
                  <h3 className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">
                    Track every claim
                  </h3>
                  <p className="mb-[28px] text-[16px] leading-[24px] text-[#8a8f98]">
                    Timeline dashboard. Status from Draft to Resolved. Reminders if no reply in 14 days.
                  </p>
                  <div className="flex-1">
                    <MockDashboard />
                  </div>
                </div>
              </GlowCard>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (3 steps) ────────────────────────────────────────── */}
      {/* py-[88px] = spacing-sm */}
      <section id="how" className="px-6 py-[88px]">
        <div className="mx-auto max-w-[1200px]">
          <Reveal className="mb-[28px] text-center">
            <p className="text-[13px] leading-[19.5px] text-[#638cff]">Process</p>
            <h2 className="mt-2 text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">
              Three steps to your compensation
            </h2>
          </Reveal>

          <div className="grid gap-[28px] md:grid-cols-3">
            {[
              { n: '01', color: '#638cff', title: 'Check eligibility',
                body: 'Enter flight number + date. FlyBack looks up delay data, computes great-circle distance, and applies EU261 Article 7 tiers — in under 3 seconds.' },
              { n: '02', color: '#818fff', title: 'Generate claim letter',
                body: 'FlyBack writes a legally-precise demand letter citing the exact regulation article, your route distance, and delay duration. Download as PDF or copy text.' },
              { n: '03', color: '#55ccff', title: 'Send and track',
                body: 'Submit to the airline via their web form or by email. Track status in your dashboard. Escalate to the NEB if rejected. Most airlines pay within 6–8 weeks.' },
            ].map(({ n, color, title, body }, i) => (
              <Reveal key={n} delay={i * 0.07}>
                <div className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
                  <div
                    className="mb-[28px] flex h-8 w-8 items-center justify-center rounded-[8px] text-[13px] font-[590]"
                    style={{ background: `${color}18`, color, border: `1px solid ${color}28` }}
                  >{n}</div>
                  <h3 className="mb-2 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</h3>
                  <p className="text-[16px] leading-[24px] text-[#8a8f98]">{body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPLIANCE (security section) ────────────────────────────────── */}
      {/* py-[104px] = spacing-md */}
      <section id="security" className="px-6 py-[104px]">
        <div className="mx-auto max-w-[1200px]">

          <Reveal className="mb-[28px]">
            <p className="text-[13px] leading-[19.5px] text-[#638cff]">Compliance</p>
            <h2 className="mt-2 text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">
              Built on primary legislation
            </h2>
            <p className="mt-2 max-w-[480px] text-[16px] leading-[24px] text-[#8a8f98]">
              FlyBack references regulation text directly — no intermediary interpretation. Your rights come from the law itself.
            </p>
          </Reveal>

          <div className="grid gap-[28px] sm:grid-cols-2 lg:grid-cols-3">
            {([
              [<Shield className="h-4 w-4" key="s" />, '#638cff', 'EU Regulation 261/2004',
               'Articles 5, 6, and 7 — delays, cancellations, and denied boarding. Full coverage.'],
              [<Globe  className="h-4 w-4" key="g" />, '#818fff', 'UK Regulation 261/2004',
               'Post-Brexit retained law. Applies to all flights departing UK airports.'],
              [<Lock   className="h-4 w-4" key="l" />, '#55ccff', 'No data retention',
               'Flight check data is session-only. Nothing is stored server-side.'],
              [<Zap    className="h-4 w-4" key="z" />, '#638cff', 'Haversine accuracy',
               'IATA airport coordinates. Great-circle distance, not scheduled route data.'],
              [<Award  className="h-4 w-4" key="a" />, '#818fff', 'No win, no fee',
               'Eligibility checking is free. Claim letter generation requires a $10/month subscription.'],
              [<FileText className="h-4 w-4" key="f" />, '#55ccff', 'Passenger rights only',
               'We generate letters. We are not a law firm and do not provide legal advice.'],
            ] as [React.ReactNode, string, string, string][]).map(([icon, color, title, desc]) => (
              <Reveal key={title}>
                <div className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
                  <div
                    className="mb-[28px] flex h-8 w-8 items-center justify-center rounded-[8px]"
                    style={{ background: `${color}14`, color, border: `1px solid ${color}24` }}
                  >{icon}</div>
                  {/* heading-4: 16px/24px/w590 */}
                  <h3 className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</h3>
                  {/* body: 16px/24px/w400 */}
                  <p className="text-[16px] leading-[24px] text-[#8a8f98]">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHO IT'S FOR ─────────────────────────────────────────────────── */}
      <section className="px-6 py-[88px]">
        <div className="mx-auto max-w-[1200px]">
          <Reveal className="mb-[28px] text-center">
            <p className="text-[13px] leading-[19.5px] text-[#638cff]">Use cases</p>
            <h2 className="mt-2 text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">
              Built for every traveler
            </h2>
          </Reveal>

          <div className="grid gap-[28px] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Plane className="h-4 w-4" />, color: '#638cff', title: 'Frequent Flyers',
                bullets: ['Check all past flights instantly', 'Track multiple open claims', 'Unlimited checks per month'] },
              { icon: <Briefcase className="h-4 w-4" />, color: '#818fff', title: 'Business Travelers',
                bullets: ['Separate work and personal claims', 'Export summaries for expenses', 'CSV bulk-check for teams'] },
              { icon: <Building2 className="h-4 w-4" />, color: '#55ccff', title: 'Travel Agencies',
                bullets: ['Bulk lookups at scale', 'White-label claim letters', 'API access for booking systems'] },
              { icon: <Heart className="h-4 w-4" />, color: '#638cff', title: 'Families',
                bullets: ['Check all passengers at once', 'Each person: independent claim', 'Family of 4 → up to €2,400'] },
            ].map(({ icon, color, title, bullets }, i) => (
              <Reveal key={title} delay={i * 0.05}>
                <div className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
                  <div className="mb-[28px] flex h-8 w-8 items-center justify-center rounded-[8px]"
                    style={{ background: `${color}14`, color, border: `1px solid ${color}24` }}
                  >{icon}</div>
                  <h3 className="mb-3 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</h3>
                  <ul className="space-y-2">
                    {bullets.map(b => (
                      <li key={b} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color }} />
                        <span className="text-[16px] leading-[24px] text-[#8a8f98]">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      {/* py-[104px] = spacing-md */}
      <section id="faq" className="px-6 py-[104px]">
        <div className="mx-auto max-w-[720px]">
          <Reveal className="mb-[28px] text-center">
            <p className="text-[13px] leading-[19.5px] text-[#638cff]">FAQ</p>
            <h2 className="mt-2 text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">Common questions</h2>
          </Reveal>
          {([
            ['Does EU261 apply to my flight?',
             'EU261 covers all flights departing EU airports (any airline), and arrivals at EU airports on EU-based carriers. UK261 covers UK departures post-Brexit. ICN→LHR on Korean Air: UK261 applies to the LHR→ICN return leg.'],
            ['What delay qualifies for compensation?',
             'A delay of 3+ hours at your final destination. The clock runs from when the aircraft door opens — not the scheduled arrival time.'],
            ["Can airlines refuse to pay?",
             'Yes, via "extraordinary circumstances" (severe weather, political instability). Technical faults do NOT qualify. Escalate rejected claims to the National Enforcement Body of the departure country.'],
            ['Do I need a lawyer?',
             'No. Your claim letter cites the regulation text directly. Most airlines process EU261 claims through a standard web form. No legal representation is needed.'],
            ['What is the claiming deadline?',
             'UK: 6 years. Most EU states: 2–3 years. Check the national limitation period of the flight departure country.'],
            ['How much does FlyBack cost?',
             'Eligibility checking is always free. Generating the claim letter requires a $10/month subscription. Cancel any time.'],
          ] as [string,string][]).map(([q,a]) => <Faq key={q} q={q} a={a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ────────────────────────────────────────────────────── */}
      {/* py-[122px] = spacing-lg */}
      <section className="relative overflow-hidden px-6 py-[122px] text-center">
        {/* Ambient glow */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: '600px', height: '400px', background: 'radial-gradient(ellipse at center, rgba(99,140,255,0.09) 0%, rgba(129,143,255,0.05) 40%, transparent 70%)' }}
          />
        </div>
        <div className="relative mx-auto flex max-w-[540px] flex-col items-center gap-[28px]">
          <Reveal>
            <h2 className="text-[48px] font-[590] leading-[1.08] tracking-[-0.02em] text-[#f7f8f8]">
              Start claiming<br />
              <GradText>what you&apos;re owed.</GradText>
            </h2>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-[16px] leading-[24px] text-[#8a8f98]">
              Enter your flight number. 30 seconds to know if you&apos;re owed up to €600.
            </p>
          </Reveal>
          <Reveal delay={0.14} className="flex flex-wrap justify-center gap-3">
            <Link href="/check"
              className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#08090a] transition-opacity hover:opacity-90"
            >Check my flight <ArrowRight className="h-3.5 w-3.5" /></Link>
            <Link href="/login"
              className="flex items-center gap-1.5 rounded-full border border-white/[0.1] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]"
            >Sign in</Link>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      {/* py-[88px] = spacing-sm */}
      <footer className="border-t border-white/[0.05] px-6 py-[88px]">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-[28px] grid gap-[28px] sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/" className="mb-[28px] flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-[5px] bg-[#638cff]">
                  <Plane className="h-2.5 w-2.5 text-white" />
                </div>
                <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
              </Link>
              <p className="max-w-[240px] text-[16px] leading-[24px] text-[#8a8f98]">
                EU261/UK261 compensation. Check, calculate, claim.
              </p>
            </div>
            {[
              { title: 'Product', links: [
                { label: 'Flight check',   href: '/check'   },
                { label: 'My claims',      href: '/status'  },
                { label: 'Pricing',        href: '/pricing' },
                { label: 'Changelog',      href: '#'        },
              ]},
              { title: 'Travelers', links: [
                { label: 'Frequent flyers', href: '/frequent-flyers' },
                { label: 'Business',        href: '/business'        },
                { label: 'Families',        href: '/families'        },
                { label: 'Agencies',        href: '/agencies'        },
              ]},
              { title: 'Legal', links: [
                { label: 'Privacy policy', href: '/privacy' },
                { label: 'Terms',          href: '/terms'   },
                { label: 'EU261 text',     href: '/eu261'   },
                { label: 'UK261 text',     href: '/uk261'   },
              ]},
            ].map(col => (
              <div key={col.title}>
                <p className="mb-[28px] text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map(l => (
                    <li key={l.label}>
                      <Link href={l.href} className="text-[14px] font-[510] leading-[21px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.05] pt-[28px]">
            <p className="text-[16px] leading-[24px] text-[#8a8f98]">© 2026 FlyBack. Not a law firm.</p>
            <p className="text-[16px] leading-[24px] text-[#8a8f98]">EU261 · UK261 · Passenger rights</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
