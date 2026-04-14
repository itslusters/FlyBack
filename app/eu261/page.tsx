/**
 * /eu261 — EU Regulation 261/2004 reference guide
 */

import Link from 'next/link'
import { Plane, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'EU261 Explained | FlyBack',
  description: 'Your rights under EU Regulation 261/2004 — flight delays, cancellations, and denied boarding compensation up to €600.',
}

const TIERS = [
  { distance: 'Under 1,500 km', examples: 'London–Amsterdam, Paris–Madrid', amount: '€250' },
  { distance: '1,500–3,500 km', examples: 'London–Cairo, Berlin–Reykjavik', amount: '€400' },
  { distance: 'Over 3,500 km', examples: 'London–New York, Frankfurt–Seoul', amount: '€600' },
]

export default function EU261Page() {
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
            EU Regulation 261/2004
          </h1>
          <p className="mt-4 text-[17px] leading-[26px] text-[#8a8f98]">
            Your rights when flights are delayed, cancelled, or overbooked — and how to claim up to €600 in compensation.
          </p>
        </div>

        <div className="space-y-[40px]">

          <Section title="What is EU261?">
            <p>EU Regulation 261/2004 is a European Union law that grants air passengers the right to compensation and assistance when their flight is significantly delayed, cancelled at short notice, or when they are denied boarding due to overbooking.</p>
            <p>It applies to flights departing from any EU airport, as well as flights arriving at an EU airport if operated by an EU-based carrier.</p>
          </Section>

          <Section title="Which flights are covered?">
            <Checklist items={[
              'Any flight departing from an airport in the EU (regardless of airline)',
              'Flights arriving in the EU operated by an EU-based carrier',
              'Includes Iceland, Norway, and Switzerland (EEA)',
              'Applies to both economy and business class passengers',
              'Applies to flights booked directly or through a travel agent',
            ]} />
            <Note>Non-EU carriers on inbound flights to the EU are not covered unless they operate EU-registered subsidiaries.</Note>
          </Section>

          <Section title="Qualifying disruptions">
            <SubSection title="Delay (Art. 7)">
              <p>You are entitled to compensation if your flight arrives at the final destination 3 or more hours late. The delay is measured at the time the aircraft door opens at the destination — not departure time.</p>
            </SubSection>
            <SubSection title="Cancellation (Art. 5)">
              <p>You are entitled to compensation if your flight is cancelled with less than 14 days&rsquo; notice before the scheduled departure. If the airline offers a rerouting that departs within 1 hour and arrives within 2 hours of the original time, compensation may be reduced by 50%.</p>
            </SubSection>
            <SubSection title="Denied boarding (Art. 4)">
              <p>If you are bumped from a flight due to overbooking (and have not voluntarily given up your seat), you are entitled to compensation at the same rates as a cancellation.</p>
            </SubSection>
          </Section>

          <Section title="Compensation amounts">
            <p>The amount depends on the flight distance (great-circle distance between departure and final destination airports):</p>
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
            <Note>Compensation may be reduced by 50% if the airline offers rerouting with minor time differences (see Art. 7(2)).</Note>
          </Section>

          <Section title="Right to care (Art. 9)">
            <p>Regardless of compensation eligibility, if your flight is delayed by 2+ hours, the airline must provide:</p>
            <Checklist items={[
              'Meals and refreshments proportional to the waiting time',
              'Two free phone calls, emails, or faxes',
              'Hotel accommodation if an overnight stay is required',
              'Transport between the airport and hotel',
            ]} />
            <p>If the airline fails to provide these, keep your receipts — you can claim reasonable costs back separately.</p>
          </Section>

          <Section title="Extraordinary circumstances">
            <p>Airlines are exempt from paying compensation if the disruption was caused by &ldquo;extraordinary circumstances&rdquo; that could not have been avoided even with all reasonable measures. Common examples include:</p>
            <Checklist items={[
              'Severe weather (genuine air traffic control closure, not light rain)',
              'Political instability or security threats',
              'Air traffic control strikes (not airline staff strikes)',
              'Bird strikes or hidden manufacturing defects',
            ]} negative />
            <p>Technical problems with the aircraft are <strong>not</strong> extraordinary circumstances unless caused by a hidden defect discovered during the flight.</p>
          </Section>

          <Section title="Claim time limits">
            <p>Time limits vary by country. As a general guide:</p>
            <Checklist items={[
              'Most EU countries: 2–6 years from the date of the flight',
              'France: 5 years',
              'Germany: 3 years',
              'Ireland / UK: 6 years',
            ]} />
            <p>File as soon as possible — airlines are harder to negotiate with as time passes and records may no longer be available.</p>
          </Section>

          <Section title="How to claim">
            <p>Step 1: Write to the airline directly (by email or their online form) citing EU Regulation 261/2004 and stating the compensation amount you are entitled to.</p>
            <p>Step 2: If the airline does not respond within 14 days or rejects your claim, escalate to the National Enforcement Body (NEB) or Alternative Dispute Resolution (ADR) body in the country where the disruption occurred.</p>
            <p>Step 3: If ADR fails, small claims court is an option in most EU countries with low filing fees.</p>
            <Note>FlyBack generates Steps 1 and 2 for you automatically.</Note>
          </Section>

        </div>

        {/* CTA */}
        <div className="mt-[64px] rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">Check if your flight qualifies</p>
            <p className="text-[13px] leading-[19.5px] text-[#8a8f98] mt-1">Enter your flight number for an instant EU261 eligibility check.</p>
          </div>
          <Link href="/check"
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#638cff] px-[18px] py-[9px] text-[13px] font-[590] leading-[19.5px] text-white hover:opacity-90 transition-opacity">
            Check my flight
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* See also */}
        <div className="mt-6 text-center">
          <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">
            UK-based flight?{' '}
            <Link href="/uk261" className="text-[#638cff] hover:underline">Read our UK261 guide</Link>
          </p>
        </div>

      </main>

      <footer className="border-t border-white/[0.05] py-[40px]">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-wrap justify-between gap-4 text-[13px] leading-[19.5px] text-[#8a8f98]">
          <p>© 2026 FlyBack</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-[#f7f8f8] transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-[#f7f8f8] transition-colors">Terms</Link>
            <Link href="/uk261" className="hover:text-[#f7f8f8] transition-colors">UK261</Link>
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
