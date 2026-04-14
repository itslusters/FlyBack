/**
 * GET  /api/check?iata=KE907&date=2026-04-13
 * POST /api/check  { "iata": "KE907", "date": "2026-04-13" }
 *
 * Checks a flight's delay via Aviationstack and returns EU261 eligibility.
 */

import { NextRequest, NextResponse } from 'next/server'

const BASE = 'http://api.aviationstack.com/v1/flights'

// ─── CORE LOGIC ───────────────────────────────────────────────────────────────

async function checkFlightDelay(flightIata: string, date: string) {
  const key = process.env.AVIATIONSTACK_API_KEY
  if (!key) throw new Error('AVIATIONSTACK_API_KEY not set')

  // Free plan: HTTP only, no flight_date filter (paid feature).
  const url =
    `${BASE}?access_key=${key}` +
    `&flight_iata=${encodeURIComponent(flightIata)}` +
    `&limit=1`

  const res  = await fetch(url, { cache: 'no-store' })
  const json = await res.json() as Record<string, unknown>

  if (json.error) {
    const e = json.error as Record<string, unknown>
    throw new Error(String(e.info ?? 'Aviationstack error'))
  }

  const data = json.data as Record<string, unknown>[] | undefined
  if (!data || data.length === 0) {
    throw new Error(`Flight ${flightIata} not found on ${date}`)
  }

  const f   = data[0] as Record<string, Record<string, unknown>>
  const dep = f.departure ?? {}
  const arr = f.arrival   ?? {}
  const aln = f.airline   ?? {}
  const flt = f.flight    ?? {}

  const delayMin  = Number(arr.delay ?? dep.delay ?? 0)
  const cancelled = String(f.flight_status ?? '').toLowerCase() === 'cancelled'
  const eligible  = cancelled || delayMin >= 180

  const dH = Math.floor(delayMin / 60)
  const dM = delayMin % 60

  return {
    flight:    String(flt.iata  ?? flightIata),
    date:      String(f.flight_date ?? date),
    airline:   String(aln.name  ?? ''),
    origin:    String(dep.iata  ?? ''),
    dest:      String(arr.iata  ?? ''),
    status:    String(f.flight_status ?? 'unknown'),
    delayMin,
    eligible,
    reason:    cancelled
                 ? 'Cancelled — EU261 Art.5 applies'
                 : eligible
                   ? `${dH}h ${dM}m delay — EU261 Art.7 applies`
                   : `${delayMin}m delay — below 3h threshold`,
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const iata = searchParams.get('iata')?.toUpperCase().replace(/\s/g, '')
  const date = searchParams.get('date')

  if (!iata || !date) {
    return NextResponse.json(
      { error: 'iata and date query params are required' },
      { status: 400 },
    )
  }

  try {
    const result = await checkFlightDelay(iata, date)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const status = msg.includes('not found') ? 404 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const iata = body.iata?.toUpperCase().replace(/\s/g, '')
  const date = body.date

  if (!iata || !date) {
    return NextResponse.json(
      { error: 'iata and date are required in the request body' },
      { status: 400 },
    )
  }

  try {
    const result = await checkFlightDelay(iata, date)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    const status = msg.includes('not found') ? 404 : 502
    return NextResponse.json({ error: msg }, { status })
  }
}
