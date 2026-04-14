/**
 * GET /api/cron/sync-recalls
 *
 * Vercel Cron: runs daily at 06:00 UTC.
 * Add to vercel.json:
 *   { "crons": [{ "path": "/api/cron/sync-recalls", "schedule": "0 6 * * *" }] }
 *
 * Query params:
 *   ?full=true  → sync last 365 days (initial data load only)
 *   default     → sync last 7 days
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { RemedyType } from '@/lib/types'

// Service-role client bypasses RLS — cron jobs have no user session
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

const CPSC_API = 'https://www.saferproducts.gov/RestWebServices/Recall'
const UPSERT_CHUNK = 100

// ─── CPSC API TYPES (minimal — only fields we consume) ────────────────────────

interface CpscProduct  { Name: string; Type: string | null }
interface CpscRemedy   { Name: string; RemedyType: string | null }
interface CpscHazard   { Name: string }
interface CpscCompany  { Name: string }

interface CpscRecall {
  RecallNumber:  string
  RecallDate:    string          // "2024-01-15T00:00:00"
  Title:         string
  URL:           string
  Products:      CpscProduct[]
  Manufacturers: CpscCompany[]
  Retailers:     CpscCompany[]
  Remedies:      CpscRemedy[]
  Hazards:       CpscHazard[]
}

// ─── TRANSFORMERS ──────────────────────────────────────────────────────────────

const REMEDY_MAP: Record<string, RemedyType> = {
  'refund':              'REFUND',
  'replace':             'REPLACEMENT',
  'new design':          'REPLACEMENT',
  'repair':              'REPAIR',
  'stop use':            'STOP_USE',
  'stop using':          'STOP_USE',
  'no longer available': 'STOP_USE',
}

function normalizeRemedy(raw: string | null | undefined): RemedyType {
  if (!raw) return 'STOP_USE'
  return REMEDY_MAP[raw.toLowerCase().trim()] ?? 'STOP_USE'
}

function isoDate(cpscDatetime: string): string {
  // CPSC returns "2024-01-15T00:00:00" — truncate to date only
  return cpscDatetime.split('T')[0]
}

function extractBrands(recall: CpscRecall): string[] {
  const names = [
    ...recall.Manufacturers.map(m => m.Name),
    ...recall.Retailers.map(r => r.Name),
  ].filter(Boolean)
  return [...new Set(names)]  // deduplicate
}

function transform(r: CpscRecall) {
  return {
    cpsc_recall_id:      r.RecallNumber,
    title:               r.Title,
    product_names:       r.Products.map(p => p.Name).filter(Boolean),
    brands:              extractBrands(r),
    category:            r.Products[0]?.Type ?? 'Unknown',
    recall_date:         isoDate(r.RecallDate),
    remedy_type:         normalizeRemedy(r.Remedies[0]?.RemedyType),
    hazard_description:  r.Hazards[0]?.Name ?? '',
    claim_url:           r.URL,
    estimated_refund_usd: null,   // CPSC API does not expose dollar amounts
    is_active:           true,
    last_synced_at:      new Date().toISOString(),
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vercel Cron sets Authorization: Bearer <CRON_SECRET> automatically
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const full = new URL(req.url).searchParams.get('full') === 'true'
  const daysBack = full ? 365 : 7
  const since = new Date()
  since.setDate(since.getDate() - daysBack)
  const startDate = since.toISOString().split('T')[0]

  try {
    const res = await fetch(
      `${CPSC_API}?format=json&RecallDateStart=${startDate}`,
      {
        headers: { Accept: 'application/json' },
        // Force cache bypass — cron must always fetch fresh data
        cache: 'no-store',
      }
    )

    if (!res.ok) {
      throw new Error(`CPSC API ${res.status}: ${res.statusText}`)
    }

    const raw: unknown = await res.json()

    if (!Array.isArray(raw)) {
      throw new Error('CPSC API response is not an array')
    }

    const rows = (raw as CpscRecall[]).map(transform)

    // Batch upsert to stay under Supabase's 1 MB request limit
    const supabase = getSupabase()
    let upserted = 0
    for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
      const chunk = rows.slice(i, i + UPSERT_CHUNK)

      const { error } = await supabase
        .from('recall_db')
        .upsert(chunk, {
          onConflict: 'cpsc_recall_id',
          ignoreDuplicates: false,  // Always overwrite — keeps last_synced_at fresh
        })

      if (error) throw error
      upserted += chunk.length
    }

    return NextResponse.json({ ok: true, synced: upserted, since: startDate })

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync-recalls]', message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
