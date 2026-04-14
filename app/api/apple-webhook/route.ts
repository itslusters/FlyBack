/**
 * POST /api/apple-webhook
 *
 * Receives Apple App Store Server Notifications V2.
 * Payload is a signed JWS (JSON Web Signature) — decoded here,
 * then used to update claim status and trigger the claim email engine.
 *
 * PRODUCTION NOTE: Full certificate-chain verification against Apple's root CA
 * should be added before going live. See:
 * https://developer.apple.com/documentation/appstoreservernotifications/enabling_app_store_server_notifications
 *
 * appAccountToken convention (set in iOS StoreKit):
 *   "{supabase_user_id}:{claim_id}"
 *   e.g. "550e8400-e29b-41d4-a716-446655440000:clm_abc123"
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

// Service-role client — bypasses RLS for webhook updates
function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// ─── JWS HELPERS ──────────────────────────────────────────────────────────────

function decodeJWSPayload(jws: string): Record<string, unknown> {
  const parts = jws.split('.')
  if (parts.length !== 3) throw new Error('Invalid JWS: expected 3 parts')
  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf-8'))
}

// ─── NOTIFICATION TYPES ───────────────────────────────────────────────────────

// These indicate a payment was successfully completed
const PAID_EVENTS = new Set([
  'ONE_TIME_CHARGE',   // non-consumable / consumable
  'SUBSCRIBED',        // new subscription
  'DID_RENEW',         // subscription renewal
])

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: { signedPayload?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.signedPayload) {
    return NextResponse.json({ error: 'Missing signedPayload' }, { status: 400 })
  }

  // ── Decode notification ──────────────────────────────────────────────────
  let notification: Record<string, unknown>
  let txInfo: Record<string, unknown> | null = null

  try {
    notification = decodeJWSPayload(body.signedPayload)

    const data = notification.data as Record<string, unknown> | undefined
    if (data?.signedTransactionInfo) {
      txInfo = decodeJWSPayload(data.signedTransactionInfo as string)
    }
  } catch (e) {
    console.error('[apple-webhook] JWS decode error:', e)
    return NextResponse.json({ error: 'Failed to decode JWS' }, { status: 400 })
  }

  const notificationType = notification.notificationType as string
  const environment = (notification.data as Record<string, unknown> | undefined)?.environment as string

  console.log(`[apple-webhook] type=${notificationType} env=${environment}`)

  // Acknowledge but skip non-purchase events
  if (!PAID_EVENTS.has(notificationType)) {
    return NextResponse.json({ ok: true, skipped: notificationType })
  }

  if (!txInfo) {
    return NextResponse.json({ error: 'Missing signedTransactionInfo for purchase event' }, { status: 400 })
  }

  // ── Extract IDs from appAccountToken ────────────────────────────────────
  // Set by iOS: SKPayment.applicationUsername = "{userId}:{claimId}"
  const appAccountToken = txInfo.appAccountToken as string | undefined
  if (!appAccountToken) {
    console.warn('[apple-webhook] appAccountToken missing — cannot link to user/claim')
    return NextResponse.json({ ok: true, warning: 'No appAccountToken' })
  }

  const [userId, claimId] = appAccountToken.split(':')
  const transactionId = txInfo.transactionId as string | undefined
  const productId     = txInfo.productId     as string | undefined

  const db = getDb()

  // ── 1. Update claim status → paid ───────────────────────────────────────
  if (claimId) {
    const { error } = await db
      .from('claims')
      .update({
        status:           'paid',
        payment_provider: 'apple_iap',
        payment_id:       transactionId ?? null,
        paid_at:          new Date().toISOString(),
      })
      .eq('id',      claimId)
      .eq('user_id', userId)

    if (error) {
      console.error('[apple-webhook] claim update failed:', error.message)
    } else {
      console.log(`[apple-webhook] claim ${claimId} → paid (tx: ${transactionId})`)
    }
  }

  // ── 2. Fetch claim + passenger info, then trigger email engine ───────────
  const { data: claim } = await db
    .from('claims')
    .select('*')
    .eq(claimId ? 'id' : 'user_id', claimId ?? userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (claim) {
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const triggerResult = await fetch(`${siteUrl}/api/send-claim`, {
      method:  'POST',
      headers: {
        'Content-Type':     'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET ?? '',
      },
      body: JSON.stringify({
        flight:         claim.flight_number,
        date:           claim.flight_date,
        origin:         claim.origin          ?? 'Unknown',
        dest:           claim.destination     ?? 'Unknown',
        delayMin:       claim.delay_minutes   ?? 0,
        cancelled:      claim.cancelled       ?? false,
        amount:         claim.compensation_amount,
        km:             claim.distance_km     ?? 0,
        tierLabel:      claim.tier_label      ?? '',
        name:           claim.passenger_name,
        email:          claim.passenger_email,
        attachmentUrls: claim.attachments     ?? [],
      }),
    }).catch(e => {
      console.error('[apple-webhook] send-claim trigger error:', e)
      return null
    })

    if (triggerResult?.ok) {
      console.log(`[apple-webhook] send-claim triggered for claim ${claimId}`)
    }
  } else {
    console.warn(`[apple-webhook] No claim found for user ${userId}, claimId ${claimId}`)
  }

  // Always 200 — Apple retries on non-2xx
  return NextResponse.json({ ok: true, notificationType, transactionId, productId })
}
