/**
 * AviationStack API client — server-side only.
 * Never import this in client components (API key would leak).
 *
 * Free plan constraints:
 *   - HTTP only (HTTPS = paid). API key is in query params → MITM risk on free tier.
 *     Upgrade to Starter ($9.99/mo) before production launch.
 *   - 500 req/month hard cap.
 *   - Historical data (flight_date != today) requires Starter plan or above.
 *     On free plan, historical queries return error code "function_access_restricted".
 */

import type { FlightData, FlightLookupError, FlightLookupResult, FlightStatus } from '@/types/flight'

const BASE_URL = 'http://api.aviationstack.com/v1'   // HTTP — free plan limitation

// ─── RAW API SHAPES ────────────────────────────────────────────────────────────

type AvStatus = 'scheduled' | 'active' | 'landed' | 'cancelled' | 'incident' | 'diverted'

interface AvEndpoint {
  iata:      string
  timezone:  string
  scheduled: string
  estimated: string | null
  actual:    string | null
  delay:     number | null
}

interface AvFlight {
  flight_date:   string
  flight_status: AvStatus
  departure:     AvEndpoint
  arrival:       AvEndpoint
  airline: { name: string; iata: string }
  flight:  { number: string; iata: string }
}

interface AvResponse {
  data?:  AvFlight[]
  error?: { code: string; message: string }
  pagination?: { count: number; total: number }
}

// ─── MAPPERS ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<AvStatus, FlightStatus> = {
  scheduled: 'SCHEDULED',
  active:    'IN_AIR',
  landed:    'LANDED',
  cancelled: 'CANCELLED',
  incident:  'LANDED',    // Treat incidents as landed for MVP
  diverted:  'DIVERTED',
}

function delayMinutes(scheduled: string, actual: string | null, apiDelay: number | null): number {
  if (apiDelay !== null) return Math.max(0, apiDelay)
  if (!actual) return 0
  const diff = new Date(actual).getTime() - new Date(scheduled).getTime()
  return Math.max(0, Math.floor(diff / 60_000))
}

function toFlightData(f: AvFlight): FlightData {
  return {
    flight_number:       f.flight.iata,
    airline_iata:        f.airline.iata,
    airline_name:        f.airline.name || null,
    departure_airport:   f.departure.iata,
    arrival_airport:     f.arrival.iata,
    scheduled_departure: f.departure.scheduled,
    actual_departure:    f.departure.actual,
    scheduled_arrival:   f.arrival.scheduled,
    actual_arrival:      f.arrival.actual,
    status:              STATUS_MAP[f.flight_status] ?? 'SCHEDULED',
    delay_minutes:       delayMinutes(f.arrival.scheduled, f.arrival.actual, f.arrival.delay),
  }
}

// ─── ERROR CLASSIFICATION ─────────────────────────────────────────────────────

const ERROR_CODE_MAP: Array<[RegExp, FlightLookupError]> = [
  [/invalid_access_key|no_access_key/i,         'INVALID_API_KEY'],
  [/function_access_restricted|subscription/i,   'PLAN_UPGRADE_REQUIRED'],
  [/rate_limit|usage_limit/i,                    'RATE_LIMIT_EXCEEDED'],
]

function classifyError(httpStatus: number, body: AvResponse): FlightLookupError {
  if (httpStatus === 401) return 'INVALID_API_KEY'
  if (httpStatus === 429) return 'RATE_LIMIT_EXCEEDED'

  const code = body.error?.code ?? ''
  for (const [re, kind] of ERROR_CODE_MAP) {
    if (re.test(code)) return kind
  }
  return 'API_ERROR'
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Fetch a single flight's operational data from AviationStack.
 *
 * @param flightIata  Full IATA flight designator, e.g. "BA123"
 * @param date        Flight date in YYYY-MM-DD format
 *
 * Codeshare note: AviationStack may return multiple rows for codeshare flights.
 * We take the first row (operating carrier), which is what EU261 cares about.
 */
export async function fetchFlight(
  flightIata: string,
  date:       string,
): Promise<FlightLookupResult> {
  const key = process.env.AVIATIONSTACK_API_KEY
  if (!key) {
    return { ok: false, error: 'INVALID_API_KEY', message: 'AVIATIONSTACK_API_KEY is not set' }
  }

  const url = new URL(`${BASE_URL}/flights`)
  url.searchParams.set('access_key',  key)
  url.searchParams.set('flight_iata', flightIata.toUpperCase().trim())
  url.searchParams.set('flight_date', date)

  let res: Response
  try {
    res = await fetch(url.toString(), { cache: 'no-store' })
  } catch (err) {
    return {
      ok:      false,
      error:   'NETWORK_ERROR',
      message: err instanceof Error ? err.message : 'Failed to reach AviationStack',
    }
  }

  let body: AvResponse
  try {
    body = await res.json() as AvResponse
  } catch {
    return { ok: false, error: 'API_ERROR', message: `Non-JSON response (HTTP ${res.status})` }
  }

  // AviationStack returns HTTP 200 even for API errors — check body.error first
  if (body.error) {
    return {
      ok:      false,
      error:   classifyError(res.status, body),
      message: body.error.message,
    }
  }

  if (!res.ok) {
    return {
      ok:      false,
      error:   classifyError(res.status, body),
      message: `HTTP ${res.status}`,
    }
  }

  if (!body.data || body.data.length === 0) {
    return {
      ok:      false,
      error:   'NOT_FOUND',
      message: `No flight record found for ${flightIata.toUpperCase()} on ${date}`,
    }
  }

  return { ok: true, data: toFlightData(body.data[0]) }
}
