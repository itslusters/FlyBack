'use client'

/**
 * /pricing — Single-plan pricing page
 * €10/month subscription, no win no fee on airline claims
 */

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plane, Check, ArrowRight, Zap, Shield, Clock, HeadphonesIcon } from 'lucide-react'

const E = [0.25, 0.46, 0.45, 0.94] as const

function GText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'linear-gradient(135deg,#638cff 0%,#818fff 50%,#55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </span>
  )
}

const FEATURES = [
  'Unlimited flight compensation claims',
  'AI-generated EU261 & UK261 claim letters',
  'NEB escalation letters when airlines reject',
  'Claim status dashboard & timeline tracking',
  'Auto-reminder when airlines go silent',
  'Multi-flight route support (connecting flights)',
  'Priority email support',
  'New features as they ship',
]

const FAQ = [
  {
    q: 'How does "no win, no fee" work?',
    a: 'The €10/month subscription covers using FlyBack. Compensation from airlines goes 100% to you — we never take a cut of your payout.',
  },
  {
    q: 'What if my airline rejects my claim?',
    a: 'FlyBack generates an escalation letter to the National Enforcement Body (NEB) or Alternative Dispute Resolution (ADR) body for your country. This is included in your subscription.',
  },
  {
    q: 'Which flights qualify for EU261/UK261?',
    a: 'Flights departing from an EU/UK airport, or arriving at one on an EU/UK-based carrier. Delays of 3+ hours, cancellations with less than 14 days\u2019 notice, and denied boarding all qualify.',
  },
  {
    q: 'How much can I claim?',
    a: 'Up to €600 per passenger depending on flight distance: €250 for under 1,500 km, €400 for 1,500–3,500 km, and €600 for over 3,500 km.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your account settings before your next billing date and you won\u2019t be charged again.',
  },
]

