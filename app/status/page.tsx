'use client'

/**
 * /status — Claims dashboard with vertical timeline
 * Design system: Linear (linear.app)
 * Timeline style matches Linear's issue/project tracking aesthetic.
 */

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plane, ArrowRight, Plus, ChevronRight, FileText, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react'

const E = [0.25, 0.46, 0.45, 0.94] as const

function GText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'linear-gradient(135deg,#638cff 0%,#818fff 50%,#55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </span>
  )
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────

type ClaimStatus = 'resolved' | 'submitted' | 'drafting' | 'rejected' | 'pending'

const CLAIMS: {
  id: string; flight: string; route: string; date: string
  amount: number; status: ClaimStatus; airline: string; daysAgo: number
  events: { date: string; label: string; note?: string }[]
}[] = [
  {
    id: 'CLM-001', flight: 'KE 907', route: 'ICN → LHR', date: '2026-01-14',
    amount: 600, status: 'resolved', airline: 'Korean Air', daysAgo: 89,
    events: [
      { date: '2026-01-14', label: 'Flight delayed', note: '4h 12m at LHR' },
      { date: '2026-01-15', label: 'Claim letter generated' },
      { date: '2026-01-15', label: 'Submitted to airline' },
      { date: '2026-02-08', label: 'Airline acknowledged receipt' },
      { date: '2026-03-02', label: 'Compensation paid', note: '€600 · ₩900,000' },
    ],
  },
  {
    id: 'CLM-002', flight: 'BA 0007', route: 'LHR → ICN', date: '2026-02-22',
    amount: 600, status: 'submitted', airline: 'British Airways', daysAgo: 50,
    events: [
      { date: '2026-02-22', label: 'Flight cancelled' },
      { date: '2026-02-23', label: 'Claim letter generated' },
      { date: '2026-02-24', label: 'Submitted to airline' },
      { date: '2026-03-01', label: 'Awaiting response', note: 'No reply after 14 days — reminder sent' },
    ],
  },
  {
    id: 'CLM-003', flight: 'OZ 521', route: 'ICN → FRA', date: '2026-03-10',
    amount: 400, status: 'drafting', airline: 'Asiana Airlines', daysAgo: 34,
    events: [
      { date: '2026-03-10', label: 'Flight delayed', note: '3h 20m at FRA' },
      { date: '2026-03-11', label: 'Claim letter generated' },
    ],
  },
  {
    id: 'CLM-004', flight: 'LH 713', route: 'FRA → ICN', date: '2026-03-28',
    amount: 600, status: 'rejected', airline: 'Lufthansa', daysAgo: 16,
    events: [
      { date: '2026-03-28', label: 'Flight delayed', note: '4h 45m delay' },
      { date: '2026-03-29', label: 'Claim letter generated' },
      { date: '2026-03-30', label: 'Submitted to airline' },
      { date: '2026-04-05', label: 'Claim rejected', note: 'Airline cited extraordinary circumstances' },
      { date: '2026-04-06', label: 'NEB escalation letter generated' },
    ],
  },
]

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  resolved:  { label: 'Resolved',  color: '#55ccff', bg: 'rgba(85,204,255,0.10)',  icon: <CheckCircle className="h-3.5 w-3.5" /> },
  submitted: { label: 'Submitted', color: '#638cff', bg: 'rgba(99,140,255,0.10)',  icon: <Clock       className="h-3.5 w-3.5" /> },
  drafting:  { label: 'Drafting',  color: '#818fff', bg: 'rgba(129,143,255,0.10)', icon: <FileText    className="h-3.5 w-3.5" /> },
  rejected:  { label: 'Rejected',  color: '#ff7a7a', bg: 'rgba(255,122,122,0.10)', icon: <XCircle     className="h-3.5 w-3.5" /> },
  pending:   { label: 'Pending',   color: '#f0a040', bg: 'rgba(240,160,64,0.10)',  icon: <AlertCircle className="h-3.5 w-3.5" /> },
}

// ─── CLAIM ROW ────────────────────────────────────────────────────────────────

