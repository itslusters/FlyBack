/**
 * /uk261 — UK261 regulation reference guide
 */

import Link from 'next/link'
import { Plane, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'UK261 Explained | FlyBack',
  description: 'Your rights under UK Regulation 261/2004 (UK261) — flight delays, cancellations, and denied boarding compensation up to £520.',
}

const TIERS = [
  { distance: 'Under 1,500 km', examples: 'London–Edinburgh, Manchester–Dublin', amount: '£220' },
  { distance: '1,500–3,500 km', examples: 'London–Cairo, Birmingham–Reykjavik', amount: '£350' },
  { distance: 'Over 3,500 km', examples: 'London–New York, Heathrow–Seoul', amount: '£520' },
]

export default function UK261Page() {
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
            className="rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
            Check my flight
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[720px] px-6 py-[88px]">

        <div className="mb-[48px]">
          <p className="text-[13px] leading-[19.5px] text-[#638cff] mb-2">Regulation guide</p>
          <h1 className="text-[40px] font-[590] leading-[1.1] tracking-[-0.025em] text-[#f7f8f8]">
            UK Regulation 261/2004 (UK261)
          </h1>
          <p className="mt-4 text-[17px] leading-[26px] text-[#8a8f98]">
            Post-Brexit UK flight passenger rights — broadly mirroring EU261 with GBP amounts and UK-specific enforcement.
          </p>
        </div>

        <div className="space-y-[40px]">

          <Section title="What is UK261?">
            <p>UK Regulation 261/2004 (commonly called &ldquo;UK261&rdquo;) is the retained UK law that replicates the rights previously provided by EU261 for UK-based flights after Brexit took effect on 1 January 2021.</p>
            <p>The rules are substantively identical to EU261 but apply to flights within, to, or from the UK (rather than the EU), and compensation amounts are denominated in British pounds (£) rather than euros (€).</p>
          </Section>

          <Section title="Which flights are covered?">
            <Checklist items={[
              'Any flight departing from a UK airport (regardless of airline)',
              'Flights arriving at a UK airport operated by a UK-licensed carrier',
              'Domestic UK flights (e.g. London–Edinburgh)',
              'Flights to EU destinations if departing from the UK',
              'Applies to all cabin classes',
            ]} />
            <Note>UK261 and EU261 can both apply to different legs of a connecting journey. For a flight from Paris to Seoul via London Heathrow on a UK airline, EU261 covers Paris–London and UK261 covers London–Seoul.</Note>
          </Section>

          <Section title="Qualifying disruptions">
            <SubSection title="Delay (Art. 7)">
              <p>Compensation applies when the aircraft arrives at your final destination 3 or more hours after the scheduled arrival time. The clock stops when the aircraft doors open — not when wheels touch down.</p>
            </SubSection>
            <SubSection title="Cancellation (Art. 5)">
              <p>If your flight is cancelled with less than 14 days&rsquo; notice before departure, you are entitled to compensation unless the airline offers a suitable rerouting. You are also entitled to a full refund or re-routing regardless of compensation eligibility.</p>
            </SubSection>
            <SubSection title="Denied boarding (Art. 4)">
              <p>If you hold a confirmed booking and are involuntarily bumped due to overbooking, compensation is payable at the same rates as cancellation. This does not apply if you voluntarily gave up your seat in exchange for benefits.</p>
            </SubSection>
          </Section>

          <Section title="Compensation amounts">
            <p>UK261 uses GBP equivalents of the EU261 amounts:</p>
            <div className="mt-4 rounded-[10px] overflow-hidden border border-white/[0.05]">
              <table className="w-full text-[14px] leading-[21px]">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                    <th className="px-5 py-3 text-left font-[590] text-[#f7f8f8]">Flight distance</th>
                    <th className="px-5 py-3 text-left font-[590] text-[#f7f8f8]">Example routes</th>
                    <th className="px-5 py-3 text-right font-[590] text-[#f7f8f8]">Compensation</th>
                  </tr>
                </thead>
                <tbody>
                  {TIERS.map((t, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-5 py-4 text-[#8a8f98]">{t.distance}</td>
                      <td className="px-5 py-4 text-[#8a8f98]">{t.examples}</td>
                      <td className="px-5 py-4 text-right font-[590] text-[#55ccff]">{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>The UK Government periodically reviews these amounts. Check the CAA website for the most current figures.</Note>
          </Section>

          <Section title="Right to care">
            <p>If your flight is delayed by 2+ hours, the operating carrier must provide:</p>
            <Checklist items={[
              'Meals and refreshments appropriate to the waiting time',
              'Two free phone calls, emails, or text messages',
              'Hotel accommodation if an overnight stay is necessary',
              'Transport between the airport and accommodation',
            ]} />
          </Section>

          <Section title="Extraordinary circumstances">
            <p>Airlines can refuse compensation if the disruption was caused by extraordinary circumstances that could not have been avoided even if all reasonable measures had been taken. The same exemptions as EU261 apply:</p>
            <Checklist items={[
              'Severe weather causing genuine safety concerns',
              'Air traffic control strikes',
              'Security incidents or political unrest',
              'Bird strikes or hidden manufacturing defects',
            ]} negative />
            <p>Airlines frequently cite extraordinary circumstances incorrectly. Routine technical faults, staff shortages, and scheduling problems are <strong>not</strong> extraordinary circumstances.</p>
          </Section>

          <Section title="Claim time limits">
            <p>Under the Limitation Act 1980 (England & Wales), you have 6 years from the date of the flight to bring a claim. Scotland has a 5-year limit. File promptly — evidence becomes harder to gather over time.</p>
          </Section>

          <Section title="UK enforcement body">
            <p>The UK enforcement body for UK261 is the <strong>Civil Aviation Authority (CAA)</strong>. If the airline does not respond or rejects your claim, you can escalate to:</p>
            <Checklist items={[
              'CAA Passenger Advice and Complaints Team (PACT) — free',
              'CEDR (Centre for Effective Dispute Resolution) — approved ADR scheme',
              'Aviation ADR — approved alternative dispute resolution',
              'Small claims court (England & Wales) — County Court Money Claims',
            ]} />
          </Section>

          <Section title="Key differences from EU261">
            <div className="mt-3 rounded-[10px] overflow-hidden border border-white/[0.05]">
              <table className="w-full text-[14px] leading-[21px]">
                <thead>
                  <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                    <th className="px-5 py-3 text-left font-[590] text-[#f7f8f8]">Aspect</th>
                    <th className="px-5 py-3 text-left font-[590] text-[#638cff]">UK261</th>
                    <th className="px-5 py-3 text-left font-[590] text-[#8a8f98]">EU261</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Currency', 'GBP (£)', 'EUR (€)'],
                    ['Enforcer', 'Civil Aviation Authority', 'National authorities per country'],
                    ['Coverage area', 'Departures from UK; UK carrier arrivals', 'Departures from EU; EU carrier arrivals'],
                    ['Claim limit', '6 years (England)', '2–6 years (varies by country)'],
                  ].map(([aspect, uk, eu], i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="px-5 py-4 text-[#f7f8f8] font-[500]">{aspect}</td>
                      <td className="px-5 py-4 text-[#8a8f98]">{uk}</td>
                      <td className="px-5 py-4 text-[#8a8f98]">{eu}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

        </div>

        {/* CTA */}
        <div className="mt-[64px] rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">Check if your flight qualifies</p>
            <p className="text-[13px] leading-[19.5px] text-[#8a8f98] mt-1">Instant UK261 and EU261 eligibility check for your flight.</p>
          </div>
          <Link href="/check"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#638cff] px-[18px] py-[9px] text-[13px] font-[590] leading-[19.5px] text-white hover:opacity-90 transition-opacity">
            Check my flight
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">
            EU-based flight?{' '}
            <Link href="/eu261" className="text-[#638cff] hover:underline">Read our EU261 guide</Link>
          </p>
        </div>

      </main>

      <footer className="border-t border-white/[0.05] py-[40px]">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-wrap justify-between gap-4 text-[13px] leading-[19.5px] text-[#8a8f98]">
          <p>© 2026 FlyBack</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#f7f8f8] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f7f8f8] transition-colors">Terms</Link>
            <Link href="/eu261" className="hover:text-[#f7f8f8] transition-colors">EU261</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-[20px] font-[590] leading-[1.2] tracking-[-0.01em] text-[#f7f8f8]">{title}</h2>
      <div className="space-y-3 text-[15px] leading-[24px] text-[#8a8f98] [&_strong]:text-[#f7f8f8] [&_a]:text-[#638cff] [&_a]:no-underline [&_a:hover]:underline">
        {children}
      </div>
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <p className="text-[15px] font-[590] text-[#f7f8f8] mb-1">{title}</p>
      {children}
    </div>
  )
}

function Checklist({ items, negative }: { items: string[]; negative?: boolean }) {
  return (
    <ul className="mt-3 space-y-2 pl-0 list-none">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-[21px] text-[#8a8f98]">
          <span className="mt-0.5 shrink-0 text-[12px]" style={{ color: negative ? '#ff7a7a' : '#55ccff' }}>
            {negative ? '✕' : '✓'}
          </span>
          {item}
        </li>
      ))}
    </ul>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-3 rounded-[8px] border border-[rgba(99,140,255,0.15)] bg-[rgba(99,140,255,0.06)] px-4 py-3 text-[13px] leading-[19.5px] text-[#8a8f98]">
      <span className="text-[#638cff] font-[590]">Note: </span>{children}
    </div>
  )
}
