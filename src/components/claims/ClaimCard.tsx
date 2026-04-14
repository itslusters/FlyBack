'use client'

/**
 * ClaimCard
 *
 * Universal boarding-pass-style claim card.
 * Content slot switches by claim.type (EU261 / RECALL / CLASS_ACTION).
 *
 * Required deps: framer-motion, lucide-react
 * Required font: JetBrains Mono loaded globally (next/font or <link>)
 */

import { useId, useEffect, useRef } from 'react'
import { motion, animate } from 'framer-motion'
import { Plane, Package, Users } from 'lucide-react'
import type { Claim, EU261Payload, RecallPayload, ClassActionPayload } from '@/lib/types'
import { ClaimType, ClaimStatus } from '@/lib/types'

// ─── AIRPORT CITY LOOKUP ──────────────────────────────────────────────────────

const AIRPORT_CITY: Record<string, string> = {
  LHR: 'London',    LGW: 'London',    STN: 'London',    LCY: 'London',
  CDG: 'Paris',     ORY: 'Paris',
  AMS: 'Amsterdam', FRA: 'Frankfurt', MUC: 'Munich',
  MAD: 'Madrid',    BCN: 'Barcelona', FCO: 'Rome',      MXP: 'Milan',
  ZRH: 'Zürich',    VIE: 'Vienna',    BRU: 'Brussels',  CPH: 'Copenhagen',
  DUB: 'Dublin',    ARN: 'Stockholm', HEL: 'Helsinki',  OSL: 'Oslo',
  ATH: 'Athens',    IST: 'Istanbul',
  JFK: 'New York',  LGA: 'New York',  EWR: 'Newark',
  LAX: 'Los Angeles', ORD: 'Chicago', SFO: 'San Francisco',
  DFW: 'Dallas',    MIA: 'Miami',     BOS: 'Boston',
  ICN: 'Seoul',     GMP: 'Seoul',     NRT: 'Tokyo',     HND: 'Tokyo',
  PEK: 'Beijing',   PVG: 'Shanghai',  HKG: 'Hong Kong',
  SIN: 'Singapore', BKK: 'Bangkok',   KUL: 'Kuala Lumpur',
  DXB: 'Dubai',     DOH: 'Doha',      AUH: 'Abu Dhabi',
  SYD: 'Sydney',    MEL: 'Melbourne',
  YYZ: 'Toronto',   YVR: 'Vancouver',
  GRU: 'São Paulo', EZE: 'Buenos Aires',
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ClaimStatus,
  { label: string; ring: string; bg: string; dot: string; pulse: boolean }
> = {
  [ClaimStatus.DISCOVERED]:    { label: 'Discovered',  ring: 'border-slate-500/40',   bg: 'bg-slate-500/10',   dot: 'bg-slate-400',   pulse: false },
  [ClaimStatus.EMAIL_DRAFTED]: { label: 'Email Ready', ring: 'border-sky-500/40',     bg: 'bg-sky-500/10',     dot: 'bg-sky-400',     pulse: false },
  [ClaimStatus.SUBMITTED]:     { label: 'Submitted',   ring: 'border-amber-500/40',   bg: 'bg-amber-500/10',   dot: 'bg-amber-400',   pulse: true  },
  [ClaimStatus.PENDING]:       { label: 'Pending',     ring: 'border-orange-500/40',  bg: 'bg-orange-500/10',  dot: 'bg-orange-400',  pulse: true  },
  [ClaimStatus.RESOLVED]:      { label: 'Resolved',    ring: 'border-emerald-500/40', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', pulse: false },
  [ClaimStatus.REJECTED]:      { label: 'Rejected',    ring: 'border-red-500/40',     bg: 'bg-red-500/10',     dot: 'bg-red-400',     pulse: false },
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** SVG fractal noise overlay — unique filter ID per card instance via useId() */
function NoiseLayer() {
  const uid = useId()
  const filterId = `noise-${uid.replaceAll(':', '')}`
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full rounded-[inherit] opacity-[0.028] mix-blend-overlay"
    >
      <filter id={filterId}>
        <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#${filterId})`} />
    </svg>
  )
}

/** Dashed perforation — visual boarding pass tear line */
function PerforationLine() {
  return (
    <div className="relative my-5 flex items-center px-1">
      <div className="w-full border-t border-dashed border-white/[0.08]" />
    </div>
  )
}

/** Type pill: "Flight", "Recall", "Class Action" */
function TypeBadge({ type }: { type: ClaimType }) {
  const icons = {
    [ClaimType.EU261]:        <Plane   className="h-3 w-3" />,
    [ClaimType.RECALL]:       <Package className="h-3 w-3" />,
    [ClaimType.CLASS_ACTION]: <Users   className="h-3 w-3" />,
  }
  const labels = {
    [ClaimType.EU261]:        'Flight',
    [ClaimType.RECALL]:       'Recall',
    [ClaimType.CLASS_ACTION]: 'Class Action',
  }
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.04] px-2 py-1 text-[10px] font-medium tracking-wide text-white/50">
      {icons[type]}
      {labels[type]}
    </div>
  )
}

