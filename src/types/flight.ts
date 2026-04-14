/**
 * Flight domain types.
 * Supersedes FlightData in lib/types.ts — import from here for all flight work.
 */

import type { ClaimStatus } from '@/lib/types'

// ─── PRIMITIVES ────────────────────────────────────────────────────────────────

export interface AirportCoords {
  iata: string    // 3-letter IATA code
  lat:  number    // decimal degrees, positive = N
  lon:  number    // decimal degrees, positive = E
}

/** Result of parsing a raw flight number string (e.g. "ba 123", "LH456A") */
export interface ParsedFlightNumber {
  raw:        string    // original user input
  airline:    string    // "BA"  — 2 or 3 uppercase letters
  number:     string    // "123" or "456A"
  normalized: string    // "BA123" — airline + number, no space
}

// ─── FLIGHT DATA (from AviationStack API) ──────────────────────────────────────

export type FlightStatus =
  | 'SCHEDULED'   // Hasn't departed yet
  | 'IN_AIR'      // Airborne
  | 'LANDED'      // Arrived (may still have delay if late)
  | 'CANCELLED'   // EU261 Article 5 applicable
  | 'DIVERTED'    // Different arrival airport

export interface FlightData {
  flight_number:       string           // "BA123"
  airline_iata:        string           // "BA"
  airline_name:        string | null
  departure_airport:   string           // "LHR"
  arrival_airport:     string           // "CDG"
  scheduled_departure: string           // ISO 8601 datetime
  actual_departure:    string | null
  scheduled_arrival:   string           // ISO 8601 datetime
  actual_arrival:      string | null
  status:              FlightStatus
  delay_minutes:       number           // 0 if on-time or unknown; positive = late
}

// ─── EU261 RESULT ──────────────────────────────────────────────────────────────

export type Regulation = 'EU261' | 'UK261' | 'NONE'

export type CompensationEur = 0 | 250 | 400 | 600

export interface EU261Result {
  eligible:         boolean
  compensation_eur: CompensationEur
  regulation:       Regulation
  reason:           string              // Human-readable explanation shown in UI
}

// ─── FLIGHT CLAIM ──────────────────────────────────────────────────────────────

/** A fully resolved flight compensation claim — stored as EU261Payload in claims table */
export interface FlightClaim {
  // Identity
  id:      string
  user_id: string

  // Flight facts (sourced from AviationStack)
  flight_number:     string
  airline_iata:      string
  departure_airport: string
  arrival_airport:   string
  flight_date:       string    // YYYY-MM-DD
  delay_minutes:     number
  cancelled:         boolean

  // Computed
  distance_km:       number
  regulation:        Regulation
  eligible:          boolean
  compensation_eur:  CompensationEur
  eligibility_reason: string

  // Claim lifecycle
  status:     ClaimStatus
  created_at: string
}

// ─── API SURFACE ───────────────────────────────────────────────────────────────

export type FlightLookupError =
  | 'INVALID_API_KEY'
  | 'PLAN_UPGRADE_REQUIRED'   // Historical data needs AviationStack Starter+
  | 'RATE_LIMIT_EXCEEDED'
  | 'NOT_FOUND'
  | 'API_ERROR'
  | 'NETWORK_ERROR'

export type FlightLookupResult =
  | { ok: true;  data: FlightData }
  | { ok: false; error: FlightLookupError; message: string }

// ─── EMAIL EXTRACTION ─────────────────────────────────────────────────────────

/** Structured output from /api/flights/parse-email (Claude extraction). */
export interface ParsedEmailFlight {
  type: 'FLIGHT'
  details: {
    airline:       string | null
    flightNumber:  string | null
    origin:        string | null       // IATA 3-letter
    destination:   string | null       // IATA 3-letter
    departureDate: string | null       // YYYY-MM-DD
    amount:        string | null       // numeric string, no commas (e.g. "850000")
    currency:      string | null       // ISO 4217 (e.g. "KRW")
    status:        'CONFIRMED' | 'CANCELLED' | 'DELAYED'
  }
  raw_reasoning: string
}
