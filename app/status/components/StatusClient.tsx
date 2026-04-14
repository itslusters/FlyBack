'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Plane, ArrowRight, Plus, ChevronRight,
  FileText, CheckCircle, Clock, AlertCircle, XCircle,
} from 'lucide-react'

const E = [0.25, 0.46, 0.45, 0.94] as const

function GText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'linear-gradient(135deg,#638cff 0%,#818fff 50%,#55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </span>
  )
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ClaimStatus = 'resolved' | 'submitted' | 'drafting' | 'rejected' | 'pending' | 'paid'

interface Claim {
  id: string
  flight_number:        string | null
  flight_date:          string | null
  origin:               string | null
  destination:          string | null
  compensation_amount:  number | null
  status:               string | null
  airline?:             string | null
  created_at:           string
  paid_at?:             string | null
  passenger_name?:      string | null
  passenger_email?:     string | null
  delay_minutes?:       number | null
  cancelled?:           boolean | null
}

// ─── STATUS CONFIG ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  resolved:  { label: 'Resolved',  color: '#55ccff', bg: 'rgba(85,204,255,0.10)',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  paid:      { label: 'Paid',      color: '#55ccff', bg: 'rgba(85,204,255,0.10)',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  submitted: { label: 'Submitted', color: '#638cff', bg: 'rgba(99,140,255,0.10)',  icon: <Clock       className="h-3.5 w-3.5" /> },
  drafting:  { label: 'Drafting',  color: '#818fff', bg: 'rgba(129,143,255,0.10)', icon: <FileText    className="h-3.5 w-3.5" /> },
  rejected:  { label: 'Rejected',  color: '#ff7a7a', bg: 'rgba(255,122,122,0.10)', icon: <XCircle     className="h-3.5 w-3.5" /> },
  pending:   { label: 'Pending',   color: '#f0a040', bg: 'rgba(240,160,64,0.10)',  icon: <AlertCircle className="h-3.5 w-3.5" /> },
}

function statusCfg(status: string | null) {
  return STATUS_CONFIG[status ?? 'pending'] ?? STATUS_CONFIG['pending']
}

// ─── CLAIM ROW ─────────────────────────────────────────────────────────────────