function ClaimRow({ claim, delay }: { claim: typeof CLAIMS[0]; delay: number }) {
  const [open, setOpen] = useState(false)
  const cfg = STATUS_CONFIG[claim.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: E }}
      className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] overflow-hidden"
    >
      {/* Header row */}
      <button
        className="flex w-full items-center gap-4 px-[28px] py-5 text-left hover:bg-white/[0.02] transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        {/* Route icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px]"
          style={{ background: `${cfg.color}14`, border: `1px solid ${cfg.color}24` }}>
          <Plane className="h-3.5 w-3.5" style={{ color: cfg.color }} />
        </div>

        {/* Flight + route */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{claim.flight}</span>
            <span className="text-[16px] leading-[24px] text-[#8a8f98]">{claim.route}</span>
            <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">· {claim.date}</span>
          </div>
          <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">{claim.airline}</span>
        </div>

        {/* Amount */}
        <div className="hidden text-right sm:block">
          <p className="font-mono text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">€{claim.amount}</p>
          <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{claim.daysAgo}d ago</p>
        </div>

        {/* Status badge */}
        <div className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-[590] leading-[19.5px]"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}28` }}>
          {cfg.icon}
          {cfg.label}
        </div>

        {/* Chevron */}
        <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.18 }} className="shrink-0">
          <ChevronRight className="h-4 w-4 text-[#8a8f98]" />
        </motion.div>
      </button>

      {/* Timeline */}
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.24, ease: E }}
          className="overflow-hidden border-t border-white/[0.05]"
        >
          <div className="px-[28px] py-5">
            {/* Vertical timeline */}
            <div className="relative pl-6">
              {/* Vertical line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />

              <div className="space-y-5">
                {claim.events.map((ev, i) => (
                  <div key={i} className="relative flex gap-4">
                    {/* Timeline dot */}
                    <div
                      className="absolute -left-6 flex h-[15px] w-[15px] items-center justify-center rounded-full border-[2px] border-[#0c0d10]"
                      style={{
                        background: i === claim.events.length - 1 ? cfg.color : '#2a2d35',
                        boxShadow: i === claim.events.length - 1 ? `0 0 8px ${cfg.color}60` : undefined,
                      }}
                    />
                    <div>
                      <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{ev.label}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">{ev.date}</span>
                        {ev.note && (
                          <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">· {ev.note}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Claim actions */}
            <div className="mt-5 flex flex-wrap gap-2 border-t border-white/[0.05] pt-5">
              {claim.status === 'drafting' && (
                <Link href={`/claim?flight=${claim.flight}&amount=${claim.amount}`}
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
                href={`/claim?flight=${encodeURIComponent(claim.flight.replace(/\s+/g,''))}&date=${claim.date}&amount=${claim.amount}`}
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

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function StatusPage() {
  const totalResolved = CLAIMS.filter(c => c.status === 'resolved').reduce((s, c) => s + c.amount, 0)
  const totalPending  = CLAIMS.filter(c => c.status !== 'resolved' && c.status !== 'rejected').reduce((s, c) => s + c.amount, 0)

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
          <Link href="/check"
            className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
            <Plus className="h-3.5 w-3.5" />New claim
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, ease: E }}
          className="mb-[28px]">
          <p className="text-[13px] leading-[19.5px] text-[#638cff]">Dashboard</p>
          <h1 className="mt-1 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em] text-[#f7f8f8]">
            My claims
          </h1>
        </motion.div>

        {/* Stats row */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.06, ease: E }}
          className="mb-[28px] grid gap-[28px] sm:grid-cols-3">
          {[
            { label: 'Resolved',      value: <><GText>€{totalResolved}</GText></>, sub: `${CLAIMS.filter(c=>c.status==='resolved').length} claim${CLAIMS.filter(c=>c.status==='resolved').length!==1?'s':''}` },
            { label: 'In progress',   value: <><GText>€{totalPending}</GText></>,  sub: `${CLAIMS.filter(c=>c.status!=='resolved'&&c.status!=='rejected').length} active` },
            { label: 'Total claims',  value: <span className="text-[#f7f8f8]">{CLAIMS.length}</span>, sub: 'All time' },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
              <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{label}</p>
              <p className="mt-1 font-mono text-[28px] font-bold leading-none tracking-[-0.02em]">{value}</p>
              <p className="mt-1 text-[13px] leading-[19.5px] text-[#8a8f98]">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* Claims list */}
        <div className="space-y-[28px]">
          {CLAIMS.map((c, i) => (
            <ClaimRow key={c.id} claim={c} delay={0.08 + i * 0.05} />
          ))}
        </div>

        {/* Empty state CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-[28px] text-center">
          <p className="mb-3 text-[16px] leading-[24px] text-[#8a8f98]">
            Have another delayed or cancelled flight?
          </p>
          <Link href="/check"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]">
            Check another flight <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
