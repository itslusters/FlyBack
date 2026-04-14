/**
 * /families — Landing page for families use case
 */

import Link from 'next/link'
import { Plane, ArrowRight, Check, Users, Heart } from 'lucide-react'

export const metadata = {
  title: 'FlyBack for Families',
  description: 'Every passenger on a delayed flight has an individual claim. A family of 4 can claim up to €2,400.',
}

const FEATURES = [
  { icon: <Users className="h-4 w-4" />, title: 'Every passenger has a claim', body: 'EU261 compensation is per passenger, not per booking. If your family of 4 was on a delayed long-haul flight, each person is entitled to €600 — that\'s €2,400 total.' },
  { icon: <Heart className="h-4 w-4" />, title: 'Claim for children too', body: 'Minor passengers on the same booking qualify for the same compensation as adults, provided they had their own confirmed seat and ticket.' },
  { icon: <Plane className="h-4 w-4" />, title: 'One check, multiple letters', body: 'Enter the flight once. FlyBack generates individual claim letters for each passenger you name — ready to send in one go.' },
  { icon: <Check className="h-4 w-4" />, title: 'Holiday flights are covered', body: 'Package holiday flights count. If your charter flight was delayed 3+ hours departing from an EU or UK airport, EU261/UK261 applies regardless of how you booked.' },
]

const CALCULATOR = [
  { people: 2, amount: '€1,200' },
  { people: 3, amount: '€1,800' },
  { people: 4, amount: '€2,400' },
  { people: 5, amount: '€3,000' },
]

export default function FamiliesPage() {
  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">
      <header className="border-b border-white/[0.05]" style={{ background: 'rgba(8,9,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[14px]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
              <Plane className="h-3 w-3 text-white" />
            </div>
            <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
          </Link>
          <Link href="/check" className="rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
            Check my flight
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">
        <div className="mb-[64px]">
          <p className="mb-3 text-[13px] leading-[19.5px] text-[#638cff]">Families</p>
          <h1 className="text-[48px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]">
            One delayed flight.<br />Four separate claims.
          </h1>
          <p className="mt-4 max-w-[520px] text-[18px] leading-[27px] text-[#8a8f98]">
            Most families don&rsquo;t realise each passenger has an independent right to compensation. FlyBack handles all of them at once.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/check" className="flex items-center gap-2 rounded-full bg-[#f7f8f8] px-[18px] py-[10px] text-[14px] font-[590] text-[#08090a] hover:opacity-90">
              Check our flight <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 rounded-full border border-white/[0.1] px-[18px] py-[10px] text-[14px] font-[590] text-[#8a8f98] hover:border-white/[0.2] hover:text-[#f7f8f8]">
              See pricing
            </Link>
          </div>
        </div>

        {/* Per-family compensation calculator */}
        <div className="mb-[64px] rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
          <p className="mb-2 text-[20px] font-[590] leading-[1.2] tracking-[-0.01em] text-[#f7f8f8]">Long-haul delay: how much your family could claim</p>
          <p className="mb-6 text-[13px] leading-[19.5px] text-[#8a8f98]">Based on €600 per passenger (flights over 3,500 km)</p>
          <div className="grid gap-3 sm:grid-cols-4">
            {CALCULATOR.map(({ people, amount }) => (
              <div key={people} className="rounded-[8px] border border-white/[0.05] bg-white/[0.02] px-4 py-4 text-center">
                <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{people} passengers</p>
                <p className="mt-1 font-mono text-[24px] font-[590] leading-none tracking-[-0.02em]"
                  style={{ background: 'linear-gradient(135deg,#638cff,#55ccff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {amount}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-[28px] sm:grid-cols-2 mb-[64px]">
          {FEATURES.map(({ icon, title, body }) => (
            <div key={title} className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(99,140,255,0.1)] text-[#638cff]">{icon}</div>
              <p className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</p>
              <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{body}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/check" className="inline-flex items-center gap-2 rounded-full bg-[#638cff] px-[20px] py-[10px] text-[14px] font-[590] text-white hover:opacity-90">
            Check our flight <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </main>
    </div>
  )
}