function ClaimRow({ claim, delay }: { claim: Claim; delay: number }) {
  const [open, setOpen] = useState(false)
  const cfg = statusCfg(claim.status)

  const flight = claim.flight_number ?? '—'
  const route  = claim.origin && claim.destination
    ? `${claim.origin} → ${claim.destination}`
    : '—'
  const date   = claim.flight_date ?? claim.created_at?.split('T')[0] ?? '—'
  const amount = claim.compensation_amount ?? 0
  const daysAgo = Math.floor(
    (Date.now() - new Date(claim.created_at).getTime()) / 86_400_000
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: E }}
      className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] overflow-hidden"
    >
      <button
        className="flex w-full items-center gap-4 px-[28px] py-5 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
          style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}24` }}>
          <Plane className="h-3.5 w-3.5" style={{ color: cfg.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{flight}</span>
            <span className="text-[16px] leading-[24px] text-[#8a8f98]">{route}</span>
            <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">· {date}</span>
          </div>
          {claim.passenger_name && (
            <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">{claim.passenger_name}</span>
          )}
        </div>

        <div className="hidden text-right sm:block">
          <p className="font-mono text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">€{amount}</p>
          <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{daysAgo}d ago</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-[590] leading-[19.5px]"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}28` }}>
          {cfg.icon}
          {cfg.label}
        </div>

        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="shrink-0">
          <ChevronRight className="h-4 w-4 text-[#8a8f98]" />
        </motion.div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.24, ease: E }}
          className="overflow-hidden border-t border-white/[0.05]"
        >
          <div className="px-[28px] py-5">
            {/* 상세 정보 */}
            <dl className="mb-5 grid grid-cols-2 gap-x-8 gap-y-3 text-[13px] sm:grid-cols-3">
              {claim.delay_minutes != null && claim.delay_minutes > 0 && (
                <>
                  <dt className="text-[#8a8f98]">Delay</dt>
                  <dd className="text-[#f7f8f8]">{Math.floor(claim.delay_minutes / 60)}h {claim.delay_minutes % 60}m</dd>
                </>
              )}
              {claim.cancelled && (
                <>
                  <dt className="text-[#8a8f98]">Type</dt>
                  <dd className="text-[#f7f8f8]">Cancellation</dd>
                </>
              )}
              {claim.passenger_email && (
                <>
                  <dt className="text-[#8a8f98]">Email</dt>
                  <dd className="truncate text-[#f7f8f8]">{claim.passenger_email}</dd>
                </>
              )}
              {claim.paid_at && (
                <>
                  <dt className="text-[#8a8f98]">Paid at</dt>
                  <dd className="text-[#f7f8f8]">{claim.paid_at.split('T')[0]}</dd>
                </>
              )}
            </dl>

            {/* 액션 */}
            <div className="flex flex-wrap gap-2 border-t border-white/[0.05] pt-5">
              {(claim.status === 'drafting' || claim.status === 'pending') && (
                <Link
                  href={`/claim?flight=${encodeURIComponent(flight)}&date=${date}&amount=${amount}`}
                  className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[14px] py-[7px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
                  <FileText className="h-3.5 w-3.5" />Continue claim
                </Link>
              )}
              {claim.status === 'rejected' && (
                <button className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[14px] py-[7px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
                  <ArrowRight className="h-3.5 w-3.5" />Generate NEB letter
                </button>
              )}
              <Link
                href={`/claim?flight=${encodeURIComponent(flight.replace(/\s+/g,''))}&date=${date}&amount=${amount}`}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-[14px] py-[7px] text-[13px] leading-[19.5px] text-[#8a8f98] hover:border-white/[0.16] hover:text-[#f7f8f8]">
                <FileText className="h-3.5 w-3.5" />View letter
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── PAGE CLIENT ──────────────────────────────────────────────────────────────

interface Props {
  claims:    Claim[]
  userEmail: string
}

export default function StatusClient({ claims, userEmail }: Props) {
  const resolved  = claims.filter(c => c.status === 'resolved' || c.status === 'paid')
  const active    = claims.filter(c => c.status !== 'resolved' && c.status !== 'rejected' && c.status !== 'paid')
  const totalResolved = resolved.reduce((s, c) => s + (c.compensation_amount ?? 0), 0)
  const totalPending  = active.reduce((s, c)  => s + (c.compensation_amount ?? 0), 0)

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">

      {/* Nav */}
      <header className="border-b border-white/[0.05]" style={{ background: 'rgba(8,9,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[14px]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
              <Plane className="h-3 w-3 text-white" />
            </div>
            <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-[13px] text-[#8a8f98] sm:block">{userEmail}</span>
            <Link href="/check"
              className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
              <Plus className="h-3.5 w-3.5" />New claim
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, ease: E }}
          className="mb-[28px]">
          <p className="text-[13px] leading-[19.5px] text-[#638cff]">Dashboard</p>
          <h1 className="mt-1 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em] text-[#f7f8f8]">
            My claims
          </h1>
        </motion.div>

        {/* 통계 */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06, ease: E }}
          className="mb-[28px] grid gap-[28px] sm:grid-cols-3">
          {[
            { label: 'Resolved',     value: <GText>€{totalResolved}</GText>, sub: `${resolved.length} claim${resolved.length !== 1 ? 's' : ''}` },
            { label: 'In progress',  value: <GText>€{totalPending}</GText>,  sub: `${active.length} active` },
            { label: 'Total claims', value: <span className="text-[#f7f8f8]">{claims.length}</span>, sub: 'All time' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
              <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{label}</p>
              <p className="mt-1 font-mono text-[28px] font-bold leading-none tracking-[-0.02em]">{value}</p>
              <p className="mt-1 text-[13px] leading-[19.5px] text-[#8a8f98]">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* 클레임 목록 */}
        {claims.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] px-[28px] py-[48px] text-center">
            <Plane className="mx-auto mb-4 h-8 w-8 text-[#8a8f98]" />
            <p className="text-[16px] font-[590] text-[#f7f8f8]">No claims yet</p>
            <p className="mt-2 text-[13px] text-[#8a8f98]">Had a delayed or cancelled flight? Start your claim now.</p>
            <Link href="/check"
              className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[18px] py-[9px] text-[13px] text-[#08090a] hover:opacity-90">
              Check a flight <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-[28px]">
            {claims.map((c, i) => (
              <ClaimRow key={c.id} claim={c} delay={0.08 + i * 0.05} />
            ))}
          </div>
        )}

        {claims.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="mt-[28px] text-center">
            <Link href="/check"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]">
              Check another flight <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        )}

      </main>
    </div>
  )
}
