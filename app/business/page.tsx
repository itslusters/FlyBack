/**
 * /business — Landing page for business traveler use case
 */

import Link from 'next/link'
import { Plane, ArrowRight, Check, Briefcase, FileText, Download } from 'lucide-react'

export const metadata = {
  title: 'FlyBack for Business Travelers',
  description: 'Separate work and personal claims. Export documentation for expense reports. EU261 built for professionals.',
}

const FEATURES = [
  { icon: <Briefcase className="h-4 w-4" />, title: 'Separate work & personal', body: 'Tag claims by trip type. Keep your business travel compensation separate from personal claims — useful at tax time or when reimbursing through your company.' },
  { icon: <FileText className="h-4 w-4" />, title: 'Clean claim documentation', body: 'Generated letters reference the exact regulation article, delay duration, route distance, and applicable compensation tier. Ready to attach to an expense report.' },
  { icon: <Download className="h-4 w-4" />, title: 'Export claim history', body: 'Download your full claim history as a CSV. Include flight numbers, dates, routes, amounts claimed, and resolution status.' },
  { icon: <Plane className="h-4 w-4" />, title: 'Bulk check for teams', body: 'Check multiple flights from a recent team offsite or conference trip. One subscription, no limit on flights checked per month.' },
]

export default function BusinessPage() {
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
          <p className="mb-3 text-[13px] leading-[19.5px] text-[#638cff]">Business travelers</p>
          <h1 className="text-[48px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]">
            Your time is money.<br />So is your delay.
          </h1>
          <p className="mt-4 max-w-[520px] text-[18px] leading-[27px] text-[#8a8f98]">
            Business travelers are among the most entitled to EU261 compensation — and the least likely to claim it.
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
          <p className="mb-4 text-[20px] font-[590] leading-[1.2] tracking-[-0.01em] text-[#f7f8f8]">Your company won&rsquo;t claim it for you</p>
          <p className="mb-6 text-[15px] leading-[24px] text-[#8a8f98]">
            EU261 compensation is personal — it belongs to the individual passenger, not the employer who paid for the ticket. Even on a fully expensed business trip, the €600 is yours.
          </p>
          <ul className="mb-6 space-y-2">
            {['Compensation goes to you personally, not your company', 'Business class passengers are fully covered by EU261', 'Delays at hub airports (LHR, FRA, CDG) are highly frequent'].map(item => (
              <li key={item} className="flex items-center gap-2.5 text-[14px] leading-[21px] text-[#8a8f98]">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#55ccff]" />{item}
              </li>
            ))}
          </ul>
          <Link href="/check" className="inline-flex items-center gap-2 rounded-full bg-[#638cff] px-[18px] py-[9px] text-[13px] font-[590] text-white hover:opacity-90">
            Check a business trip flight <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>
    </div>
  )
}
