/**
 * /frequent-flyers — Landing page for frequent flyer use case
 */

import Link from 'next/link'
import { Plane, ArrowRight, Check, BarChart2, Bell, Clock } from 'lucide-react'

export const metadata = {
  title: 'FlyBack for Frequent Flyers',
  description: 'Track every eligible flight, manage multiple claims, and never miss a compensation deadline.',
}

const FEATURES = [
  { icon: <BarChart2 className="h-4 w-4" />, title: 'All claims in one place', body: 'Every flight you check is saved to your dashboard. Track open claims, resolved payouts, and pending escalations without switching tabs.' },
  { icon: <Bell className="h-4 w-4" />, title: 'Auto follow-up reminders', body: 'FlyBack pings you when an airline has gone silent. No more manually tracking 14-day response windows across a dozen claims.' },
  { icon: <Clock className="h-4 w-4" />, title: 'Check years of past flights', body: 'EU261 claims go back 2–6 years depending on country. UK261 gives you 6 years. Enter any old flight number and check instantly.' },
  { icon: <Plane className="h-4 w-4" />, title: 'Unlimited checks per month', body: 'Pro plan covers all your flights. No per-check fees, no caps. Frequent flyers with 50+ flights a year pay the same €10/month as everyone else.' },
]

export default function FrequentFlyersPage() {
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
          <p className="mb-3 text-[13px] leading-[19.5px] text-[#638cff]">Frequent flyers</p>
          <h1 className="text-[48px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]">
            You fly a lot.<br />You get delayed a lot.
          </h1>
          <p className="mt-4 max-w-[520px] text-[18px] leading-[27px] text-[#8a8f98]">
            FlyBack keeps every claim organised so you can chase what you&rsquo;re owed without losing track.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/check" className="flex items-center gap-2 rounded-full bg-[#f7f8f8] px-[18px] py-[10px] text-[14px] font-[590] text-[#08090a] hover:opacity-90">
              Check a flight <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="flex items-center gap-2 rounded-full border border-white/[0.1] px-[18px] py-[10px] text-[14px] font-[590] text-[#8a8f98] hover:border-white/[0.2] hover:text-[#f7f8f8]">
              See pricing
            </Link>
          </div>
        </div>

        <div className="mb-[64px] grid gap-[28px] sm:grid-cols-2">
          {FEATURES.map(({ icon, title, body }) => (
            <div key={title} className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(99,140,255,0.1)] text-[#638cff]">{icon}</div>
              <p className="mb-1 text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">{title}</p>
              <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{body}</p>
            </div>
          ))}
        </div>

        <div className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
          <p className="mb-4 text-[20px] font-[590] leading-[1.2] tracking-[-0.01em] text-[#f7f8f8]">How much have you left unclaimed?</p>
          <p className="mb-6 text-[15px] leading-[24px] text-[#8a8f98]">
            A single long-haul delay is worth €600. Frequent flyers on busy routes (LHR, CDG, FRA) experience eligible disruptions more than once a year on average.
          </p>
          <ul className="mb-6 space-y-2">
            {['3h+ delay on any flight from an EU airport', 'Cancellation with less than 14 days notice', 'Denied boarding due to overbooking'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] leading-[21px] text-[#8a8f98]">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#55ccff]" />{item}
              </li>
            ))}
          </ul>
          <Link href="/check" className="inline-flex items-center gap-2 rounded-full bg-[#638cff] px-[18px] py-[9px] text-[13px] font-[590] text-white hover:opacity-90">
            Check a past flight <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
