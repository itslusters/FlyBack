/**
 * POST /api/payments/verify
 *
 * Called by the client immediately after Portone payment succeeds.
 *
 * Security guarantees:
 *   1. Amount integrity  — actual Portone amount must equal SUBSCRIPTION_AMOUNT_KRW
 *   2. Ownership check   — merchant_uid encodes userId; verified against auth session
 *   3. Replay prevention — imp_uid UNIQUE constraint blocks double-spend at DB level
 *   4. Status check      — Portone payment.status must be 'paid'
 *
 * On success:
 *   - Inserts row into `payments` table (service role bypasses RLS)
 *   - Sets users.plan = 'pro' and plan_expires_at = now + 30 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient }  from '@supabase/ssr'
import { createClient }        from '@supabase/supabase-js'
import { cookies }             from 'next/headers'
import { getPortonePayment, PortoneError } from '@/lib/portone'

// Canonical subscription price (KRW).
// Must match the amount sent from the frontend.
const SUBSCRIPTION_AMOUNT_KRW = parseInt(
  process.env.SUBSCRIPTION_AMOUNT_KRW ?? '9900',
  10,
)

// Service-role client — needed to write to payments table (no client INSERT policy)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data } as const)
}
function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error } as const, { status })
}

// ─── MERCHANT UID HELPERS ─────────────────────────────────────────────────────

// Format: "claimkit_{userId}_{timestamp}"
// userId is a UUID (contains hyphens), so we split on the FIRST two underscores only.

function buildMerchantUid(userId: string): string {
  return `claimkit_${userId}_${Date.now()}`
}

function extractUserIdFromMerchantUid(merchantUid: string): string | null {
  // merchantUid = "claimkit_<uuid>_<timestamp>"
  // UUID format: 8-4-4-4-12 hex chars with hyphens
  const match = merchantUid.match(
    /^claimkit_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_\d+$/i
  )
  return match ? match[1] : null
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

interface VerifyBody {
  imp_uid:      string    // 포트원 결제 고유번호
  merchant_uid: string    // 우리 서버 주문번호
}

export async function POST(req: NextRequest) {
  // ── Auth ──
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
  if (!user) return fail('Unauthorized', 401)

  // ── Parse body ──
  let body: VerifyBody
  try { body = await req.json() } catch { return fail('Invalid JSON') }

  const { imp_uid, merchant_uid } = body
  if (!imp_uid?.trim() || !merchant_uid?.trim()) {
    return fail('imp_uid and merchant_uid are required')
  }

  // ── Ownership check ──
  // Extract userId from merchant_uid and verify it matches the authenticated user.
  // Prevents user A from claiming user B's payment.
  const uidFromMerchant = extractUserIdFromMerchantUid(merchant_uid)
  if (!uidFromMerchant || uidFromMerchant !== user.id) {
    return fail('merchant_uid does not belong to this user', 403)
  }

  const adminSupabase = getAdminSupabase()

  // ── Replay check (fast path before calling Portone API) ──
  const { data: existing } = await adminSupabase
    .from('payments')
    .select('id')
    .eq('imp_uid', imp_uid)
    .maybeSingle()

  if (existing) {
    return fail('This payment has already been processed', 409)
  }

  // ── Fetch payment from Portone ──
  let payment
  try {
    payment = await getPortonePayment(imp_uid)
  } catch (err) {
    if (err instanceof PortoneError) {
      const status = err.code === 'PAYMENT_NOT_FOUND' ? 404
                   : err.code === 'MISSING_CREDENTIALS' ? 503
                   : 502
      return fail(`Portone error: ${err.message}`, status)
    }
    return fail('Unexpected error fetching payment', 500)
  }

  // ── Amount integrity check (금액 변조 방지) ──
  if (payment.amount !== SUBSCRIPTION_AMOUNT_KRW) {
    // Log for fraud monitoring — don't expose canonical amount to client
    console.error(
      `[verify] Amount mismatch — expected: ${SUBSCRIPTION_AMOUNT_KRW}, actual: ${payment.amount}`,
      { imp_uid, user_id: user.id },
    )
    return fail('Payment amount does not match the subscription price', 422)
  }

  // ── Status check ──
  if (payment.status !== 'paid') {
    return fail(`Payment status is "${payment.status}" — expected "paid"`, 422)
  }

  // ── merchant_uid cross-check (Portone's record vs what we sent) ──
  if (payment.merchantUid !== merchant_uid) {
    return fail('merchant_uid mismatch between Portone record and request', 422)
  }

  // ── Persist payment + activate pro plan ──
  // Done sequentially; if payment insert succeeds but plan update fails,
  // the cron job / admin can reconcile via the payments table.

  const { error: paymentError } = await adminSupabase
    .from('payments')
    .insert({
      user_id:      user.id,
      imp_uid:      payment.impUid,
      merchant_uid: payment.merchantUid,
      amount:       payment.amount,
      currency:     'KRW',
      pay_method:   payment.payMethod,
      status:       payment.status,
      receipt_url:  payment.receiptUrl,
      paid_at:      payment.paidAt,
    })

  if (paymentError) {
    // Unique constraint violation = concurrent duplicate request
    if (paymentError.code === '23505') {
      return fail('This payment has already been processed', 409)
    }
    console.error('[verify] Payment insert failed:', paymentError)
    return fail('Failed to record payment', 500)
  }

  // Activate pro plan: expires 30 days from now
  const planExpiresAt = new Date()
  planExpiresAt.setDate(planExpiresAt.getDate() + 30)

  const { error: planError } = await adminSupabase
    .from('users')
    .update({ plan: 'pro', plan_expires_at: planExpiresAt.toISOString() })
    .eq('id', user.id)

  if (planError) {
    console.error('[verify] Plan update failed:', planError)
    // Payment is recorded — don't fail the response.
    // Manual reconciliation possible via payments table.
  }

  return ok({
    plan:           'pro',
    planExpiresAt:  planExpiresAt.toISOString(),
    receiptUrl:     payment.receiptUrl,
  })
}

// Export for use in frontend (merchant_uid must be generated server-side in production)
// For MVP, exported here and called from the client hook via a separate endpoint.
export { buildMerchantUid }
