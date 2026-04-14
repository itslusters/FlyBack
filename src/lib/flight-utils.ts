/**
 * Pure TypeScript flight utilities — zero external dependencies.
 *
 *   haversineKm()        Great-circle distance between two coordinates
 *   airportDistanceKm()  Lookup airport coords and call haversineKm
 *   parseFlightNumber()  Split "BA 123" → { airline: "BA", number: "123" }
 *   calculateEU261()     EU261 / UK261 compensation tier calculation
 */

import type { AirportCoords, ParsedFlightNumber, EU261Result, CompensationEur, Regulation } from '@/types/flight'

// ─── HAVERSINE ────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6_371

function toRad(deg: number): number {
  return (deg * Math.PI) / 180
}

/**
 * Haversine great-circle distance.
 * Accurate to ~0.5% for typical flight routes (ignores Earth's oblate shape).
 *
 * EU261 uses "great circle distance between departure and destination airports"
 * (Article 7), so haversine is the correct formula.
 */
export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_KM * c
}

// ─── AIRPORT COORDINATE LOOKUP ────────────────────────────────────────────────
// Covers the top ~60 airports by EU261 claim volume.
// For unlisted airports, use a geocoding API (e.g. AviationStack /airports endpoint).

const COORDS: Record<string, [lat: number, lon: number]> = {
  // UK
  LHR: [ 51.4775,  -0.4614], LGW: [ 51.1537,  -0.1821],
  MAN: [ 53.3537,  -2.2750], STN: [ 51.8850,   0.2350],
  EDI: [ 55.9500,  -3.3725], BHX: [ 52.4539,  -1.7480],
  // France
  CDG: [ 49.0097,   2.5478], ORY: [ 48.7233,   2.3794],
  // Germany
  FRA: [ 50.0333,   8.5706], MUC: [ 48.3537,  11.7750],
  DUS: [ 51.2895,   6.7668], BER: [ 52.3667,  13.5033],
  // Netherlands
  AMS: [ 52.3086,   4.7639],
  // Spain
  MAD: [ 40.4936,  -3.5668], BCN: [ 41.2971,   2.0785],
  AGP: [ 36.6749,  -4.4991], PMI: [ 39.5517,   2.7388],
  // Italy
  FCO: [ 41.8003,  12.2389], MXP: [ 45.6306,   8.7231],
  VCE: [ 45.5053,  12.3519],
  // Portugal
  LIS: [ 38.7813,  -9.1359], OPO: [ 41.2481,  -8.6814],
  // Switzerland / Austria
  ZRH: [ 47.4647,   8.5492], VIE: [ 48.1103,  16.5697],
  GVA: [ 46.2370,   6.1092],
  // Nordics
  CPH: [ 55.6180,  12.6560], ARN: [ 59.6519,  17.9186],
  HEL: [ 60.3172,  24.9633], OSL: [ 60.1939,  11.1004],
  // Eastern EU
  PRG: [ 50.1008,  14.2600], WAW: [ 52.1672,  20.9679],
  BUD: [ 47.4298,  19.2611], ATH: [ 37.9365,  23.9445],
  // Turkey (Schengen adjacent, EU261 covered on EU carriers)
  IST: [ 40.9769,  28.8146], SAW: [ 40.8986,  29.3092],
  // Ireland
  DUB: [ 53.4213,  -6.2700],
  // Belgium
  BRU: [ 50.9014,   4.4844],
  // North America (common transatlantic origins)
  JFK: [ 40.6413, -73.7781], LAX: [ 33.9425, -118.4081],
  ORD: [ 41.9742, -87.9073], ATL: [ 33.6407,  -84.4277],
  MIA: [ 25.7959, -80.2870], SFO: [ 37.6189, -122.3750],
  BOS: [ 42.3656, -71.0096], EWR: [ 40.6895,  -74.1745],
  YYZ: [ 43.6777, -79.6248], YUL: [ 45.4706,  -73.7408],
  // Middle East hubs
  DXB: [ 25.2532,  55.3657], DOH: [ 25.2731,  51.6080],
  AUH: [ 24.4330,  54.6511],
  // Asia
  NRT: [ 35.7720, 140.3929], HND: [ 35.5523, 139.7800],
  SIN: [  1.3644, 103.9915], HKG: [ 22.3080, 113.9185],
  ICN: [ 37.4602, 126.4407], PEK: [ 40.0799, 116.6031],
  // Australia
  SYD: [-33.9399, 151.1753], MEL: [-37.6690, 144.8410],
}