/** Status pill with optional animated pulse dot */
function StatusBadge({ status }: { status: ClaimStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-md border px-2 py-1',
        'text-[10px] font-medium tracking-wide text-white/70',
        cfg.ring, cfg.bg,
      ].join(' ')}
    >
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span
            className={['absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', cfg.dot].join(' ')}
          />
        )}
        <span className={['relative inline-flex h-2 w-2 rounded-full', cfg.dot].join(' ')} />
      </span>
      {cfg.label}
    </div>
  )
}

/** Boarding pass route: IATA ── ✈ ── IATA */
function RouteTimeline({ dep, arr }: { dep: string; arr: string }) {
  return (
    <div className="flex items-center gap-3 py-4">
      {/* Departure */}
      <div className="min-w-[52px]">
        <div
          className="font-['JetBrains_Mono',monospace] text-[28px] font-bold leading-none tracking-tight text-white"
        >
          {dep}
        </div>
        <div className="mt-1 text-[10px] tracking-wide text-white/30">
          {AIRPORT_CITY[dep] ?? dep}
        </div>
      </div>

      {/* Dashed track + plane icon */}
      <div className="relative flex flex-1 items-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-dashed border-white/[0.10]" />
        </div>
        <div className="relative flex w-full items-center justify-center">
          <div className="rounded-full bg-[#001529] p-1.5 ring-1 ring-white/[0.05]">
            <Plane className="h-3 w-3 rotate-90 text-white/20" />
          </div>
        </div>
      </div>

      {/* Arrival */}
      <div className="min-w-[52px] text-right">
        <div
          className="font-['JetBrains_Mono',monospace] text-[28px] font-bold leading-none tracking-tight text-white"
        >
          {arr}
        </div>
        <div className="mt-1 text-[10px] tracking-wide text-white/30">
          {AIRPORT_CITY[arr] ?? arr}
        </div>
      </div>
    </div>
  )
}

/**
 * Animated number counter — springs from 0 to value on mount.
 * Uses Framer Motion's animate() utility (no DOM dependency on motion values).
 */
