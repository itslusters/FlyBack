/**
 * /privacy — Privacy Policy
 */

import Link from 'next/link'
import { Plane } from 'lucide-react'

const LAST_UPDATED = '13 April 2026'

export const metadata = {
  title: 'Privacy Policy | FlyBack',
}

export default function PrivacyPage() {
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

        {/* Header */}
        <div className="mb-[48px]">
          <p className="text-[13px] leading-[19.5px] text-[#638cff] mb-2">Legal</p>
          <h1 className="text-[40px] font-[590] leading-[1.1] tracking-[-0.025em] text-[#f7f8f8]">
            Privacy Policy
          </h1>
          <p className="mt-3 text-[13px] leading-[19.5px] text-[#8a8f98]">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose-custom space-y-[40px]">

          <Section title="1. Who we are">
            <p>FlyBack (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is an online service that helps passengers claim compensation under EU Regulation 261/2004 (EU261) and the UK equivalent (UK261). Our registered address and data controller details are available on request at <a href="mailto:privacy@flyback.app">privacy@flyback.app</a>.</p>
          </Section>

          <Section title="2. Data we collect">
            <p>We collect only what is necessary to deliver the service:</p>
            <ul>
              <li><strong>Account data:</strong> Email address, name, and authentication provider (Google OAuth or magic link).</li>
              <li><strong>Flight data:</strong> Flight number, date, route, delay duration, and disruption type as entered by you.</li>
              <li><strong>Personal details for claim letters:</strong> Full name, address, and booking reference — used solely to populate the claim letter you generate.</li>
              <li><strong>Payment data:</strong> Processed by Stripe. We never store card numbers; we receive only a Stripe customer ID and subscription status.</li>
              <li><strong>Usage data:</strong> Standard server logs (IP address, browser, pages visited) for security and performance. Retained for 90 days.</li>
            </ul>
          </Section>

          <Section title="3. How we use your data">
            <ul>
              <li>To authenticate your account and maintain your session.</li>
              <li>To generate EU261/UK261 claim letters on your behalf.</li>
              <li>To store and display your claim history in your dashboard.</li>
              <li>To process subscription payments via Stripe.</li>
              <li>To send transactional emails (magic links, claim status updates). We do not send marketing email without explicit consent.</li>
            </ul>
          </Section>

          <Section title="4. Legal basis (GDPR)">
            <p>We process your personal data on the following legal bases:</p>
            <ul>
              <li><strong>Contract performance</strong> (Art. 6(1)(b) GDPR): Processing necessary to provide the service you have subscribed to.</li>
              <li><strong>Legitimate interests</strong> (Art. 6(1)(f) GDPR): Security monitoring and fraud prevention.</li>
              <li><strong>Legal obligation</strong> (Art. 6(1)(c) GDPR): Retaining records as required by applicable law.</li>
            </ul>
          </Section>

          <Section title="5. Data sharing">
            <p>We do not sell your data. We share it only with:</p>
            <ul>
              <li><strong>Supabase</strong> — database and authentication infrastructure (EU-hosted).</li>
              <li><strong>Stripe</strong> — payment processing.</li>
              <li><strong>Vercel</strong> — hosting and CDN.</li>
              <li><strong>Anthropic</strong> — AI model used to generate claim letter text (no personal data is retained by Anthropic after generation).</li>
            </ul>
            <p>All sub-processors are contractually bound to process data only on our instructions and in compliance with GDPR.</p>
          </Section>

          <Section title="6. Data retention">
            <p>We retain your account and claim data for as long as your account is active. You may delete your account at any time from account settings, which permanently removes all associated data within 30 days. Anonymised usage analytics may be retained indefinitely.</p>
          </Section>

          <Section title="7. Your rights">
            <p>Under GDPR you have the right to:</p>
            <ul>
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request erasure (&ldquo;right to be forgotten&rdquo;)</li>
              <li>Restrict or object to processing</li>
              <li>Receive your data in a portable format</li>
              <li>Lodge a complaint with your national data protection authority</li>
            </ul>
            <p>To exercise any of these rights, email <a href="mailto:privacy@flyback.app">privacy@flyback.app</a>.</p>
          </Section>

          <Section title="8. Cookies">
            <p>We use strictly necessary cookies only: a session cookie to keep you logged in, and a Stripe cookie for payment processing. We do not use advertising or tracking cookies.</p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>We may update this policy to reflect changes in our practices or applicable law. When we do, we will update the &ldquo;Last updated&rdquo; date above and, for material changes, notify you by email.</p>
          </Section>

          <Section title="10. Contact">
            <p>Questions about this policy? Email <a href="mailto:privacy@flyback.app">privacy@flyback.app</a>.</p>
          </Section>

        </div>
      </main>

      <footer className="border-t border-white/[0.05] py-[40px]">
        <div className="mx-auto max-w-[1200px] px-6 flex flex-wrap justify-between gap-4 text-[13px] leading-[19.5px] text-[#8a8f98]">
          <p>© 2026 FlyBack</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-[#f7f8f8] transition-colors">Terms</Link>
            <Link href="/eu261" className="hover:text-[#f7f8f8] transition-colors">EU261</Link>
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
      <div className="space-y-3 text-[15px] leading-[24px] text-[#8a8f98] [&_strong]:text-[#f7f8f8] [&_a]:text-[#638cff] [&_a]:no-underline [&_a:hover]:underline [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:list-disc [&_ul]:marker:text-[#8a8f98]">
        {children}
      </div>
    </section>
  )
}