/**
 * Great-circle distance between two IATA airport codes.
 * Returns null if either airport is not in the lookup table.
 */
export function airportDistanceKm(
  depIata: string,
  arrIata: string,
): number | null {
  const dep = COORDS[depIata.toUpperCase()]
  const arr = COORDS[arrIata.toUpperCase()]
  if (!dep || !arr) return null
  return haversineKm(dep[0], dep[1], arr[0], arr[1])
}

/**
 * Returns the coordinates record for an airport, or null if unknown.
 * Useful when callers need to pass coords to their own haversine call.
 */
export function getAirportCoords(iata: string): AirportCoords | null {
  const c = COORDS[iata.toUpperCase()]
  if (!c) return null
  return { iata: iata.toUpperCase(), lat: c[0], lon: c[1] }
}

// ─── FLIGHT NUMBER PARSING ────────────────────────────────────────────────────

/**
 * IATA flight designator format:
 *   2–3 uppercase airline code  (e.g. BA, LH, AAL)
 *   optional whitespace
 *   1–4 digit flight number     (e.g. 1, 123, 1234)
 *   optional uppercase suffix   (e.g. A for codeshare variant)
 *
 * Valid:   "BA123", "ba 123", "LH 9999", "AA1234A", "  ua12  "
 * Invalid: "BAXX", "123", "", "B1A23"
 */
const FLIGHT_RE = /^\s*([A-Za-z]{2,3})\s*(\d{1,4}[A-Za-z]?)\s*$/

export function parseFlightNumber(input: string): ParsedFlightNumber | null {
  const m = input.match(FLIGHT_RE)
  if (!m) return null

  const airline    = m[1].toUpperCase()
  const number     = m[2].toUpperCase()

  return {
    raw:        input,
    airline,
    number,
    normalized: `${airline}${number}`,
  }
}

// ─── EU261 COMPENSATION CALCULATOR ───────────────────────────────────────────

/**
 * Calculate EU261 (or UK261) compensation entitlement.
 *
 * Thresholds per Regulation (EC) No 261/2004 Article 7:
 *   ≤ 1,500 km                 → €250  if arrival delay ≥ 3 h
 *   1,500 km < d ≤ 3,500 km   → €400  if arrival delay ≥ 3 h
 *   > 3,500 km                 → €600  if arrival delay ≥ 4 h
 *
 * Cancellations: treated as infinite delay (Article 5 compensation = same tiers).
 * This is conservative — well-notified cancellations (>14 days prior) are exempt,
 * but we don't track notification date at claim creation time.
 *
 * 50% reduction clause (Article 7(2)) applies only when the carrier re-routes the
 * passenger and the new arrival is within the threshold window. Not modelled here
 * because it requires re-routing data not available from AviationStack.
 *
 * @param distanceKm   Haversine great-circle distance (required)
 * @param delayMinutes Actual arrival delay in minutes (0 for cancellations)
 * @param cancelled    true = flight was cancelled
 * @param regulation   'EU261' | 'UK261' | 'NONE' (determined by route + carrier)
 */
export function calculateEU261(
  distanceKm:   number,
  delayMinutes: number,
  cancelled:    boolean,
  regulation:   Regulation,
): EU261Result {
  if (regulation === 'NONE') {
    return {
      eligible:         false,
      compensation_eur: 0,
      regulation:       'NONE',
      reason:           'Flight is not covered by EU261 or UK261 (non-EU departure on non-EU carrier)',
    }
  }

  // Cancellations bypass the delay threshold — all distance tiers apply
  const effectiveDelay = cancelled ? Infinity : delayMinutes

  if (distanceKm <= 1_500) {
    return effectiveDelay >= 180
      ? { eligible: true,  compensation_eur: 250, regulation, reason: `≤1,500 km flight — ${cancelled ? 'cancelled' : `${delayMinutes} min delay`} qualifies under ${regulation} Article 7(1)(a)` }
      : { eligible: false, compensation_eur: 0,   regulation, reason: `≤1,500 km flight — delay of ${delayMinutes} min is below the 3 h threshold` }
  }

  if (distanceKm <= 3_500) {
    return effectiveDelay >= 180
      ? { eligible: true,  compensation_eur: 400, regulation, reason: `1,500–3,500 km flight — ${cancelled ? 'cancelled' : `${delayMinutes} min delay`} qualifies under ${regulation} Article 7(1)(b)` }
      : { eligible: false, compensation_eur: 0,   regulation, reason: `1,500–3,500 km flight — delay of ${delayMinutes} min is below the 3 h threshold` }
  }

  // > 3,500 km: 4 h threshold
  return effectiveDelay >= 240
    ? { eligible: true,  compensation_eur: 600, regulation, reason: `>3,500 km flight — ${cancelled ? 'cancelled' : `${delayMinutes} min delay`} qualifies under ${regulation} Article 7(1)(c)` }
    : { eligible: false, compensation_eur: 0,   regulation, reason: `>3,500 km flight — delay of ${delayMinutes} min is below the 4 h threshold` }
}

