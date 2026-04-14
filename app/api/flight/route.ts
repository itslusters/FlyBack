/**
 * GET /api/flight?iata=KE907&date=2026-04-13
 *
 * Server-side proxy for Aviationstack flights endpoint.
 * Keeps AVIATIONSTACK_API_KEY out of the browser bundle.
 *
 * Returns a normalised FlightResult or an error shape.
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── AIRPORT COORDINATES (Haversine fallback when Aviationstack lacks coords) ──

const AP: Record<string, { lat: number; lon: number; city: string }> = {
  ICN:{lat:37.4691,lon:126.4510,city:'Seoul'},
  GMP:{lat:37.5585,lon:126.7942,city:'Seoul'},
  LHR:{lat:51.4706,lon:-0.4619,city:'London'},
  LGW:{lat:51.1537,lon:-0.1821,city:'London'},
  CDG:{lat:49.0097,lon:2.5479,city:'Paris'},
  ORY:{lat:48.7233,lon:2.3794,city:'Paris'},
  FRA:{lat:50.0379,lon:8.5622,city:'Frankfurt'},
  AMS:{lat:52.3086,lon:4.7639,city:'Amsterdam'},
  MAD:{lat:40.4936,lon:-3.5668,city:'Madrid'},
  FCO:{lat:41.8003,lon:12.2389,city:'Rome'},
  NRT:{lat:35.7647,lon:140.3864,city:'Tokyo'},
  HND:{lat:35.5494,lon:139.7798,city:'Tokyo'},
  JFK:{lat:40.6413,lon:-73.7781,city:'New York'},
  EWR:{lat:40.6895,lon:-74.1745,city:'New York'},
  LAX:{lat:33.9425,lon:-118.4081,city:'Los Angeles'},
  ORD:{lat:41.9742,lon:-87.9073,city:'Chicago'},
  SIN:{lat:1.3644,lon:103.9915,city:'Singapore'},
  DXB:{lat:25.2532,lon:55.3657,city:'Dubai'},
  HKG:{lat:22.3080,lon:113.9185,city:'Hong Kong'},
  BKK:{lat:13.6900,lon:100.7501,city:'Bangkok'},
  SYD:{lat:-33.9399,lon:151.1753,city:'Sydney'},
  MEL:{lat:-37.6733,lon:144.8430,city:'Melbourne'},
  PEK:{lat:40.0799,lon:116.6031,city:'Beijing'},
  PVG:{lat:31.1443,lon:121.8083,city:'Shanghai'},
  DEL:{lat:28.5665,lon:77.1031,city:'Delhi'},
  BOM:{lat:19.0896,lon:72.8656,city:'Mumbai'},
  GRU:{lat:-23.4356,lon:-46.4731,city:'São Paulo'},
  JNB:{lat:-26.1367,lon:28.2411,city:'Johannesburg'},
  CAI:{lat:30.1219,lon:31.4056,city:'Cairo'},
  IST:{lat:41.2753,lon:28.7519,city:'Istanbul'},
  MUC:{lat:48.3537,lon:11.7750,city:'Munich'},
  BCN:{lat:41.2971,lon:2.0785,city:'Barcelona'},
  MXP:{lat:45.6306,lon:8.7281,city:'Milan'},
  VIE:{lat:48.1102,lon:16.5697,city:'Vienna'},
  ZRH:{lat:47.4647,lon:8.5492,city:'Zurich'},
  CPH:{lat:55.6180,lon:12.6508,city:'Copenhagen'},
  ARN:{lat:59.6519,lon:17.9186,city:'Stockholm'},
  OSL:{lat:60.1976,lon:11.1004,city:'Oslo'},
  HEL:{lat:60.3172,lon:24.9633,city:'Helsinki'},
  DUB:{lat:53.4213,lon:-6.2700,city:'Dublin'},
  MAN:{lat:53.3537,lon:-2.2750,city:'Manchester'},
  BRU:{lat:50.9010,lon:4.4844,city:'Brussels'},
  LIS:{lat:38.7813,lon:-9.1359,city:'Lisbon'},
  ATH:{lat:37.9364,lon:23.9445,city:'Athens'},
  WAW:{lat:52.1657,lon:20.9671,city:'Warsaw'},
  PRG:{lat:50.1008,lon:14.2600,city:'Prague'},
  BUD:{lat:47.4298,lon:19.2611,city:'Budapest'},
  KUL:{lat:2.7456,lon:101.7099,city:'Kuala Lumpur'},
  CGK:{lat:-6.1256,lon:106.6559,city:'Jakarta'},
  MNL:{lat:14.5086,lon:121.0197,city:'Manila'},
  NAN:{lat:-17.7553,lon:177.4431,city:'Nadi'},
  AKL:{lat:-37.0082,lon:174.7917,city:'Auckland'},
}

function hav(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, d2r = Math.PI / 180
  const dL = (lat2 - lat1) * d2r, dO = (lon2 - lon1) * d2r
  const a = Math.sin(dL/2)**2 + Math.cos(lat1*d2r)*Math.cos(lat2*d2r)*Math.sin(dO/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function tier(km: number) {
  if (km <= 1500) return { amount: 250, label: '≤ 1,500 km' }
  if (km <= 3500) return { amount: 400, label: '1,500–3,500 km' }
  return { amount: 600, label: '> 3,500 km' }
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface FlightResult {
  iata:          string
  date:          string
  status:        string          // 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted'
  airline:       string
  origin:        string          // IATA
  destination:   string          // IATA
  originCity:    string
  destCity:      string
  originName:    string
  destName:      string
  gate:          string
  delayMin:      number          // arrival delay in minutes (0 if none)
  cancelled:     boolean
  km:            number
  compensation:  number          // € amount
  tierLabel:     string
  eligible:      boolean
  scheduledDep:  string
  scheduledArr:  string
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const iata = (searchParams.get('iata') ?? '').toUpperCase().replace(/\s/g, '')
  const date = searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  if (!iata) {
    return NextResponse.json({ error: 'iata param required' }, { status: 400 })
  }

  const key = process.env.AVIATIONSTACK_API_KEY
  if (!key) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  // Free plan: HTTP only, no flight_date filter (paid feature).
  // Search by IATA only — returns the most recent/active flight for that number.
  const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=${iata}&limit=1`

  let raw: Record<string, unknown>
  try {
    const res = await fetch(url, { cache: 'no-store' })
    raw = await res.json()
  } catch {
    return NextResponse.json({ error: 'Aviationstack unreachable' }, { status: 502 })
  }

  // API-level error — surface the info string if present
  if (raw.error) {
    const apiErr = raw.error as Record<string, unknown>
    const msg = String(apiErr.info ?? apiErr.message ?? apiErr.type ?? 'Aviationstack error')
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const data = raw.data as Record<string, unknown>[] | undefined
  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Flight not found' }, { status: 404 })
  }

  const f = data[0] as Record<string, Record<string, unknown>>

  const dep = f.departure ?? {}
  const arr = f.arrival   ?? {}
  const aln = f.airline   ?? {}
  const flt = f.flight    ?? {}

  const originIata = String(dep.iata ?? '')
  const destIata   = String(arr.iata ?? '')

  // Coordinates from our table (Aviationstack free tier doesn't return coords)
  const origAP = AP[originIata]
  const destAP  = AP[destIata]
  const km      = origAP && destAP
    ? hav(origAP.lat, origAP.lon, destAP.lat, destAP.lon)
    : 0

  const { amount, label } = tier(km)

  const delayMin   = Number(arr.delay ?? dep.delay ?? 0)
  const cancelled  = String(f.flight_status ?? '').toLowerCase() === 'cancelled'
  const eligible   = cancelled || delayMin >= 180

  const result: FlightResult = {
    iata:         String(flt.iata ?? iata),
    date:         String(f.flight_date ?? date),
    status:       String(f.flight_status ?? 'unknown'),
    airline:      String(aln.name ?? ''),
    origin:       originIata,
    destination:  destIata,
    originCity:   origAP?.city ?? String(dep.airport ?? originIata),
    destCity:     destAP?.city ?? String(arr.airport ?? destIata),
    originName:   String(dep.airport ?? ''),
    destName:     String(arr.airport ?? ''),
    gate:         String(dep.gate ?? '—'),
    delayMin,
    cancelled,
    km:           Math.round(km),
    compensation: amount,
    tierLabel:    label,
    eligible,
    scheduledDep: String(dep.scheduled ?? ''),
    scheduledArr: String(arr.scheduled ?? ''),
  }

  return NextResponse.json(result)
}
