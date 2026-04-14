'use client'

/**
 * /check — Flight result page
 * Fetches real data from /api/flight (Aviationstack proxy).
 * Falls back to a "not found" state if the flight is unavailable.
 */

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plane, ArrowRight, Shield, AlertTriangle, FileText, CheckCircle, Loader2, Search, PenLine, X, Calendar, Edit2 } from 'lucide-react'
import BoardingPass from '../components/BoardingPass'
import type { FlightResult } from '../api/flight/route'

const E = [0.25, 0.46, 0.45, 0.94] as const

// ─── GLOW CARD ────────────────────────────────────────────────────────────────

function GlowCard({ children, className = '', color = '#638cff' }: { children: React.ReactNode; className?: string; color?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[20px] ${className}`}
      style={{ background: `linear-gradient(180deg,rgba(99,140,255,0.14) 0%,rgba(255,255,255,0.03) 100%)`, padding: '1px' }}>
      <div className="relative h-full w-full overflow-hidden rounded-[19px] bg-[#0c0d10]">
        <div aria-hidden className="absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg,transparent 0%,${color}66 50%,transparent 100%)` }} />
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
          style={{ width: '60%', height: '180px', marginTop: '-50px', background: color, opacity: 0.06, filter: 'blur(50px)' }} />
        {children}
      </div>
    </div>
  )
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDelay(min: number) {
  if (min <= 0) return '0m'
  const h = Math.floor(min / 60), m = min % 60
  return h > 0 ? `${h}h ${m > 0 ? `${m}m` : ''}`.trim() : `${m}m`
}

// ─── NAV WITH INLINE FLIGHT EDITOR ───────────────────────────────────────────

function Nav({ iata, date }: { iata: string; date: string }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [newIata, setNewIata] = useState(iata)
  const [newDate, setNewDate] = useState(date)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const f = newIata.trim().toUpperCase().replace(/\s+/g, '')
    if (!f) return
    setEditing(false)
    router.push(`/check?flight=${encodeURIComponent(f)}&date=${encodeURIComponent(newDate)}`)
  }

  function cancel() {
    setNewIata(iata)
    setNewDate(date)
    setEditing(false)
  }

  return (
    <header className="border-b border-white/[0.05]" style={{ background: 'rgba(8,9,10,0.9)', backdropFilter: 'blur(20px)' }}>
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-6 py-[14px]">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
            <Plane className="h-3 w-3 text-white" />
          </div>
          <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
        </Link>

        {/* Flight chip / inline editor */}
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.form key="edit" onSubmit={submit}
              initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="flex flex-1 max-w-[400px] items-center gap-2 rounded-[8px] border border-[rgba(99,140,255,0.35)] bg-[#0f1013] px-3 py-[7px]">
              <Search className="h-3.5 w-3.5 shrink-0 text-[#638cff]" />
              <input
                autoFocus
                value={newIata}
                onChange={e => setNewIata(e.target.value.toUpperCase())}
                placeholder="KE907"
                maxLength={8}
                className="w-[72px] bg-transparent font-mono text-[14px] text-[#f7f8f8] placeholder:text-[#8a8f98]/50 outline-none"
              />
              <span className="text-[#8a8f98]/40">·</span>
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#8a8f98]" />
              <input
                type="date"
                value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="flex-1 bg-transparent text-[14px] text-[#f7f8f8] outline-none [color-scheme:dark]"
              />
              <button type="submit"
                className="rounded-[6px] bg-[#638cff] px-2.5 py-1 text-[12px] font-[590] text-white hover:opacity-90">
                Go
              </button>
              <button type="button" onClick={cancel} className="text-[#8a8f98] hover:text-[#f7f8f8]">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.form>
          ) : (
            <motion.button key="chip" onClick={() => setEditing(true)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="group flex items-center gap-2 rounded-[8px] border border-white/[0.07] bg-white/[0.03] px-3 py-[7px] transition-colors hover:border-white/[0.14] hover:bg-white/[0.05]">
              <span className="font-mono text-[14px] font-[590] text-[#f7f8f8]">{iata.toUpperCase()}</span>
              <span className="text-[#8a8f98]/40">·</span>
              <span className="text-[13px] text-[#8a8f98]">{date}</span>
              <Edit2 className="h-3 w-3 text-[#8a8f98] opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.button>
          )}
        </AnimatePresence>

        <Link href="/status"
          className="shrink-0 text-[14px] font-[510] leading-[21px] text-[#8a8f98] transition-colors hover:text-[#f7f8f8]">
          My claims
        </Link>
      </nav>
    </header>
  )
}

