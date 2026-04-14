'use client'

/**
 * ClaimsDashboard — client shell for the dashboard page.
 *
 * Receives pre-fetched claims from the Server Component.
 * Owns: filter state, animated total, grid layout transitions.
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { Plus, Inbox, Plane, Package, Users } from 'lucide-react'
import Link from 'next/link'
import { ClaimCard }  from '@/components/claims/ClaimCard'
import type { Claim, EU261Payload } from '@/lib/types'
import { ClaimType }  from '@/lib/types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

type FilterKey = 'all' | ClaimType

interface Props {
  claims:   Claim[]
  userName: string
}

// ─── FILTER CONFIG ────────────────────────────────────────────────────────────

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all',                 label: 'All'          },
  { key: ClaimType.EU261,       label: 'Flights'      },
  { key: ClaimType.RECALL,      label: 'Amazon'       },
  { key: ClaimType.CLASS_ACTION, label: 'Class Action' },
]

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

/** Sums all available estimated values (EUR compensation treated as USD-equivalent for the hero number). */
function computeTotal(claims: Claim[]): number {
  return claims.reduce((sum, c) => {
    if (c.amount_est_usd != null) return sum + c.amount_est_usd
    if (c.type === ClaimType.EU261) {
      return sum + (c.payload as EU261Payload).compensation_tier
    }
    return sum
  }, 0)
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

/** Spring-animated number counter — counts up from 0 on mount. */
function AnimatedTotal({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const controls = animate(0, value, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        node.textContent = '$' + Math.round(v).toLocaleString()
      },
    })
    return () => controls.stop()
  }, [value])

  return <span ref={ref}>$0</span>
}

interface FilterTabsProps {
  active:   FilterKey
  counts:   Record<string, number>
  onChange: (key: FilterKey) => void
}

function FilterTabs({ active, counts, onChange }: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {FILTERS.map((f) => {
        const isActive = active === f.key
        const count    = counts[f.key] ?? 0
        return (
          <button
            key={f.key}
            onClick={() => onChange(f.key)}
            className={[
              'relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-colors duration-150',
              isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-700',
            ].join(' ')}
          >
            {/* Sliding pill indicator */}
            {isActive && (
              <motion.span
                layoutId="filter-indicator"
                className="absolute inset-0 rounded-lg bg-[#003366]"
                transition={{ type: 'spring', bounce: 0.18, duration: 0.38 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {f.label}
              {count > 0 && (
                <span className="text-[11px] opacity-50">{count}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function EmptyState({ isFiltered }: { isFiltered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
        <Inbox className="h-7 w-7 text-neutral-300" />
      </div>
      <h3 className="text-[15px] font-semibold text-neutral-700">
        {isFiltered ? '해당 카테고리에 클레임이 없습니다' : '아직 발견된 보상이 없습니다'}
      </h3>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-neutral-400">
        {isFiltered
          ? '다른 필터를 선택하거나, 새 항공편을 조회해보세요.'
          : '항공편 지연·취소 또는 아마존 리콜 제품이 있다면 보상받을 수 있어요.'}
      </p>
      {!isFiltered && (
        <div className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row">
          <Link
            href="/flights/check"
            className={[
              'inline-flex items-center gap-2 rounded-xl',
              'bg-[#003366] px-5 py-2.5',
              'text-[13px] font-medium text-white',
              'transition-colors hover:bg-[#004080]',
              'shadow-[0_2px_12px_rgba(0,51,102,0.3)]',
            ].join(' ')}
          >
            <Plane className="h-3.5 w-3.5" />
            항공편 보상 확인
          </Link>
          <Link
            href="/connect/amazon"
            className={[
              'inline-flex items-center gap-2 rounded-xl',
              'border border-neutral-200 bg-white px-5 py-2.5',
              'text-[13px] font-medium text-neutral-600',
              'transition-colors hover:bg-neutral-50',
            ].join(' ')}
          >
            <Package className="h-3.5 w-3.5" />
            아마존 리콜 확인
          </Link>
        </div>
      )}
    </div>
  )
}

/** Tiny icon + stat row shown below the total number */
function ClaimTypeSummary({ claims }: { claims: Claim[] }) {
  const eu261  = claims.filter(c => c.type === ClaimType.EU261).length
  const recall = claims.filter(c => c.type === ClaimType.RECALL).length
  const ca     = claims.filter(c => c.type === ClaimType.CLASS_ACTION).length

  if (claims.length === 0) return null

  const items = [
    { icon: <Plane   className="h-3 w-3" />, label: 'flight',       n: eu261  },
    { icon: <Package className="h-3 w-3" />, label: 'recall',       n: recall },
    { icon: <Users   className="h-3 w-3" />, label: 'class action', n: ca     },
  ].filter(x => x.n > 0)

  return (
    <div className="mt-3 flex flex-wrap items-center gap-3">
      {items.map(({ icon, label, n }) => (
        <span
          key={label}
          className="flex items-center gap-1.5 text-[12px] text-neutral-400"
        >
          {icon}
          {n} {label}{n !== 1 ? 's' : ''}
        </span>
      ))}
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function ClaimsDashboard({ claims, userName }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all')

  const filteredClaims = activeFilter === 'all'
    ? claims
    : claims.filter(c => c.type === activeFilter)

  const counts: Record<string, number> = {
    all:                  claims.length,
    [ClaimType.EU261]:        claims.filter(c => c.type === ClaimType.EU261).length,
    [ClaimType.RECALL]:       claims.filter(c => c.type === ClaimType.RECALL).length,
    [ClaimType.CLASS_ACTION]: claims.filter(c => c.type === ClaimType.CLASS_ACTION).length,
  }

  const total = computeTotal(claims)

  return (
    <div className="min-h-screen bg-[#FDFDFD]">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-12 md:py-14">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <header className="mb-12 flex items-start justify-between gap-6">

          {/* Left: greeting + animated total */}
          <div>
            <p className="text-[13px] text-neutral-400">
              {getGreeting()}, {userName}
            </p>
            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                Total Estimated Compensation
              </p>
              <div className="mt-1.5 font-black text-[clamp(44px,8vw,72px)] leading-none tracking-tight text-neutral-900">
                <AnimatedTotal value={total} />
              </div>
            </div>
            <ClaimTypeSummary claims={claims} />
          </div>

          {/* Right: New Claim CTA */}
          <Link
            href="/flights/check"
            className={[
              'mt-1 shrink-0 inline-flex items-center gap-2 rounded-xl',
              'bg-[#003366] px-4 py-2.5',
              'text-[13px] font-medium text-white',
              'transition-colors hover:bg-[#004080]',
              'shadow-[0_2px_12px_rgba(0,51,102,0.35)]',
            ].join(' ')}
          >
            <Plus className="h-3.5 w-3.5" />
            New Claim
          </Link>
        </header>

        {/* ── Filter Tabs ─────────────────────────────────────────────── */}
        <div className="mb-8">
          <FilterTabs
            active={activeFilter}
            counts={counts}
            onChange={setActiveFilter}
          />
        </div>

        {/* ── Claims Grid ─────────────────────────────────────────────── */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredClaims.length === 0 ? (
              <motion.div
                key="empty"
                className="col-span-full"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22 }}
              >
                <EmptyState isFiltered={activeFilter !== 'all'} />
              </motion.div>
            ) : (
              filteredClaims.map((claim, i) => (
                <ClaimCard key={claim.id} claim={claim} index={i} />
              ))
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
