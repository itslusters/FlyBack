/**
 * /agencies — Landing page for travel agencies use case
 */

import Link from 'next/link'
import { Plane, ArrowRight, Check, Building2, Globe, Zap, Mail } from 'lucide-react'

export const metadata = {
  title: 'FlyBack for Travel Agencies',
  description: 'Offer EU261 compensation claims as a service to your clients. Bulk checks, white-label letters, and API access.',
}

const FEATURES = [
  { icon: <Zap className="h-4 w-4" />, title: 'Bulk flight checks', body: 'Check a list of flight numbers in one go. Useful after widespread disruption events — storms, strikes, tech outages — that affect many clients at once.' },
  { icon: <Building2 className="h-4 w-4" />, title: 'White-label claim letters', body: 'Generated letters can be customised with your agency\'s name and contact details. Present them to clients as part of your disruption management service.' },
  { icon: <Globe className="h-4 w-4" />, title: 'EU & UK coverage', body: 'FlyBack handles both EU261 and UK261 — relevant for agencies selling both European and UK-departure itineraries to the same client base.' },
  { icon: <Mail className="h-4 w-4" />, title: 'API access (coming soon)', body: 'Integrate eligibility checks directly into your booking system. Flag eligible disruptions automatically when flight status data comes in.' },
]

export default function AgenciesPage() {
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
            Check a flight
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">
        <div className="mb-[64px]">
          <p className="mb-3 text-[13px] leading-[19.5px] text-[#638cff]">Travel agencies</p>
          <h1 className="text-[48px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]">
            Turn disruption into<br />a client service.
          </h1>
          <p className="mt-4 max-w-[520px] text-[18px] leading-[27px] text-[#8a8f98]">
            Proactively checking your clients&rsquo; disrupted flights and handing them a ready-to-send claim letter is exactly the kind of service they remember.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/pricing" className="flex items-center gap-2 rounded-full bg-[#f7f8f8] px-[18px] py-[10px] text-[14px] font-[590] text-[#08090a] hover:opacity-90">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:agencies@flyback.app" className="flex items-center gap-2 rounded-full border border-white/[0.1] px-[18px] py-[10px] text-[14px] font-[590] text-[#8a8f98] hover:border-white/[0.2] hover:text-[#f7f8f8]">
              Talk to us
            </a>
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
          <p className="mb-4 text-[20px] font-[590] leading-[1.2] tracking-[-0.01em] text-[#f7f8f8]">Why agencies leave money on the table</p>
          <p className="mb-5 text-[15px] leading-[24px] text-[#8a8f98]">
            Most travel agencies don&rsquo;t have a scalable process for EU261. When a client calls about a delay, the typical answer is &ldquo;you&rsquo;ll need to contact the airline directly.&rdquo; FlyBack changes that.
          </p>
          <ul className="mb-6 space-y-2">
            {[
              'No legal expertise required — letters are pre-written and regulation-cited',
              'Covers all EU & UK departure airports in one tool',
              'Each client claim takes under 2 minutes to generate',
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] leading-[21px] text-[#8a8f98]">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#55ccff]" />{item}
              </li>
            ))}
          </ul>
          <a href="mailto:agencies@flyback.app"
            className="inline-flex items-center gap-2 rounded-full bg-[#638cff] px-[18px] py-[9px] text-[13px] font-[590] text-white hover:opacity-90">
            Contact us about agency access <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </main>
    </div>
  )
}
