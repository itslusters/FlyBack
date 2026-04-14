'use client'

/**
 * BoardingPass — physical ticket-inspired flight card
 * Dark-mode adaptation of classic boarding pass design.
 *
 * Layout:
 *   [barcode stub] | [meta row] / [divider] / [city names] / [large IATA + dotted arrow]
 *
 * Notch circles are positioned outside the card bounds (overflow-visible parent required).
 * Pass bgColor matching the parent background so the notch "cuts" are convincing.
 */

import { Plane } from 'lucide-react'

const STUB_W  = 88   // px — left stub width
const NOTCH_D = 28   // px — notch circle diameter

interface BoardingPassProps {
  date:        string   // "Mon, 14 Apr 2026"
  flight:      string   // "KE 907"
  origin:      string   // "ICN"
  destination: string   // "LHR"
  originCity:  string   // "Seoul"
  destCity:    string   // "London"
  seat?:       string   // "14A"  — defaults to "—"
  gate?:       string   // "C2"   — defaults to "—"
  bgColor?:    string   // parent bg for notch blending — defaults to #08090a
  className?:  string
}

export default function BoardingPass({
  date, flight, origin, destination, originCity, destCity,
  seat = '—', gate = '—',
  bgColor = '#08090a',
  className = '',
}: BoardingPassProps) {
  return (
    <div className={`relative ${className}`}>

      {/* Card */}
      <div
        className="flex overflow-hidden rounded-[16px] border border-white/[0.08] bg-[#0c0d10]"
        style={{ boxShadow: '0 0 40px rgba(99,140,255,0.06)' }}
      >
        {/* ── Left stub — barcode ── */}
        <div
          className="flex shrink-0 items-center justify-center border-r border-dashed border-white/[0.1] py-6"
          style={{ width: STUB_W }}
        >
          <div className="flex flex-col gap-[4px]">
            {BARCODE_WIDTHS.map((w, i) => (
              <div
                key={i}
                className="rounded-full"
                style={{ width: w, height: 3, background: 'rgba(255,255,255,0.12)' }}
              />
            ))}
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="relative flex-1 px-[28px] py-[24px]">
          {/* Top-edge glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(99,140,255,0.35) 50%,transparent)' }}
          />

          {/* Meta row: Date · Gate · Flight · Seat */}
          <div className="mb-5 flex flex-wrap gap-x-[28px] gap-y-3">
            {[
              { label: 'Date',   value: date   },
              { label: 'Gate',   value: gate   },
              { label: 'Flight', value: flight },
              { label: 'Seat',   value: seat   },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[11px] leading-[16px] text-[#8a8f98]">{label}</p>
                <p className="font-mono text-[17px] font-[590] leading-[25px] text-[#f7f8f8]">{value}</p>
              </div>
            ))}
          </div>

          {/* Dashed horizontal divider */}
          <div className="mb-5 border-t border-dashed border-white/[0.08]" />

          {/* Departure / Arrival city names */}
          <div className="mb-3 flex justify-between">
            <div>
              <p className="text-[11px] leading-[16px] text-[#8a8f98]">Departure</p>
              <p className="text-[14px] font-[590] leading-[21px] text-[#f7f8f8]">{originCity}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] leading-[16px] text-[#8a8f98]">Arrival</p>
              <p className="text-[14px] font-[590] leading-[21px] text-[#f7f8f8]">{destCity}</p>
            </div>
          </div>

          {/* Large IATA codes + dotted connector */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[52px] font-black leading-none tracking-[-0.03em] text-[#f7f8f8] sm:text-[60px]">
              {origin}
            </span>

            <div className="flex flex-1 items-center overflow-hidden">
              <div className="flex flex-1 gap-[5px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="h-[2px] flex-1 rounded-full bg-white/[0.12]" />
                ))}
              </div>
              <Plane className="mx-2 h-[18px] w-[18px] shrink-0 text-white/[0.22]" />
              <div className="flex flex-1 gap-[5px]">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="h-[2px] flex-1 rounded-full bg-white/[0.12]" />
                ))}
              </div>
            </div>

            <span className="font-mono text-[52px] font-black leading-none tracking-[-0.03em] text-[#f7f8f8] sm:text-[60px]">
              {destination}
            </span>
          </div>
        </div>
      </div>

      {/* ── Notch circles — "punched" at stub/main boundary ── */}
      {[
        { top: -(NOTCH_D / 2) },
        { bottom: -(NOTCH_D / 2) },
      ].map((pos, i) => (
        <div
          key={i}
          aria-hidden
          className="pointer-events-none absolute rounded-full"
          style={{
            width:  NOTCH_D,
            height: NOTCH_D,
            left:   STUB_W - NOTCH_D / 2,
            background: bgColor,
            border: '1px solid rgba(255,255,255,0.06)',
            ...pos,
          }}
        />
      ))}
    </div>
  )
}

// Varied widths give the barcode a natural look
const BARCODE_WIDTHS = [
  32, 20, 28, 24, 32, 20, 24, 28,
  20, 32, 24, 20, 28, 32, 24, 20,
  28, 20,
]
