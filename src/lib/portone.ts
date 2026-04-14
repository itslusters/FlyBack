/**
 * Portone (구 아이엠포트) REST API v1 client — server-side only.
 * Never import in client components — API key/secret would leak.
 *
 * Docs: https://developers.portone.io/api/rest-v1
 *
 * Token lifecycle: 30-minute expiry.
 * Serverless: fetch a fresh token per invocation (no shared cache).
 * Overhead is ~100 ms — acceptable for a payment verify call.
 */

const BASE = 'https://api.iamport.kr'

// ─── ERROR ────────────────────────────────────────────────────────────────────

export type PortoneErrorCode =
  | 'MISSING_CREDENTIALS'
  | 'TOKEN_FETCH_FAILED'
  | 'PAYMENT_FETCH_FAILED'
  | 'PAYMENT_NOT_FOUND'
  | 'NETWORK_ERROR'

export class PortoneError extends Error {
  constructor(
    public readonly code: PortoneErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'PortoneError'
  }
}

// ─── RAW API SHAPES (minimal — only fields we consume) ────────────────────────

interface PortoneTokenBody {
  code:     number
  message:  string | null
  response: { access_token: string; expired_at: number } | null
}

interface PortonePaymentBody {
  code:     number
  message:  string | null
  response: {
    imp_uid:      string
    merchant_uid: string
    amount:       number        // 실 결제금액 (KRW)
    status:       'ready' | 'paid' | 'cancelled' | 'failed'
    pay_method:   string        // 'card' | 'kakaopay' | 'tosspay' | ...
    paid_at:      number        // Unix timestamp (0 if not paid)
    buyer_email:  string
    receipt_url:  string
    fail_reason:  string | null
  } | null
}

// ─── PUBLIC SHAPE ─────────────────────────────────────────────────────────────

export interface PortonePayment {
  impUid:      string
  merchantUid: string
  amount:      number            // KRW
  status:      'ready' | 'paid' | 'cancelled' | 'failed'
  payMethod:   string
  paidAt:      string | null     // ISO datetime, null if not yet paid
  buyerEmail:  string
  receiptUrl:  string
  failReason:  string | null
}

// ─── INTERNAL API CALLS ───────────────────────────────────────────────────────

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, { cache: 'no-store', ...init })
  } catch (err) {
    throw new PortoneError('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error')
  }
  return res.json() as Promise<T>
}

/**
 * Acquire a short-lived access token using API key + secret.
 * Throws PortoneError on failure.
 */
async function getAccessToken(): Promise<string> {
  const key    = process.env.PORTONE_API_KEY
  const secret = process.env.PORTONE_API_SECRET

  if (!key || !secret) {
    throw new PortoneError('MISSING_CREDENTIALS', 'PORTONE_API_KEY or PORTONE_API_SECRET is not set')
  }

  const body = await fetchJson<PortoneTokenBody>(`${BASE}/users/getToken`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ imp_key: key, imp_secret: secret }),
  })

  if (body.code !== 0 || !body.response?.access_token) {
    throw new PortoneError('TOKEN_FETCH_FAILED', body.message ?? 'Failed to issue Portone access token')
  }

  return body.response.access_token
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Fetch and normalise a single payment record by imp_uid.
 *
 * Handles token issuance internally — callers don't manage tokens.
 * Throws PortoneError for any failure; never returns null.
 *
 * @param impUid  포트원 결제 고유번호 (imp_uid), e.g. "imp_123456789012"
 */
export async function getPortonePayment(impUid: string): Promise<PortonePayment> {
  const token = await getAccessToken()

  const body = await fetchJson<PortonePaymentBody>(
    `${BASE}/payments/${encodeURIComponent(impUid)}`,
    { headers: { Authorization: token } },
  )

  if (body.code !== 0) {
    throw new PortoneError('PAYMENT_FETCH_FAILED', body.message ?? `Failed to fetch payment ${impUid}`)
  }
  if (!body.response) {
    throw new PortoneError('PAYMENT_NOT_FOUND', `No payment found for imp_uid: ${impUid}`)
  }

  const r = body.response
  return {
    impUid:      r.imp_uid,
    merchantUid: r.merchant_uid,
    amount:      r.amount,
    status:      r.status,
    payMethod:   r.pay_method,
    paidAt:      r.paid_at ? new Date(r.paid_at * 1000).toISOString() : null,
    buyerEmail:  r.buyer_email,
    receiptUrl:  r.receipt_url,
    failReason:  r.fail_reason,
  }
}
