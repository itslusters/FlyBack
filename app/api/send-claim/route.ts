/**
 * POST /api/send-claim
 *
 * Sends a formal EU261/UK261 legal claim email directly to the airline's
 * customer relations department using Resend.
 *
 * Auth: Supabase session (normal flow) OR X-Internal-Secret header (webhook).
 * Attachments: Supabase Storage public URLs fetched and embedded as base64.
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getResend() { return new Resend(process.env.RESEND_API_KEY!) }

// ─── AIRLINE DIRECTORY ────────────────────────────────────────────────────────

const AIRLINES: Record<string, { email: string; name: string }> = {
  KE: { email: 'customer@koreanair.com',                    name: 'Korean Air' },
  OZ: { email: 'customer@flyasiana.com',                    name: 'Asiana Airlines' },
  '7C': { email: 'webmaster@jejuair.net',                   name: 'Jeju Air' },
  LJ: { email: 'customer@jinair.com',                       name: 'Jin Air' },
  BA: { email: 'customer.relations@ba.com',                 name: 'British Airways' },
  LH: { email: 'customer.relations@lufthansa.com',          name: 'Lufthansa' },
  AF: { email: 'customer.relations@airfrance.fr',           name: 'Air France' },
  KL: { email: 'passenger@klm.com',                         name: 'KLM' },
  FR: { email: 'customerquestions@ryanair.com',             name: 'Ryanair' },
  U2: { email: 'customerexperience@easyjet.com',            name: 'easyJet' },
  EK: { email: 'customeraffairs@emirates.com',              name: 'Emirates' },
  QR: { email: 'customercare@qatarairways.com',             name: 'Qatar Airways' },
  SQ: { email: 'customerrelations@singaporeair.com.sg',     name: 'Singapore Airlines' },
  CX: { email: 'customer@cathaypacific.com',                name: 'Cathay Pacific' },
  IB: { email: 'reclamaciones@iberia.es',                   name: 'Iberia' },
  TK: { email: 'customer.relations@thy.com',                name: 'Turkish Airlines' },
  AY: { email: 'customer.service@finnair.com',              name: 'Finnair' },
  SK: { email: 'kundservice@sas.se',                        name: 'SAS' },
  VY: { email: 'reclamaciones@vueling.com',                 name: 'Vueling' },
  AZ: { email: 'customer.relations@ita-airways.com',        name: 'ITA Airways' },
  NH: { email: 'customer@ana.co.jp',                        name: 'ANA' },
  JL: { email: 'customer@jal.com',                          name: 'Japan Airlines' },
  CA: { email: 'customer@airchina.com',                     name: 'Air China' },
  MU: { email: 'customer@ceair.com',                        name: 'China Eastern' },
  CI: { email: 'customer@china-airlines.com',               name: 'China Airlines' },
  TG: { email: 'customer@thaiairways.com',                  name: 'Thai Airways' },
}

// ─── EMAIL TEMPLATE ───────────────────────────────────────────────────────────

interface EmailData {
  flight: string; date: string; origin: string; dest: string
  delayMin: number; cancelled: boolean; amount: number
  km: number; tierLabel: string
  passengerName: string; passengerEmail: string; airlineName: string
}

function buildHtml(d: EmailData): string {
  const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const disruption = d.cancelled
    ? 'was cancelled'
    : `was delayed by ${Math.floor(d.delayMin / 60)}h ${d.delayMin % 60}m on arrival`
  const cancellationLaw = `Article 5(1)(c) of EU Regulation 261/2004 provides that cancellation entitles passengers to compensation under Article 7 unless the carrier informed the passenger at least 14 days prior to the scheduled departure time.`
  const delayLaw = `Per the Court of Justice of the EU in <em>Sturgeon v Condor Flugdienst GmbH</em> (C-402/07), a delay of 3 or more hours at the final destination is equivalent to a cancellation for the purposes of Article 7 compensation.`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  body{font-family:Georgia,serif;font-size:14px;line-height:1.75;color:#111;max-width:680px;margin:0 auto;padding:40px 24px}
  h2{font-size:15px;font-weight:bold;margin:28px 0 8px}
  .ref{background:#f7f7f7;border-left:3px solid #222;padding:12px 16px;margin:16px 0;font-size:13px;line-height:1.6}
  .amount{font-size:20px;font-weight:bold}
  ol,ul{padding-left:20px}
  li{margin:6px 0}
  hr{border:none;border-top:1px solid #ddd;margin:28px 0}
  .footer{font-size:11px;color:#888;margin-top:24px}
</style>
</head>
<body>
<p>${today}</p>
<p><strong>${d.airlineName} — Customer Relations Department</strong></p>

<p><strong>Re: Formal Compensation Claim under EU Regulation 261/2004 — Flight ${d.flight} — ${d.date}</strong></p>

<p>Dear Customer Relations Team,</p>

<p>I am writing to formally claim statutory compensation under <strong>EU Regulation (EC) No 261/2004</strong> (or, where applicable, UK Regulation 261/2004) in respect of the following flight disruption.</p>

<h2>1. Flight Details</h2>
<div class="ref">
  <strong>Flight Number:</strong> ${d.flight}<br>
  <strong>Departure Airport:</strong> ${d.origin}<br>
  <strong>Destination Airport:</strong> ${d.dest}<br>
  <strong>Scheduled Date:</strong> ${d.date}<br>
  <strong>Disruption:</strong> The flight ${disruption}.<br>
  <strong>Passenger:</strong> ${d.passengerName} (${d.passengerEmail})
</div>

<h2>2. Legal Basis</h2>
<p>Under <strong>Article 7(1) of EU Regulation 261/2004</strong>, I am entitled to fixed compensation of:</p>
<p class="amount">€${d.amount} per passenger</p>
<p>Route distance: ${d.km > 0 ? `${d.km.toLocaleString()} km` : 'over 3,500 km'} — tier: ${d.tierLabel}.</p>
<p>${d.cancelled ? cancellationLaw : delayLaw}</p>
<p>I note that aircraft technical failures do <em>not</em> constitute extraordinary circumstances as confirmed by the CJEU in <em>Wallentin-Hermann v Alitalia</em> (C-549/07). Should the carrier invoke extraordinary circumstances, I require full written evidence.</p>

<h2>3. Action Required</h2>
<ol>
  <li>Acknowledge receipt of this claim in writing within <strong>7 calendar days</strong>.</li>
  <li>Pay compensation of <strong>€${d.amount}</strong> within <strong>14 calendar days</strong> of this letter.</li>
</ol>

<p>Should a satisfactory response not be received within 14 days, I reserve the right to:</p>
<ul>
  <li>Escalate to the relevant <strong>National Enforcement Body (NEB)</strong>;</li>
  <li>Refer the matter to an approved <strong>Alternative Dispute Resolution (ADR)</strong> body; and</li>
  <li>Issue <strong>court proceedings</strong> in the jurisdiction of the departure airport without further notice.</li>
</ul>

<p>I trust this matter will be resolved promptly.</p>

<p>Yours faithfully,</p>
<p><strong>${d.passengerName}</strong><br>${d.passengerEmail}</p>

<hr>
<p class="footer">Claim filed via FlyBack — EU/UK261 passenger rights · flyback.world</p>
</body>
</html>`
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Accept session auth OR internal server secret (for webhook triggers)
  const internalSecret = req.headers.get('x-internal-secret')
  const isInternal = !!internalSecret && internalSecret === process.env.INTERNAL_API_SECRET

  if (!isInternal) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cs) => { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
        },
      },
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const {
    flight, date,
    origin = 'Unknown', dest = 'Unknown',
    delayMin = 0, cancelled = false,
    amount, km = 0, tierLabel = '',
    name, email,
    attachmentUrls = [] as string[],
  } = await req.json()

  if (!flight || !amount || !name || !email) {
    return NextResponse.json({ error: 'Missing required fields: flight, amount, name, email' }, { status: 400 })
  }

  const airlineCode = flight.replace(/\s+/g, '').slice(0, 2).toUpperCase()
  const airline = AIRLINES[airlineCode]
  if (!airline) {
    return NextResponse.json(
      { error: `Airline "${airlineCode}" not in directory. Submit manually using the generated letter.` },
      { status: 422 }
    )
  }

  // Fetch attachments (max 5, max 8MB each)
  const attachments: { filename: string; content: string }[] = []
  for (const url of (attachmentUrls as string[]).slice(0, 5)) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const contentLength = Number(res.headers.get('content-length') ?? 0)
        if (contentLength < 8 * 1024 * 1024) {
          const buf = await res.arrayBuffer()
          attachments.push({
            filename: decodeURIComponent(url.split('/').pop() ?? 'attachment'),
            content: Buffer.from(buf).toString('base64'),
          })
        }
      }
    } catch { /* skip unresolvable attachment */ }
  }

  const emailData: EmailData = {
    flight, date, origin, dest, delayMin, cancelled,
    amount, km, tierLabel,
    passengerName: name, passengerEmail: email, airlineName: airline.name,
  }

  const { data, error } = await getResend().emails.send({
    from: 'FlyBack Claims <support@flyback.world>',
    replyTo: email,
    to:      airline.email,
    cc:      email,
    subject: `EU261 Compensation Claim — ${flight.replace(/\s+/g, '')} — ${date}`,
    html:    buildHtml(emailData),
    ...(attachments.length > 0 && { attachments }),
  })

  if (error) {
    console.error('[send-claim]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, messageId: data?.id, to: airline.email })
}
