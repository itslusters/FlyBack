'use server'

/**
 * saveFlightClaim — Server Action
 *
 * Persists a confirmed EU261/UK261 claim to the `claims` table.
 * Idempotent: if an identical claim (same user + flight + date) already exists,
 * returns the existing claim ID without creating a duplicate.
 *
 * Security:
 *   - Auth is verified server-side via cookie session.
 *   - DB write uses the service-role client (bypasses RLS INSERT restriction).
 *   - user_id is taken from the session, never from the client payload.
 */

import { createServerClient }  from '@supabase/ssr'
import { createClient }        from '@supabase/supabase-js'
import { cookies }             from 'next/headers'
import { ClaimType, ClaimStatus } from '@/lib/types'
import type { EU261Payload }   from '@/lib/types'

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface SaveFlightClaimInput {
  flightNumber:     string
  airlineIata:      string
  departureAirport: string
  arrivalAirport:   string
  scheduledDate:    string    // YYYY-MM-DD
  delayMinutes:     number
  cancelled:        boolean
  compensationEur:  number   // 250 | 400 | 600
  regulation:       'EU261' | 'UK261'
}

export type SaveFlightClaimResult =
  | { ok: true;  claimId: string; isNew: boolean }
  | { ok: false; error: string }

// ─── ADMIN CLIENT ─────────────────────────────────────────────────────────────
// Module-level: safe here since this file is server-only ('use server').

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
)

// ─── SERVER ACTION ────────────────────────────────────────────────────────────

export async function saveFlightClaim(
  input: SaveFlightClaimInput,
): Promise<SaveFlightClaimResult> {
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
  if (!user) return { ok: false, error: '로그인이 필요합니다.' }

  const flightNumber = input.flightNumber.trim().toUpperCase()
  const scheduledDate = input.scheduledDate.trim()

  // ── Idempotency check: fetch user's existing EU261 claims ──
  // O(n) over user claims — acceptable; a user rarely exceeds ~50 flight claims.
  const { data: existingClaims } = await adminSupabase
    .from('claims')
    .select('id, payload')
    .eq('user_id', user.id)
    .eq('type', ClaimType.EU261)

  const duplicate = existingClaims?.find((c) => {
    const p = c.payload as Partial<EU261Payload>
    return p.flight_number === flightNumber && p.scheduled_date === scheduledDate
  })

  if (duplicate) return { ok: true, claimId: duplicate.id, isNew: false }

  // ── Build EU261 payload ──
  // Cancelled flights: store delay as 9999 min (Infinity cannot be serialised to JSON).
  const payload: EU261Payload = {
    flight_number:        flightNumber,
    airline_iata:         input.airlineIata.trim().toUpperCase(),
    departure_airport:    input.departureAirport.trim().toUpperCase(),
    arrival_airport:      input.arrivalAirport.trim().toUpperCase(),
    scheduled_date:       scheduledDate,
    actual_delay_minutes: input.cancelled ? 9_999 : input.delayMinutes,
    compensation_tier:    input.compensationEur as 250 | 400 | 600,
    regulation:           input.regulation,
  }

  // ── Insert ──
  const { data, error } = await adminSupabase
    .from('claims')
    .insert({
      user_id:        user.id,
      type:           ClaimType.EU261,
      status:         ClaimStatus.DISCOVERED,
      amount_est_usd: input.compensationEur,  // EUR stored as USD-equivalent for the hero total
      payload,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[saveFlightClaim] insert failed:', error)
    return { ok: false, error: '저장에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  return { ok: true, claimId: data.id, isNew: true }
}
