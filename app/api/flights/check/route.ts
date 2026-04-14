/**
 * POST /api/flights/check
 *
 * Input:  { flightNumber: string, date: "YYYY-MM-DD" }
 * Output: { success, data: { flight, eligible, compensationEur, regulation, distanceKm, reason } }
 */

import { NextRequest, NextResponse } from 'next/server'
import { fetchFlight } from '@/lib/aviation-stack'
import { parseFlightNumber, airportDistanceKm, calculateEU261 } from '@/lib/flight-utils'
import type { Regulation } from '@/types/flight'

// ─── REGULATION LOOKUP TABLES ─────────────────────────────────────────────────
// Intentional duplication from core-utils.ts — avoids coupling route to a
// client-side util file. Extract to src/lib/regulation.ts when a 3rd caller appears.

const EU_EEA = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU',
  'IS','IE','IT','LV','LI','LT','LU','MT','NL','NO','PL','PT','RO',
  'SK','SI','ES','SE',
])

// IATA airport → ISO 2-letter country (top ~60 airports by EU261 claim volume)
const AIRPORT_COUNTRY: Record<string, string> = {
  // UK
  LHR:'GB', LGW:'GB', MAN:'GB', STN:'GB', EDI:'GB', BHX:'GB', LTN:'GB',
  // France
  CDG:'FR', ORY:'FR', NCE:'FR', LYS:'FR',
  // Germany
  FRA:'DE', MUC:'DE', DUS:'DE', BER:'DE', HAM:'DE', STR:'DE',
  // Benelux
  AMS:'NL', BRU:'BE',
  // Spain
  MAD:'ES', BCN:'ES', AGP:'ES', PMI:'ES', ALC:'ES', TFS:'ES', LPA:'ES',
  // Italy
  FCO:'IT', MXP:'IT', VCE:'IT', NAP:'IT', FCM:'IT',
  // Portugal
  LIS:'PT', OPO:'PT', FAO:'PT',
  // DACH
  ZRH:'CH', VIE:'AT', GVA:'CH', INN:'AT',
  // Nordics
  CPH:'DK', ARN:'SE', GOT:'SE', HEL:'FI', OSL:'NO', BGO:'NO',
  // Eastern EU
  PRG:'CZ', WAW:'PL', KRK:'PL', BUD:'HU', ATH:'GR', OTP:'RO', SOF:'BG',
  // Ireland
  DUB:'IE', SNN:'IE',
  // Non-EU/UK (common transatlantic + gulf origins for regulation=NONE cases)
  JFK:'US', LAX:'US', ORD:'US', ATL:'US', MIA:'US', SFO:'US', BOS:'US', EWR:'US',
  YYZ:'CA', YUL:'CA',
  DXB:'AE', DOH:'QA', AUH:'AE',
  NRT:'JP', HND:'JP', SIN:'SG', HKG:'HK', ICN:'KR',
  SYD:'AU', MEL:'AU',
  IST:'TR', SAW:'TR',
}

// Airline IATA → ISO country (EU/UK carriers only — non-EU defaults to undefined)
const AIRLINE_COUNTRY: Record<string, string> = {
  // UK (UK261)
  BA:'GB', EZY:'GB', VS:'GB', TOM:'GB', BY:'GB', LS:'GB',
  // Germany
  LH:'DE', EW:'DE', X3:'DE',
  // Ireland
  FR:'IE', EI:'IE',
  // France
  AF:'FR', TO:'FR', HV:'NL',   // Transavia France → FR
  // Netherlands
  KL:'NL',
  // Spain
  IB:'ES', VY:'ES', I2:'ES', V7:'ES',
  // Italy
  AZ:'IT', EN:'IT',
  // Portugal
  TP:'PT',
  // Nordics
  SK:'SE', DY:'NO', D8:'NO',
  // Eastern EU
  BT:'LV', W6:'HU', W9:'PL', OU:'HR', FB:'BG', OK:'CZ', LO:'PL',
  // DACH
  OS:'AT', LX:'CH',
  // Greece
  A3:'GR',
}

/**
 * Determine which regulation applies to a given flight.
 *
 * Priority:
 *   1. Departure from UK airport                    → UK261 (any airline)
 *   2. EU/UK carrier arriving into UK               → UK261
 *   3. Departure from EU/EEA airport                → EU261 (any airline)
 *   4. EU carrier arriving into EU/EEA              → EU261
 *   5. Otherwise                                    → NONE
 */
function determineRegulation(dep: string, arr: string, airlineIata: string): Regulation {
  const depC    = AIRPORT_COUNTRY[dep.toUpperCase()]
  const arrC    = AIRPORT_COUNTRY[arr.toUpperCase()]
  const airlineC = AIRLINE_COUNTRY[airlineIata.toUpperCase()]

  if (depC === 'GB')                              return 'UK261'
  if (arrC === 'GB'  && airlineC === 'GB')        return 'UK261'
  if (depC !== undefined && EU_EEA.has(depC))     return 'EU261'
  if (arrC !== undefined && EU_EEA.has(arrC) &&
      airlineC !== undefined && EU_EEA.has(airlineC)) return 'EU261'

  return 'NONE'
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────────────────────

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data } as const)
}

function fail(error: string, status = 400) {
  return NextResponse.json({ success: false, error } as const, { status })
}

// ─── REQUEST SHAPE ────────────────────────────────────────────────────────────

interface CheckBody {
  flightNumber: string    // "BA123" or "ba 123" — normalized internally
  date:         string    // "YYYY-MM-DD"
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Parse body
  let body: CheckBody
  try { body = await req.json() } catch { return fail('Invalid JSON') }

  const { flightNumber, date } = body
  if (!flightNumber?.trim() || !date?.trim()) {
    return fail('flightNumber and date are required')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return fail('date must be YYYY-MM-DD')
  }

  // Parse and validate flight number format
  const parsed = parseFlightNumber(flightNumber)
  if (!parsed) {
    return fail(`"${flightNumber}" is not a valid IATA flight number — expected format: BA123`)
  }

  // Fetch from AviationStack
  const result = await fetchFlight(parsed.normalized, date)

  if (result.ok === false) {
    const statusMap: Record<string, number> = {
      PLAN_UPGRADE_REQUIRED: 402,
      NOT_FOUND:             404,
      INVALID_API_KEY:       503,
      RATE_LIMIT_EXCEEDED:   429,
    }
    return fail(result.message, statusMap[result.error] ?? 500)
  }

  const flight = result.data

  // Distance + regulation + EU261 eligibility
  const distanceKm  = airportDistanceKm(flight.departure_airport, flight.arrival_airport)
  const regulation  = determineRegulation(flight.departure_airport, flight.arrival_airport, flight.airline_iata)
  const eu261       = distanceKm !== null
    ? calculateEU261(distanceKm, flight.delay_minutes, flight.status === 'CANCELLED', regulation)
    : null

  return ok({
    flight,
    regulation,
    distanceKm,
    eligible:        eu261?.eligible        ?? null,
    compensationEur: eu261?.compensation_eur ?? null,
    reason:          eu261?.reason          ?? 'Airport not in database — distance unknown',
  })
}
