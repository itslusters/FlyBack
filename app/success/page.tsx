'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

function SuccessContent() {
  const params = useSearchParams()
  const flight = params.get('flight') ?? ''
  const amount = params.get('amount') ?? ''

  return (
    <main style={{ minHeight: '100vh', background: '#08090a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'rgba(99,140,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CheckCircle size={36} color="#638cff" />
          </div>
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f7f8f8', marginBottom: 12 }}>
          Payment successful
        </h1>
        <p style={{ color: '#8a8f98', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
          Your claim for flight <strong style={{ color: '#f7f8f8' }}>{flight}</strong> has been submitted.
        </p>
        {amount && (
          <p style={{ color: '#8a8f98', fontSize: 15, lineHeight: 1.6, marginBottom: 32 }}>
            We'll pursue up to <strong style={{ color: '#638cff' }}>€{amount}</strong> on your behalf.
          </p>
        )}

        {/* Card */}
        <div style={{
          background: '#0c0d10',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          textAlign: 'left',
        }}>
          <p style={{ color: '#8a8f98', fontSize: 13, marginBottom: 16 }}>What happens next</p>
          {[
            ['Confirmation email', 'Check your inbox for a payment receipt and case reference.'],
            ['Airline contact', 'We contact the airline within 24 hours on your behalf.'],
            ['Updates', "You'll receive status updates as your claim progresses."],
            ['Payout', 'Compensation is transferred directly to you once resolved.'],
          ].map(([title, desc], i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 16 : 0 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'rgba(99,140,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, marginTop: 1,
                fontSize: 11, fontWeight: 700, color: '#638cff',
              }}>{i + 1}</div>
              <div>
                <p style={{ color: '#f7f8f8', fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{title}</p>
                <p style={{ color: '#8a8f98', fontSize: 13 }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link href="/dashboard" style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #638cff, #818fff, #55ccff)',
            borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600,
            textDecoration: 'none',
          }}>
            View my claims
          </Link>
          <Link href="/" style={{
            padding: '10px 20px',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, color: '#8a8f98', fontSize: 14,
            textDecoration: 'none',
          }}>
            Go home
          </Link>
        </div>
      </div>
    </main>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
