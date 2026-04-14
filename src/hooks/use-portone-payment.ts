'use client'

/**
 * usePortonePayment
 *
 * Client-side hook for triggering Portone V1 payments.
 * Loads the Portone JS SDK lazily, initiates checkout,
 * then calls /api/payments/verify on success.
 *
 * Portone V2 note:
 *   V2 uses @portone/browser-sdk with PortOne.requestPayment().
 *   V1 (this file) is more widely deployed as of 2026.
 *   To migrate: replace IMP.request_pay() with PortOne.requestPayment()
 *   and swap pg_provider values in PG_PARAMS.
 */

import { useState, useCallback } from 'react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type PayMethod = 'kakao' | 'toss' | 'card'

export type PaymentResult =
  | { ok: true;  impUid: string; merchantUid: string; planExpiresAt: string }
  | { ok: false; error: string }

interface UsePortonePaymentOptions {
  /** 포트원 가맹점 식별코드 (콘솔 → 시스템 설정 → 내 식별코드) */
  impCode:     string
  /** 구독 금액 (원 단위) — 서버 SUBSCRIPTION_AMOUNT_KRW와 반드시 일치해야 함 */
  amount:      number
  /** 결제창에 표시될 상품명 */
  productName: string
  /** 인증된 유저 정보 — merchant_uid 생성 및 buyer_* 필드에 사용 */
  user: {
    id:    string
    email: string
    name?: string
  }
}

// ─── PG PROVIDER MAP ──────────────────────────────────────────────────────────

interface PgParams {
  pg:         string   // Portone V1 PG code
  pay_method: string
}

const PG_PARAMS: Record<PayMethod, PgParams> = {
  kakao: { pg: 'kakaopay',     pay_method: 'card'      },
  toss:  { pg: 'tosspay',      pay_method: 'card'      },
  card:  { pg: 'html5_inicis', pay_method: 'card'      },
  //
  // V2 equivalents (when migrating to @portone/browser-sdk):
  //   kakao → pgProvider: 'KAKAOPAY'
  //   toss  → pgProvider: 'TOSSPAY_BRANDPAY'
  //   card  → pgProvider: 'KCP' or 'INICIS'
}

// ─── PORTONE V1 GLOBAL TYPES ──────────────────────────────────────────────────

interface ImpRequestPayParams {
  pg:           string
  pay_method:   string
  merchant_uid: string
  name:         string
  amount:       number
  buyer_email:  string
  buyer_name:   string
  buyer_tel:    string    // Required by some PGs (inicis). Pass empty string for kakao/toss.
  m_redirect_url?: string // Required for mobile web redirect flow
}

interface ImpCallback {
  success:      boolean
  error_code:   string | null
  error_msg:    string | null
  imp_uid:      string | null
  merchant_uid: string
}

declare global {
  interface Window {
    IMP?: {
      init: (impCode: string) => void
      request_pay: (params: ImpRequestPayParams, callback: (res: ImpCallback) => void) => void
    }
  }
}

// ─── SCRIPT LOADER ────────────────────────────────────────────────────────────

const PORTONE_SDK_URL = 'https://cdn.iamport.kr/v1/iamport.js'

function loadPortoneScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof window !== 'undefined' && window.IMP) { resolve(); return }
    // Script tag already in DOM (e.g. duplicate call)
    if (document.querySelector(`script[src="${PORTONE_SDK_URL}"]`)) {
      // Wait for it to finish loading
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${PORTONE_SDK_URL}"]`)!
      existing.addEventListener('load',  () => resolve())
      existing.addEventListener('error', () => reject(new Error('Portone SDK failed to load')))
      return
    }
    const script = document.createElement('script')
    script.src   = PORTONE_SDK_URL
    script.async = true
    script.onload  = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Portone SDK'))
    document.head.appendChild(script)
  })
}

// ─── MERCHANT UID ────────────────────────────────────────────────────────────
// Format: "claimkit_{userId}_{timestamp}"
// Server's extractUserIdFromMerchantUid() must parse this same format.

function buildMerchantUid(userId: string): string {
  return `claimkit_${userId}_${Date.now()}`
}

// ─── HOOK ─────────────────────────────────────────────────────────────────────

export function usePortonePayment(options: UsePortonePaymentOptions) {
  const [isPending, setIsPending] = useState(false)

  const requestPayment = useCallback(async (method: PayMethod): Promise<PaymentResult> => {
    if (isPending) return { ok: false, error: 'Payment already in progress' }

    setIsPending(true)

    try {
      // 1. Load SDK
      await loadPortoneScript()

      const IMP = window.IMP
      if (!IMP) return { ok: false, error: 'Portone SDK did not initialise' }

      // 2. Init (idempotent — safe to call multiple times)
      IMP.init(options.impCode)

      // 3. Trigger checkout
      const pg = PG_PARAMS[method]
      const merchantUid = buildMerchantUid(options.user.id)

      const callbackResult = await new Promise<ImpCallback>(resolve => {
        IMP.request_pay(
          {
            pg:           pg.pg,
            pay_method:   pg.pay_method,
            merchant_uid: merchantUid,
            name:         options.productName,
            amount:       options.amount,
            buyer_email:  options.user.email,
            buyer_name:   options.user.name ?? options.user.email,
            buyer_tel:    '',     // Required field — empty string accepted by kakao/toss
          },
          resolve,
        )
      })

      // 4. Handle Portone callback
      if (!callbackResult.success || !callbackResult.imp_uid) {
        return {
          ok:    false,
          error: callbackResult.error_msg ?? '결제에 실패했습니다.',
        }
      }

      // 5. Server-side verification (amount integrity + DB update)
      const res = await fetch('/api/payments/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          imp_uid:      callbackResult.imp_uid,
          merchant_uid: callbackResult.merchant_uid,
        }),
      })

      const data = await res.json() as
        | { success: true;  data: { planExpiresAt: string } }
        | { success: false; error: string }

      if (data.success === false) {
        return { ok: false, error: data.error }
      }

      return {
        ok:           true,
        impUid:       callbackResult.imp_uid,
        merchantUid:  callbackResult.merchant_uid,
        planExpiresAt: data.data.planExpiresAt,
      }

    } catch (err) {
      return {
        ok:    false,
        error: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
      }
    } finally {
      setIsPending(false)
    }
  }, [isPending, options])

  return { requestPayment, isPending }
}