// ─── COMPENSATION CONVENIENCE ─────────────────────────────────────────────────

/** Maximum possible payout for a given route (used for UI "up to €X" display). */
export function maxCompensationForDistance(distanceKm: number): CompensationEur {
  if (distanceKm <= 1_500) return 250
  if (distanceKm <= 3_500) return 400
  return 600
}

// ─── KOREAN DOMESTIC AVIATION COMPENSATION ────────────────────────────────────
// 항공교통 이용자 보호기준 (국토교통부 고시)
// Fixed tiers — actual formula is ticket-price-based, but fixed caps apply.

const KR_DOM_AIRPORTS = new Set(['ICN','GMP','PUS','CJU','TAE','CJJ','KWJ','KPO','RSU','YNY'])
const KR_AIRLINES     = new Set(['KE','OZ','7C','LJ','TW','ZE','BX','RF'])

/** 1 EUR ≈ 1,500 KRW (approximate — update when rate drifts >10%). */
export const EUR_TO_KRW = 1_500

function calcKrDomestic(delayMinutes: number, cancelled: boolean): number {
  if (cancelled || delayMinutes >= 240) return 400_000
  if (delayMinutes >= 120) return 200_000
  if (delayMinutes >= 60)  return 100_000
  return 0
}

// ─── UNIFIED COMPENSATION RESULT ──────────────────────────────────────────────

export type ExtendedRegulation = Regulation | 'KR_DOMESTIC'

export interface FullCompensationResult {
  regulation:      ExtendedRegulation
  compensationEur: number              // 0 for KR_DOMESTIC
  compensationKrw: number              // EUR×EUR_TO_KRW for EU261; direct KRW for domestic
  eligible:        boolean
  tier:            250 | 400 | 600 | null
  reason:          string
}

/**
 * Unified compensation calculator.
 *
 * Wraps calculateEU261 and adds Korean domestic aviation rules.
 * Caller supplies `regulation` from the server (/api/flights/check); this
 * function only adds KR_DOMESTIC detection when regulation === 'NONE'.
 */
export function computeCompensation(
  depIata:      string,
  arrIata:      string,
  airlineIata:  string,
  delayMinutes: number,
  cancelled:    boolean,
  regulation:   Regulation,
  distanceKm:   number | null,
): FullCompensationResult {
  const dep = depIata.toUpperCase()
  const arr = arrIata.toUpperCase()
  const al  = airlineIata.toUpperCase()

  // KR domestic: both airports in Korea + Korean airline + server returned NONE
  if (
    regulation === 'NONE' &&
    KR_DOM_AIRPORTS.has(dep) &&
    KR_DOM_AIRPORTS.has(arr) &&
    KR_AIRLINES.has(al)
  ) {
    const krw = calcKrDomestic(delayMinutes, cancelled)
    const manwon = Math.round(krw / 10_000)
    return {
      regulation:      'KR_DOMESTIC',
      compensationEur: 0,
      compensationKrw: krw,
      eligible:        krw > 0,
      tier:            null,
      reason: krw > 0
        ? `국내선 보상 대상 — 최대 ${manwon}만원 (항공교통 이용자 보호기준)`
        : '국내선 기준 지연 60분 미만 — 보상 기준 미달입니다.',
    }
  }

  // EU261 / UK261 path
  const eu = distanceKm != null
    ? calculateEU261(distanceKm, delayMinutes, cancelled, regulation)
    : null

  const compensationEur = eu?.compensation_eur ?? 0
  const tier = compensationEur > 0 ? (compensationEur as 250 | 400 | 600) : null

  return {
    regulation,
    compensationEur,
    compensationKrw: Math.round(compensationEur * EUR_TO_KRW),
    eligible:        eu?.eligible ?? false,
    tier,
    reason:          eu?.reason ?? '해당 구간은 EU261/UK261 적용 대상이 아닙니다.',
  }
}
