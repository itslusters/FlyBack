/**
 * POST /api/claims/identify
 *
 * Receives HIGH-confidence recall matches from the client-side Fuse.js engine.
 * Verifies each match against recall_db, deduplicates, and inserts claim rows.
 *
 * Privacy guarantee: only OrderSummary fields (no ASIN, no full order list)
 * reach this route. Client filters + strips before calling.
 *
 * Request body: IdentifyBody
 * Response:     IdentifyResponse
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { ClaimType, ClaimStatus } from '@/lib/types'
import type { OrderSummary, RecallPayload } from '@/lib/types'

const MAX_MATCHES_PER_REQUEST = 50

// ─── REQUEST / RESPONSE SHAPES ────────────────────────────────────────────────

interface MatchInput {
  order:          OrderSummary
  cpsc_recall_id: string
  confidence:     'HIGH'          // Enforced: only HIGH accepted server-side
  fuse_score:     number          // Retained for future audit logging
}

interface IdentifyBody {
  matches: MatchInput[]
}

interface IdentifyResponse {
  created:       number
  skipped:       number           // Duplicates or unresolved recall IDs
  total_est_usd: number
  claim_ids:     string[]
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validateBody(body: unknown): body is IdentifyBody {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (!Array.isArray(b.matches) || b.matches.length === 0) return false
  if (b.matches.length > MAX_MATCHES_PER_REQUEST) return false
  return b.matches.every(
    (m): m is MatchInput =>
      m !== null &&
      typeof m === 'object' &&
      typeof (m as MatchInput).cpsc_recall_id === 'string' &&
      (m as MatchInput).confidence === 'HIGH' &&
      typeof (m as MatchInput).fuse_score === 'number' &&
      typeof (m as MatchInput).order?.order_id === 'string' &&
      typeof (m as MatchInput).order?.product_name === 'string'
  )
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cs) => { try { cs.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {} },
      },
    }
  )

  // ── Auth ──
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Parse + validate ──
  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!validateBody(body)) {
    return NextResponse.json(
      { error: `matches must be a non-empty array of HIGH-confidence items (max ${MAX_MATCHES_PER_REQUEST})` },
      { status: 400 }
    )
  }

  const { matches } = body

  // ── Fetch recall details for all unique IDs in one query ──
  const uniqueIds = [...new Set(matches.map(m => m.cpsc_recall_id))]

  const { data: recalls, error: recallFetchErr } = await supabase
    .from('recall_db')
    .select('id, cpsc_recall_id, remedy_type, claim_url, estimated_refund_usd')
    .in('cpsc_recall_id', uniqueIds)
    .eq('is_active', true)

  if (recallFetchErr) {
    console.error('[identify] recall fetch error', recallFetchErr)
    return NextResponse.json({ error: 'Failed to fetch recall data' }, { status: 500 })
  }

  const recallMap = new Map((recalls ?? []).map(r => [r.cpsc_recall_id, r]))

  // ── Fetch existing RECALL claims to deduplicate ──
  // Load only the JSONB fields needed for key construction — avoids full row scan
  const { data: existing } = await supabase
    .from('claims')
    .select('payload->amazon_order_id, payload->cpsc_recall_id')
    .eq('user_id', user.id)
    .eq('type', ClaimType.RECALL)

  const existingKeys = new Set<string>(
    (existing ?? []).map(
      (row) => `${row.amazon_order_id}::${row.cpsc_recall_id}`
    )
  )

  // ── Build insert rows — skip duplicates and unresolved recalls ──
  type ClaimRow = {
    user_id:       string
    type:          ClaimType
    status:        ClaimStatus
    amount_est_usd:number | null
    payload:       RecallPayload
  }

  const toInsert: ClaimRow[] = []

  for (const match of matches) {
    const recall = recallMap.get(match.cpsc_recall_id)
    if (!recall) continue   // Recall not in DB or inactive

    const key = `${match.order.order_id}::${match.cpsc_recall_id}`
    if (existingKeys.has(key)) continue   // Already saved

    toInsert.push({
      user_id:        user.id,
      type:           ClaimType.RECALL,
      status:         ClaimStatus.DISCOVERED,
      amount_est_usd: recall.estimated_refund_usd ?? null,
      payload: {
        cpsc_recall_id:  recall.cpsc_recall_id,
        product_name:    match.order.product_name,
        amazon_order_id: match.order.order_id,
        purchase_date:   match.order.purchase_date,
        remedy_type:     recall.remedy_type,
        claim_url:       recall.claim_url ?? '',
      },
    })
  }

  if (toInsert.length === 0) {
    const resp: IdentifyResponse = {
      created: 0, skipped: matches.length, total_est_usd: 0, claim_ids: [],
    }
    return NextResponse.json(resp)
  }

  const { data: created, error: insertErr } = await supabase
    .from('claims')
    .insert(toInsert)
    .select('id, amount_est_usd')

  if (insertErr) {
    console.error('[identify] insert error', insertErr)
    return NextResponse.json({ error: 'Failed to save claims' }, { status: 500 })
  }

  const totalEstUsd = (created ?? []).reduce(
    (sum, c) => sum + (c.amount_est_usd ?? 0),
    0
  )

  const resp: IdentifyResponse = {
    created:       created?.length ?? 0,
    skipped:       matches.length - (created?.length ?? 0),
    total_est_usd: totalEstUsd,
    claim_ids:     (created ?? []).map(c => c.id),
  }

  return NextResponse.json(resp)
}