// ─── AIRPORT COORDS + EU261 (manual fallback) ────────────────────────────────

const AP_COORDS: Record<string, { lat: number; lon: number; city: string }> = {
  ICN:{lat:37.4691,lon:126.4510,city:'Seoul'},LHR:{lat:51.4706,lon:-0.4619,city:'London'},
  CDG:{lat:49.0097,lon:2.5479,city:'Paris'},FRA:{lat:50.0379,lon:8.5622,city:'Frankfurt'},
  AMS:{lat:52.3086,lon:4.7639,city:'Amsterdam'},JFK:{lat:40.6413,lon:-73.7781,city:'New York'},
  SIN:{lat:1.3644,lon:103.9915,city:'Singapore'},DXB:{lat:25.2532,lon:55.3657,city:'Dubai'},
  NRT:{lat:35.7647,lon:140.3864,city:'Tokyo'},HKG:{lat:22.3080,lon:113.9185,city:'Hong Kong'},
  LAX:{lat:33.9425,lon:-118.4081,city:'Los Angeles'},ORD:{lat:41.9742,lon:-87.9073,city:'Chicago'},
  MAD:{lat:40.4936,lon:-3.5668,city:'Madrid'},FCO:{lat:41.8003,lon:12.2389,city:'Rome'},
  MUC:{lat:48.3537,lon:11.7750,city:'Munich'},BKK:{lat:13.6900,lon:100.7501,city:'Bangkok'},
  GMP:{lat:37.5585,lon:126.7942,city:'Seoul'},LGW:{lat:51.1537,lon:-0.1821,city:'London'},
}

function calcKm(o: string, d: string) {
  const a = AP_COORDS[o], b = AP_COORDS[d]
  if (!a || !b) return 0
  const R = 6371, r = Math.PI / 180
  const dL = (b.lat - a.lat) * r, dO = (b.lon - a.lon) * r
  const x = Math.sin(dL/2)**2 + Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dO/2)**2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x)))
}

function eu261Tier(km: number) {
  if (km <= 1500) return { amount: 250, label: '≤ 1,500 km' }
  if (km <= 3500) return { amount: 400, label: '1,500–3,500 km' }
  return { amount: 600, label: '> 3,500 km' }
}

// ─── MANUAL ENTRY FORM ────────────────────────────────────────────────────────