function AnimatedAmount({
  value,
  prefix = '',
  suffix = '',
}: {
  value: number
  prefix?: string
  suffix?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],   // expo out — fast start, lands soft
      onUpdate(v) {
        node.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`
      },
    })
    return () => controls.stop()
  }, [value, prefix, suffix])

  return (
    <span ref={ref}>
      {prefix}0{suffix}
    </span>
  )
}

// ─── TYPE SLOTS ───────────────────────────────────────────────────────────────

function FlightSlot({ payload }: { payload: EU261Payload }) {
  const flightDate = new Date(payload.scheduled_date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const cancelled = payload.actual_delay_minutes === Infinity || !isFinite(payload.actual_delay_minutes)
  const delayHours = Math.floor(payload.actual_delay_minutes / 60)
  const delayMins  = payload.actual_delay_minutes % 60

  return (
    <div>
      {/* Flight identity */}
      <div className="flex items-baseline gap-3">
        <span className="font-['JetBrains_Mono',monospace] text-[15px] font-semibold text-white/90 tracking-wide">
          {payload.flight_number}
        </span>
        <span className="text-[11px] text-white/35">{payload.airline_iata}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-white/35">
        <span>{flightDate}</span>
        <span className="text-white/15">·</span>
        {cancelled ? (
          <span className="text-red-400/80">Cancelled</span>
        ) : (
          <span>
            Delayed{' '}
            <span className="text-white/55">
              {delayHours > 0 && `${delayHours}h `}{delayMins}m
            </span>
          </span>
        )}
      </div>

      {/* Route */}
      <RouteTimeline dep={payload.departure_airport} arr={payload.arrival_airport} />

      <PerforationLine />

      {/* Compensation */}
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
          Compensation
        </div>
        <div className="mt-1 font-['JetBrains_Mono',monospace] text-[32px] font-bold leading-none text-white">
          <AnimatedAmount value={payload.compensation_tier} prefix="€" />
        </div>
        <div className="mt-1.5 text-[10px] text-white/25">
          Article 7 · {payload.regulation}/2004
        </div>
      </div>
    </div>
  )
}

function RecallSlot({ payload }: { payload: RecallPayload }) {
  const REMEDY_LABEL: Record<string, string> = {
    REFUND: 'Refund', REPLACEMENT: 'Replacement',
    REPAIR: 'Repair', STOP_USE: 'Stop Use',
  }
  const REMEDY_COLOR: Record<string, string> = {
    REFUND: 'text-emerald-400/80 border-emerald-500/25 bg-emerald-500/[0.07]',
    REPLACEMENT: 'text-sky-400/80 border-sky-500/25 bg-sky-500/[0.07]',
    REPAIR: 'text-amber-400/80 border-amber-500/25 bg-amber-500/[0.07]',
    STOP_USE: 'text-red-400/80 border-red-500/25 bg-red-500/[0.07]',
  }

  return (
    <div>
      {/* Product name */}
      <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-white/85">
        {payload.product_name}
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <span className="font-['JetBrains_Mono',monospace] text-[10px] text-white/30">
          #{payload.cpsc_recall_id}
        </span>
        <span
          className={[
            'rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]',
            REMEDY_COLOR[payload.remedy_type] ?? 'text-white/40 border-white/10 bg-white/[0.04]',
          ].join(' ')}
        >
          {REMEDY_LABEL[payload.remedy_type] ?? payload.remedy_type}
        </span>
      </div>

      {payload.amazon_order_id && (
        <div className="mt-1 text-[10px] text-white/25">
          Amazon order {payload.amazon_order_id}
        </div>
      )}

      <PerforationLine />

      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
          Estimated Value
        </div>
        <div className="mt-1 font-['JetBrains_Mono',monospace] text-[32px] font-bold leading-none text-white">
          via claim
        </div>
        <div className="mt-1.5 text-[10px] text-white/25">
          Submit claim at recall portal
        </div>
      </div>
    </div>
  )
}

function ClassActionSlot({ payload }: { payload: ClassActionPayload }) {
  const deadline = payload.deadline
    ? new Date(payload.deadline).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : null

  const daysLeft = payload.deadline
    ? Math.ceil((new Date(payload.deadline).getTime() - Date.now()) / 86_400_000)
    : null

  const isUrgent = daysLeft !== null && daysLeft <= 30

  return (
    <div>
      {/* Case name */}
      <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-white/85">
        {payload.case_name}
      </div>

      {/* Deadline */}
      {deadline && (
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[10px] text-white/30">Deadline {deadline}</span>
          {isUrgent && (
            <span className="rounded border border-red-500/30 bg-red-500/[0.08] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-red-400/80">
              {daysLeft}d left
            </span>
          )}
        </div>
      )}

      {/* Eligibility summary */}
      {payload.eligibility_met.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {payload.eligibility_met.slice(0, 2).map((item) => (
            <li key={item} className="flex items-center gap-1.5 text-[10px] text-white/35">
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-emerald-400/60" />
              {item}
            </li>
          ))}
        </ul>
      )}

      <PerforationLine />

      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/25">
          Settlement ID
        </div>
        <div className="mt-1 font-['JetBrains_Mono',monospace] text-[13px] font-semibold leading-none tracking-wide text-white/60">
          {payload.settlement_id}
        </div>
        <div className="mt-1.5 text-[10px] text-white/25">
          Submit at claim portal
        </div>
      </div>
    </div>
  )
}

// ─── MAIN CARD ────────────────────────────────────────────────────────────────

export interface ClaimCardProps {
  claim: Claim
  /** Stagger index — each +1 adds 60ms entry delay */
  index?: number
  onClick?: (claim: Claim) => void
}

export function ClaimCard({ claim, index = 0, onClick }: ClaimCardProps) {
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18, ease: 'easeIn' } }}
      transition={{
        duration: 0.4,
        delay: index * 0.06,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -3, transition: { duration: 0.18, ease: 'easeOut' } }}
      onClick={() => onClick?.(claim)}
      className={[
        'relative overflow-hidden rounded-2xl',
        'border-[0.5px] border-white/[0.07]',
        'bg-[linear-gradient(145deg,#002347_0%,#001529_100%)]',
        'shadow-[0_24px_48px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]',
        'px-5 py-4',
        onClick ? 'cursor-pointer' : '',
      ].join(' ')}
    >
      {/* Noise texture */}
      <NoiseLayer />

      {/* Subtle top-edge glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
      />

      {/* Header: type badge + status */}
      <div className="flex items-center justify-between">
        <TypeBadge type={claim.type} />
        <StatusBadge status={claim.status} />
      </div>

      {/* Content slot */}
      <div className="mt-4">
        {claim.type === ClaimType.EU261 && (
          <FlightSlot payload={claim.payload as EU261Payload} />
        )}
        {claim.type === ClaimType.RECALL && (
          <RecallSlot payload={claim.payload as RecallPayload} />
        )}
        {claim.type === ClaimType.CLASS_ACTION && (
          <ClassActionSlot payload={claim.payload as ClassActionPayload} />
        )}
      </div>

      {/* Footer: created date */}
      <div className="mt-4 text-[9px] tracking-wide text-white/20">
        Added {new Date(claim.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </div>
    </motion.article>
  )
}