export default function PricingPage() {
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
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-[13px] leading-[19.5px] text-[#8a8f98] hover:text-[#f7f8f8] transition-colors">
              Sign in
            </Link>
            <Link href="/check"
              className="rounded-full bg-[#f7f8f8] px-[14px] py-[6px] text-[13px] leading-[19.5px] text-[#08090a] hover:opacity-90">
              Check my flight
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-[900px] px-6 py-[88px]">

        {/* Page header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, ease: E }}
          className="mb-[64px] text-center">
          <p className="text-[13px] leading-[19.5px] text-[#638cff] mb-3">Pricing</p>
          <h1 className="text-[48px] font-[590] leading-[1.04] tracking-[-0.025em] text-[#f7f8f8]">
            Simple, honest pricing
          </h1>
          <p className="mt-4 text-[18px] leading-[27px] text-[#8a8f98] max-w-[500px] mx-auto">
            One plan. Everything included. Your compensation goes to you.
          </p>
        </motion.div>

        {/* Pricing card */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.44, delay: 0.08, ease: E }}
          className="mb-[64px]">
          {/* GlowCard */}
          <div style={{ background: 'linear-gradient(180deg,rgba(99,140,255,0.22) 0%,transparent 100%)', padding: '1px' }}
            className="rounded-[20px] mx-auto max-w-[480px]">
            <div className="rounded-[19px] bg-[#0c0d10] relative overflow-hidden">
              {/* Top-edge highlight */}
              <div aria-hidden className="absolute inset-x-0 top-0 h-px"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(99,140,255,0.6) 50%, transparent)' }} />
              {/* Ambient glow */}
              <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full"
                style={{ background: '#638cff', opacity: 0.08, filter: 'blur(55px)' }} />

              <div className="px-[40px] py-[40px]">
                {/* Plan name + badge */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[13px] font-[590] leading-[19.5px] text-[#638cff] uppercase tracking-[0.06em]">Pro</span>
                  <span className="rounded-full bg-[rgba(99,140,255,0.12)] border border-[rgba(99,140,255,0.2)] px-3 py-1 text-[12px] font-[590] text-[#638cff]">
                    Most popular
                  </span>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <span className="text-[56px] font-[590] leading-none tracking-[-0.03em]">
                    <GText>€10</GText>
                  </span>
                  <span className="text-[18px] leading-[27px] text-[#8a8f98] ml-1">/month</span>
                </div>
                <p className="text-[13px] leading-[19.5px] text-[#8a8f98] mb-8">
                  Cancel anytime. No contract.
                </p>

                {/* CTA */}
                <Link href="/login?next=/check"
                  className="flex items-center justify-center gap-2 w-full rounded-[10px] bg-[#f7f8f8] px-[18px] py-[13px] text-[15px] font-[590] leading-[22.5px] text-[#08090a] hover:opacity-90 transition-opacity">
                  Start free trial
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <p className="mt-3 text-center text-[12px] leading-[18px] text-[#8a8f98]">14-day free trial · No credit card required</p>

                {/* Divider */}
                <div className="my-8 h-px bg-white/[0.05]" />

                {/* Features */}
                <ul className="space-y-4">
                  {FEATURES.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[rgba(99,140,255,0.12)]">
                        <Check className="h-3 w-3 text-[#638cff]" />
                      </div>
                      <span className="text-[14px] leading-[21px] text-[#8a8f98]">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Value props */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.16, ease: E }}
          className="mb-[64px] grid gap-[28px] sm:grid-cols-2">
          {[
            { icon: <Zap className="h-4 w-4" />, title: 'Generated in seconds', body: 'AI writes a legally precise claim letter using your flight details. No forms, no fuss.' },
            { icon: <Shield className="h-4 w-4" />, title: 'No win, no fee', body: '100% of your airline compensation goes directly to you. We don\'t take a cut.' },
            { icon: <Clock className="h-4 w-4" />, title: 'Auto follow-ups', body: 'FlyBack reminds you when airlines have gone silent and generates escalation letters automatically.' },
            { icon: <HeadphonesIcon className="h-4 w-4" />, title: 'Priority support', body: 'Real support from people who know EU261 inside out. Not a help bot.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-[10px] border border-white/[0.05] bg-[#0c0d10] p-[28px]">
              <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-[8px] bg-[rgba(99,140,255,0.1)] text-[#638cff]">
                {icon}
              </div>
              <p className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8] mb-1">{title}</p>
              <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{body}</p>
            </div>
          ))}
        </motion.div>

        {/* FAQ */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.22, ease: E }}>
          <h2 className="mb-[28px] text-[24px] font-[590] leading-[1.2] tracking-[-0.02em] text-[#f7f8f8]">
            Frequently asked questions
          </h2>
          <div className="space-y-[1px] rounded-[10px] overflow-hidden border border-white/[0.05]">
            {FAQ.map(({ q, a }, i) => (
              <div key={i} className="bg-[#0c0d10] px-[28px] py-[20px] border-b border-white/[0.04] last:border-b-0">
                <p className="text-[15px] font-[590] leading-[22.5px] text-[#f7f8f8] mb-2">{q}</p>
                <p className="text-[13px] leading-[19.5px] text-[#8a8f98]">{a}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="mt-[64px] text-center">
          <p className="text-[16px] leading-[24px] text-[#8a8f98] mb-4">
            Ready to claim what you\u2019re owed?
          </p>
          <Link href="/check"
            className="inline-flex items-center gap-2 rounded-full bg-[#638cff] px-[20px] py-[10px] text-[14px] font-[590] leading-[21px] text-white hover:opacity-90 transition-opacity">
            Check my flight
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] py-[40px]">
        <div className="mx-auto max-w-[1200px] px-6 text-center text-[13px] leading-[19.5px] text-[#8a8f98]">
          <p>© 2026 FlyBack. EU261 & UK261 airline compensation.</p>
        </div>
      </footer>
    </div>
  )
}