function ManualEntry({ iata, date }: { iata: string; date: string }) {
  const [form, setForm] = useState({ origin: '', dest: '', delayMin: '', cancelled: false })
  const [result, setResult] = useState<{ km: number; amount: number; label: string; eligible: boolean; delayMin: number } | null>(null)

  function set(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  function calculate(e: React.FormEvent) {
    e.preventDefault()
    const km = calcKm(form.origin.toUpperCase(), form.dest.toUpperCase())
    const { amount, label } = eu261Tier(km > 0 ? km : 9000)
    const delayMin = parseInt(form.delayMin) || 0
    const eligible = form.cancelled || delayMin >= 180
    setResult({ km, amount, label, eligible, delayMin })
  }

  const INPUT = 'w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-[11px] text-[14px] text-[#f7f8f8] placeholder:text-[#8a8f98] outline-none focus:border-white/[0.2] uppercase'

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <Nav iata={iata} date={date} />
      <main className="mx-auto max-w-[560px] px-6 py-[88px]">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[10px] bg-[rgba(99,140,255,0.1)]">
            <PenLine className="h-5 w-5 text-[#638cff]" />
          </div>
          <h1 className="text-[28px] font-[590] leading-[1.1] tracking-[-0.02em] text-[#f7f8f8]">
            Enter flight details manually
          </h1>
          <p className="mt-2 text-[14px] leading-[21px] text-[#8a8f98]">
            <span className="font-mono text-[#f7f8f8]">{iata.toUpperCase()}</span> on {fmtDate(date)} wasn&apos;t found in live data.
            Enter the details below to calculate your EU261 entitlement.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={calculate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[12px] text-[#8a8f98]">Origin IATA</label>
              <input className={INPUT} placeholder="ICN" maxLength={3}
                value={form.origin} onChange={e => set('origin', e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] text-[#8a8f98]">Destination IATA</label>
              <input className={INPUT} placeholder="LHR" maxLength={3}
                value={form.dest} onChange={e => set('dest', e.target.value)} required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] text-[#8a8f98]">Arrival delay (minutes)</label>
            <input className={INPUT + ' normal-case'} type="number" min={0} placeholder="e.g. 210"
              value={form.delayMin} onChange={e => set('delayMin', e.target.value)} />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-[11px]">
            <input type="checkbox" checked={form.cancelled} onChange={e => set('cancelled', e.target.checked)}
              className="h-4 w-4 accent-[#638cff]" />
            <span className="text-[14px] text-[#8a8f98]">Flight was cancelled</span>
          </label>

          <button type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#f7f8f8] py-[13px] text-[14px] font-[590] text-[#08090a] hover:opacity-90">
            Calculate compensation <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Result */}
        {result && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="mt-6 rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[24px]">

            <div className="mb-4 flex flex-wrap items-center gap-3">
              {result.eligible
                ? <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[13px] font-[590] text-emerald-400 ring-1 ring-emerald-500/20">
                    <CheckCircle className="h-3.5 w-3.5" />Eligible for compensation
                  </span>
                : <span className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[13px] font-[590] text-amber-400 ring-1 ring-amber-500/20">
                    <AlertTriangle className="h-3.5 w-3.5" />Not eligible — below 3h threshold
                  </span>
              }
            </div>

            <p className="font-mono text-[56px] font-bold leading-none tracking-[-0.025em]"
              style={{ background: 'linear-gradient(135deg,#638cff,#818fff,#55ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              €{result.amount}
            </p>
            <p className="mt-1 text-[13px] text-[#8a8f98]">≈ ₩{(result.amount * 1500).toLocaleString()}</p>

            <div className="mt-4 space-y-1.5">
              {[
                ['Distance', result.km > 0 ? `${result.km.toLocaleString()} km` : 'Unknown (max tier applied)'],
                ['Tier',     result.label],
                ['Delay',    form.cancelled ? 'Cancelled' : `${result.delayMin}m`],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3 text-[13px]">
                  <span className="w-20 text-[#8a8f98]">{l}</span>
                  <span className="font-mono text-[#f7f8f8]">{v}</span>
                </div>
              ))}
            </div>

            {result.eligible && (
              <div className="mt-5 flex gap-3 border-t border-white/[0.05] pt-5">
                <Link href={`/claim?flight=${iata}&date=${date}&amount=${result.amount}`}
                  className="flex items-center gap-1.5 rounded-full bg-[#f7f8f8] px-[16px] py-[8px] text-[13px] font-[590] text-[#08090a] hover:opacity-90">
                  <FileText className="h-3.5 w-3.5" />Generate claim letter
                </Link>
              </div>
            )}
          </motion.div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-[13px] text-[#8a8f98] hover:text-[#f7f8f8]">← Try another flight</Link>
        </div>
      </main>
    </div>
  )
}

// ─── RESULT ───────────────────────────────────────────────────────────────────

function ResultInner() {
  const params  = useSearchParams()
  const iata    = params.get('flight') ?? 'KE907'
  const date    = params.get('date')   ?? new Date().toISOString().slice(0, 10)

  const [flight,  setFlight]  = useState<FlightResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/flight?iata=${encodeURIComponent(iata)}&date=${encodeURIComponent(date)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        setFlight(data as FlightResult)
      })
      .catch(e => setError(String(e.message ?? 'Unknown error')))
      .finally(() => setLoading(false))
  }, [iata, date])

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
        <Nav iata={iata} date={date} />
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-7 w-7 animate-spin text-[#638cff]" />
          <p className="text-[16px] leading-[24px] text-[#8a8f98]">Checking {iata.toUpperCase()}…</p>
        </div>
      </div>
    )
  }

  // ── Error / not found → show manual entry form ──
  if (error || !flight) {
    return <ManualEntry iata={iata} date={date} />
  }

  // ── Success ──
  const { origin, destination, originCity, destCity, gate, delayMin,
          cancelled, km, compensation, tierLabel, eligible, airline, status } = flight

  const krw = Math.round(compensation * 1500)
  const cp  = new URLSearchParams({ flight: iata, date, amount: String(compensation) })
  const dH  = Math.floor(delayMin / 60), dM = delayMin % 60

  const legalDelayBody = cancelled
    ? 'Cancellations entitle passengers to full Article 7 compensation unless the airline gave 14+ days notice.'
    : `A ${fmtDelay(delayMin)} delay exceeds the 3-hour threshold required for Article 7 compensation.`

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <Nav iata={iata} date={date} />

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">

        {/* ── Boarding pass + compensation ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, ease: E }}
          className="mb-[28px]">

          <BoardingPass
            date={fmtDate(date)}
            flight={iata.toUpperCase()}
            origin={origin}
            destination={destination}
            originCity={originCity}
            destCity={destCity}
            gate={gate}
            className="mb-[28px]"
          />

          {/* Compensation strip */}
          <div className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] px-[28px] py-[24px]">
            <div className="flex flex-wrap items-center justify-between gap-[28px]">

              {/* Status badge + amount */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  {eligible
                    ? <span className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[13px] font-[590] text-emerald-400 ring-1 ring-emerald-500/20">
                        <CheckCircle className="h-3.5 w-3.5" />Eligible for compensation
                      </span>
                    : <span className="flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[13px] font-[590] text-amber-400 ring-1 ring-amber-500/20">
                        <AlertTriangle className="h-3.5 w-3.5" />Below 3h threshold
                      </span>
                  }
                  <span className="text-[13px] leading-[19.5px] text-[#8a8f98]">EU261 Art.7</span>
                </div>
                <p className="font-mono text-[72px] font-bold leading-none tracking-[-0.025em]"
                  style={{ background: 'linear-gradient(135deg,#638cff 0%,#818fff 50%,#55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  €{compensation}
                </p>
                <p className="mt-2 text-[16px] leading-[24px] text-[#8a8f98]">≈ ₩{krw.toLocaleString()}</p>
              </div>

              {/* Details grid */}
              <div className="flex flex-col gap-2">
                {([
                  ['Airline',   airline],
                  ['Status',    cancelled ? 'Cancelled' : status.charAt(0).toUpperCase() + status.slice(1)],
                  ['Delay',     cancelled ? '—' : fmtDelay(delayMin)],
                  ['Distance',  km > 0 ? `${km.toLocaleString()} km` : '—'],
                  ['Tier',      tierLabel],
                  ['Date',      date],
                ] as [string, string][]).map(([l, v]) => (
                  <div key={l} className="flex items-center gap-3">
                    <span className="w-[88px] text-[14px] leading-[21px] text-[#8a8f98]">{l}</span>
                    <span className="font-mono text-[14px] leading-[21px] text-[#f7f8f8]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-[24px] flex flex-wrap gap-3 border-t border-white/[0.05] pt-[24px]">
              {eligible ? (
                <>
                  <Link href={`/claim?${cp}`}
                    className="flex items-center gap-2 rounded-[10px] px-[20px] py-[10px] text-[14px] font-[590] text-white transition-opacity hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg,#638cff,#818fff,#55ccff)' }}>
                    <FileText className="h-4 w-4" />
                    Submit a claim
                  </Link>
                  <Link href="/status"
                    className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.1] px-[18px] py-[9px] text-[13px] leading-[19.5px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]">
                    My claims
                  </Link>
                </>
              ) : (
                <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">
                  Delay under 3 hours — not eligible under EU261 Art.7.
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Legal basis ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, delay: 0.1, ease: E }}
          className="mb-[28px] rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
          <div className="mb-[28px] flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-[8px]"
              style={{ background: 'rgba(99,140,255,0.12)', border: '1px solid rgba(99,140,255,0.2)' }}>
              <Shield className="h-4 w-4 text-[#638cff]" />
            </div>
            <h2 className="text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">Legal basis</h2>
          </div>
          <div className="grid gap-[28px] sm:grid-cols-2">
            {[
              { title: 'EU Regulation 261/2004, Article 7',
                body: `${tierLabel} route${km > 0 ? ` (${km.toLocaleString()} km)` : ''} — entitlement is €${compensation} per passenger.` },
              { title: 'Delay threshold — Article 6 + 7',
                body: legalDelayBody },
              { title: 'Extraordinary circumstances',
                body: 'Airlines may invoke extraordinary circumstances (severe weather, ATC strikes) to deny compensation. Technical failures do NOT qualify.' },
              { title: 'Jurisdiction',
                body: 'This flight may be covered by EU261 (EU departure or EU carrier arrival) or UK261 (UK departure). Your letter cites the applicable regulation.' },
            ].map(({ title, body }) => (
              <div key={title} className="rounded-[10px] border border-white/[0.04] bg-white/[0.02] p-4">
                <p className="mb-2 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</p>
                <p className="text-[16px] leading-[24px] text-[#8a8f98]">{body}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Next steps ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, delay: 0.18, ease: E }}
          className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
          <h2 className="mb-[28px] text-[20px] font-[590] leading-[30px] text-[#f7f8f8]">What happens next</h2>
          <div className="space-y-[28px]">
            {[
              { n: '01', color: '#638cff', title: 'Generate your claim letter', body: 'FlyBack writes a legally-precise demand letter citing EU261 article numbers, your route distance, and delay duration.' },
              { n: '02', color: '#818fff', title: 'Send to the airline', body: 'Submit via the airline\'s compensation web form or by email. Most airlines process within 4–8 weeks.' },
              { n: '03', color: '#55ccff', title: 'If rejected, escalate', body: 'File with the NEB (National Enforcement Body) of the departure country using FlyBack\'s escalation template.' },
              { n: '04', color: '#638cff', title: 'Track in your dashboard', body: 'FlyBack saves every claim so you can track status, set reminders, and export a paper trail.' },
            ].map(({ n, color, title, body }) => (
              <div key={n} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-[590]"
                  style={{ background: `${color}14`, color, border: `1px solid ${color}28` }}>{n}</div>
                <div>
                  <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</p>
                  <p className="mt-1 text-[16px] leading-[24px] text-[#8a8f98]">{body}</p>
                </div>
              </div>
            ))}
          </div>
          {eligible && (
            <Link href={`/claim?${cp}`}
              className="mt-[28px] flex w-fit items-center gap-2 rounded-[10px] px-[20px] py-[10px] text-[14px] font-[590] text-white transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#638cff,#818fff,#55ccff)' }}>
              <FileText className="h-4 w-4" />
              Submit a claim <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </motion.div>
      </main>
    </div>
  )
}

export default function CheckPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#08090a]">
        <Loader2 className="h-7 w-7 animate-spin text-[#638cff]" />
      </div>
    }>
      <ResultInner />
    </Suspense>
  )
}
