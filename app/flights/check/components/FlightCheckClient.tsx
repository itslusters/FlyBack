'use client'

/**
 * FlightCheckClient
 *
 * Two-mode input wizard:
 *   Email  → paste booking confirmation → Claude extracts → editable review → /api/flights/check
 *   Manual → type flight + date         → /api/flights/check directly
 *
 * State machine (discriminated union via step.tag):
 *   idle → extracting → reviewing → checking → result
 *                    ↘                       ↗
 *                      checking (manual path)
 *   Any step → error
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence, animate } from 'framer-motion'
import { Plane, CheckCircle, XCircle, ArrowLeft, Loader2, AlertTriangle, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import type { ParsedEmailFlight, FlightData, Regulation } from '@/types/flight'
import { computeCompensation, EUR_TO_KRW } from '@/lib/flight-utils'
import { saveFlightClaim } from '../actions'

// ─── PENDING CLAIM (sessionStorage key) ──────────────────────────────────────
// If the user isn't logged in when they try to save, we stash the result here
// so it can be restored automatically after they sign in and return.

const PENDING_KEY = 'claimkit:pending_claim'

interface PendingClaim {
  check:        CheckData   // full API response
  flightNumber: string
  date:         string
}

// ─── AIRPORT DATA ─────────────────────────────────────────────────────────────

interface Airport { iata: string; name: string; city: string; ko?: string }

const AIRPORTS: Airport[] = [
  // Korea
  { iata: 'ICN', name: 'Incheon International',       city: 'Seoul',         ko: '인천/서울'   },
  { iata: 'GMP', name: 'Gimpo International',          city: 'Seoul',         ko: '김포/서울'   },
  { iata: 'PUS', name: 'Gimhae International',         city: 'Busan',         ko: '부산'        },
  { iata: 'CJU', name: 'Jeju International',           city: 'Jeju',          ko: '제주'        },
  { iata: 'TAE', name: 'Daegu International',          city: 'Daegu',         ko: '대구'        },
  // Japan
  { iata: 'NRT', name: 'Narita International',         city: 'Tokyo',         ko: '도쿄/나리타' },
  { iata: 'HND', name: 'Tokyo Haneda',                 city: 'Tokyo',         ko: '도쿄/하네다' },
  { iata: 'KIX', name: 'Kansai International',         city: 'Osaka',         ko: '오사카'      },
  { iata: 'FUK', name: 'Fukuoka Airport',              city: 'Fukuoka',       ko: '후쿠오카'    },
  { iata: 'NGO', name: 'Chubu Centrair',               city: 'Nagoya',        ko: '나고야'      },
  { iata: 'CTS', name: 'New Chitose Airport',          city: 'Sapporo',       ko: '삿포로'      },
  // China / HK / Taiwan
  { iata: 'PEK', name: 'Capital International',        city: 'Beijing',       ko: '베이징'      },
  { iata: 'PKX', name: 'Daxing International',         city: 'Beijing'                          },
  { iata: 'PVG', name: 'Pudong International',         city: 'Shanghai',      ko: '상하이'      },
  { iata: 'HKG', name: 'Hong Kong International',      city: 'Hong Kong',     ko: '홍콩'        },
  { iata: 'TPE', name: 'Taoyuan International',        city: 'Taipei',        ko: '타이페이'    },
  { iata: 'CAN', name: 'Baiyun International',         city: 'Guangzhou'                        },
  // Southeast Asia
  { iata: 'SIN', name: 'Changi Airport',               city: 'Singapore',     ko: '싱가포르'    },
  { iata: 'BKK', name: 'Suvarnabhumi',                 city: 'Bangkok',       ko: '방콕'        },
  { iata: 'KUL', name: 'Kuala Lumpur International',   city: 'Kuala Lumpur'                     },
  { iata: 'MNL', name: 'Ninoy Aquino International',   city: 'Manila',        ko: '마닐라'      },
  { iata: 'SGN', name: 'Tan Son Nhat International',   city: 'Ho Chi Minh City'                 },
  { iata: 'HAN', name: 'Noi Bai International',        city: 'Hanoi'                            },
  { iata: 'CGK', name: 'Soekarno-Hatta International', city: 'Jakarta'                          },
  { iata: 'DPS', name: 'Ngurah Rai International',     city: 'Bali',          ko: '발리'        },
  // South Asia
  { iata: 'DEL', name: 'Indira Gandhi International',  city: 'Delhi'                            },
  { iata: 'BOM', name: 'Chhatrapati Shivaji',          city: 'Mumbai'                           },
  // Middle East
  { iata: 'DXB', name: 'Dubai International',          city: 'Dubai',         ko: '두바이'      },
  { iata: 'AUH', name: 'Zayed International',          city: 'Abu Dhabi'                        },
  { iata: 'DOH', name: 'Hamad International',          city: 'Doha'                             },
  // UK
  { iata: 'LHR', name: 'Heathrow',                     city: 'London'                           },
  { iata: 'LGW', name: 'Gatwick',                      city: 'London'                           },
  { iata: 'STN', name: 'Stansted',                     city: 'London'                           },
  { iata: 'LCY', name: 'London City',                  city: 'London'                           },
  { iata: 'MAN', name: 'Manchester Airport',           city: 'Manchester'                       },
  { iata: 'EDI', name: 'Edinburgh Airport',            city: 'Edinburgh'                        },
  // France
  { iata: 'CDG', name: 'Charles de Gaulle',            city: 'Paris',         ko: '파리'        },
  { iata: 'ORY', name: 'Orly',                         city: 'Paris'                            },
  { iata: 'NCE', name: "Côte d'Azur",                  city: 'Nice'                             },
  // Germany
  { iata: 'FRA', name: 'Frankfurt Airport',            city: 'Frankfurt',     ko: '프랑크푸르트'},
  { iata: 'MUC', name: 'Franz Josef Strauss',          city: 'Munich',        ko: '뮌헨'        },
  { iata: 'BER', name: 'Brandenburg Airport',          city: 'Berlin',        ko: '베를린'      },
  { iata: 'DUS', name: 'Düsseldorf Airport',           city: 'Düsseldorf'                       },
  { iata: 'HAM', name: 'Hamburg Airport',              city: 'Hamburg'                          },
  // Benelux
  { iata: 'AMS', name: 'Schiphol',                     city: 'Amsterdam',     ko: '암스테르담'  },
  { iata: 'BRU', name: 'Brussels Airport',             city: 'Brussels'                         },
  // Spain
  { iata: 'MAD', name: 'Barajas',                      city: 'Madrid',        ko: '마드리드'    },
  { iata: 'BCN', name: 'El Prat',                      city: 'Barcelona'                        },
  { iata: 'PMI', name: 'Palma de Mallorca',            city: 'Palma'                            },
  // Italy
  { iata: 'FCO', name: 'Fiumicino',                    city: 'Rome',          ko: '로마'        },
  { iata: 'MXP', name: 'Malpensa',                     city: 'Milan',         ko: '밀라노'      },
  { iata: 'VCE', name: 'Marco Polo',                   city: 'Venice'                           },
  // Other Europe
  { iata: 'ZRH', name: 'Zürich Airport',               city: 'Zürich'                           },
  { iata: 'VIE', name: 'Vienna International',         city: 'Vienna',        ko: '빈'          },
  { iata: 'CPH', name: 'Copenhagen Airport',           city: 'Copenhagen'                       },
  { iata: 'ARN', name: 'Arlanda',                      city: 'Stockholm'                        },
  { iata: 'HEL', name: 'Helsinki-Vantaa',              city: 'Helsinki'                         },
  { iata: 'OSL', name: 'Gardermoen',                   city: 'Oslo'                             },
  { iata: 'DUB', name: 'Dublin Airport',               city: 'Dublin'                           },
  { iata: 'LIS', name: 'Humberto Delgado',             city: 'Lisbon'                           },
  { iata: 'ATH', name: 'Eleftherios Venizelos',        city: 'Athens'                           },
  { iata: 'IST', name: 'Istanbul Airport',             city: 'Istanbul'                         },
  { iata: 'WAW', name: 'Chopin Airport',               city: 'Warsaw'                           },
  { iata: 'PRG', name: 'Václav Havel',                 city: 'Prague'                           },
  // North America
  { iata: 'JFK', name: 'John F. Kennedy',              city: 'New York',      ko: '뉴욕'        },
  { iata: 'LGA', name: 'LaGuardia',                    city: 'New York'                         },
  { iata: 'EWR', name: 'Newark Liberty',               city: 'Newark'                           },
  { iata: 'LAX', name: 'Los Angeles International',    city: 'Los Angeles',   ko: '로스앤젤레스'},
  { iata: 'ORD', name: "O'Hare International",         city: 'Chicago',       ko: '시카고'      },
  { iata: 'SFO', name: 'San Francisco International',  city: 'San Francisco'                    },
  { iata: 'MIA', name: 'Miami International',          city: 'Miami',         ko: '마이애미'    },
  { iata: 'BOS', name: 'Logan International',          city: 'Boston'                           },
  { iata: 'ATL', name: 'Hartsfield-Jackson',           city: 'Atlanta'                          },
  { iata: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle'                          },
  { iata: 'YYZ', name: 'Pearson International',        city: 'Toronto'                          },
  { iata: 'YVR', name: 'Vancouver International',      city: 'Vancouver'                        },
  // Oceania
  { iata: 'SYD', name: 'Kingsford Smith',              city: 'Sydney'                           },
  { iata: 'MEL', name: 'Melbourne Airport',            city: 'Melbourne'                        },
]

function searchAirports(q: string): Airport[] {
  if (!q || q.length < 1) return []
  const lower = q.toLowerCase()
  return AIRPORTS.filter(a =>
    a.iata.toLowerCase().startsWith(lower) ||
    a.city.toLowerCase().startsWith(lower) ||
    a.name.toLowerCase().includes(lower) ||
    (a.ko != null && a.ko.includes(q))
  ).slice(0, 5)
}

// ─── DOMAIN TYPES ─────────────────────────────────────────────────────────────

interface CheckData {
  flight:          FlightData
  regulation:      Regulation
  distanceKm:      number | null
  eligible:        boolean | null
  compensationEur: number | null
  reason:          string
}

// Mutable copy of extracted details — owned by ReviewSection form state
interface FormData {
  airline:       string
  flightNumber:  string
  origin:        string    // validated as IATA on submit
  destination:   string    // validated as IATA on submit
  departureDate: string    // YYYY-MM-DD
  amount:        string
  currency:      string
  status:        'CONFIRMED' | 'CANCELLED' | 'DELAYED'
}

type InputMode = 'email' | 'manual'

type Step =
  | { tag: 'idle' }
  | { tag: 'extracting' }
  | { tag: 'reviewing';  extracted: ParsedEmailFlight }
  | { tag: 'checking';   flightNumber: string; date: string }
  | { tag: 'result';     check: CheckData; flightNumber: string; date: string }
  | { tag: 'error';      message: string; isAuthError?: boolean }

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const REGULATION_LABEL: Record<string, string> = {
  EU261: 'EU261/2004', UK261: 'UK261', NONE: 'Not covered',
}

const isValidIata = (s: string) => /^[A-Z]{3}$/.test(s.trim().toUpperCase()) && s.trim().length === 3

async function postJson<T>(
  url: string, body: unknown,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

// ─── IATA INPUT ───────────────────────────────────────────────────────────────

interface IataInputProps {
  label:    string
  value:    string
  onChange: (v: string) => void
  required: boolean
}

function IataInput({ label, value, onChange, required }: IataInputProps) {
  const [open, setOpen] = useState(false)

  const valid    = isValidIata(value)
  const empty    = !value.trim()
  const airport  = valid ? AIRPORTS.find(a => a.iata === value.trim().toUpperCase()) : undefined

  const suggestions = useMemo(() => {
    if (valid || empty) return []
    return searchAirports(value)
  }, [value, valid, empty])

  const labelCls = empty && required ? 'text-amber-400/70' : 'text-white/30'

  const inputCls = [
    "bg-transparent w-full outline-none font-['JetBrains_Mono',monospace]",
    'text-[22px] font-bold leading-none transition-colors border-b-2 pt-0.5 pb-2',
    empty && required
      ? 'border-amber-400/40 text-amber-400/40 placeholder:text-amber-400/25'
      : !valid && !empty
        ? 'border-white/10 text-white/50 placeholder:text-white/10'
        : 'border-white/[0.15] text-white placeholder:text-white/15',
  ].join(' ')

  return (
    <div className="relative flex-1 min-w-0">
      {/* Label */}
      <div className={['mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em]', labelCls].join(' ')}>
        {label}
        {empty && required && <span className="ml-1 text-amber-400">*</span>}
      </div>

      {/* IATA input */}
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value.toUpperCase()); setOpen(true) }}
        onFocus={() => { if (!valid) setOpen(true) }}
        onBlur={() => setTimeout(() => setOpen(false), 160)}
        maxLength={12}
        placeholder={required ? '─' : 'IATA'}
        className={inputCls}
        autoComplete="off"
        spellCheck={false}
      />

      {/* City hint line */}
      <div className="mt-1 h-[14px] text-[10px]">
        {airport ? (
          <span className="text-emerald-400/60">
            {airport.city}{airport.ko ? ` · ${airport.ko}` : ''}
          </span>
        ) : empty ? (
          <span className="text-amber-400/35">도시명 또는 IATA 코드 입력</span>
        ) : !valid ? (
          <span className="text-white/20">도시명으로 검색 중…</span>
        ) : null}
      </div>

      {/* Autocomplete dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 z-30 mt-1.5 w-max min-w-[180px] max-w-[min(260px,90vw)] overflow-hidden rounded-xl border border-white/[0.08] bg-neutral-800 shadow-2xl">
          {suggestions.map((a) => (
            <button
              key={a.iata}
              onMouseDown={() => { onChange(a.iata); setOpen(false) }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <span className="w-9 font-['JetBrains_Mono',monospace] text-[14px] font-bold text-white">
                {a.iata}
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-medium text-white/80">{a.name}</div>
                <div className="text-[10px] text-white/30">
                  {a.city}{a.ko ? ` · ${a.ko}` : ''}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FIELD WRAPPER ────────────────────────────────────────────────────────────

function Field({
  label, wasNull, children,
}: { label: string; wasNull: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className={[
        'mb-1.5 text-[9px] font-semibold uppercase tracking-[0.14em]',
        wasNull ? 'text-amber-400/70' : 'text-white/30',
      ].join(' ')}>
        {label}
        {wasNull && <span className="ml-1 text-amber-400">*</span>}
      </div>
      {children}
    </div>
  )
}

// Input classes for non-IATA dark card fields
const darkInput = (isEmpty: boolean, wasNull: boolean) => [
  'bg-transparent w-full outline-none border-b py-1.5 text-[13px] font-medium transition-colors',
  isEmpty && wasNull
    ? 'border-amber-400/35 text-amber-400/70 placeholder:text-amber-400/25'
    : 'border-white/[0.12] text-white/90 placeholder:text-white/20 focus:border-white/35',
].join(' ')

// ─── ANIMATED NUMBERS ─────────────────────────────────────────────────────────

function AnimatedEur({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ctrl = animate(0, value, {
      duration: 1.5,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = `€${Math.round(v)}` },
    })
    return () => ctrl.stop()
  }, [value])
  return <span ref={ref}>€0</span>
}

/** KRW equivalent — counts up with 0.5 s lag after EUR to create a reveal cascade. */
function AnimatedKrw({ eur }: { eur: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const manwon = Math.round((eur * EUR_TO_KRW) / 10_000)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ctrl = animate(0, manwon, {
      duration: 1.2,
      delay:    0.5,
      ease:     [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = `≈ ₩${(Math.round(v) * 10_000).toLocaleString()}` },
    })
    return () => ctrl.stop()
  }, [manwon])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.45, duration: 0.4 }}
    >
      ≈ ₩0
    </motion.span>
  )
}

// ─── CALCULATING SECTION ──────────────────────────────────────────────────────
// Replaces the plain spinner — cycles through status messages every 900ms.

const CALC_MESSAGES = [
  '항공편 데이터 조회 중…',
  '운항 거리 계산 중…',
  'EU261 규정 확인 중…',
  '보상 금액 산출 중…',
]

function CalculatingSection({ flightNumber, date }: { flightNumber: string; date: string }) {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => (i + 1) % CALC_MESSAGES.length), 900)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      className="flex flex-col items-center gap-5 py-14 text-center sm:py-20"
    >
      {/* Pulsing rings */}
      <div className="relative flex h-16 w-16 items-center justify-center">
        {[0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-blue-200/40"
            animate={{ scale: [1, 1.5 + i * 0.2, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
          />
        ))}
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>

      {/* Flight label */}
      <div className="font-['JetBrains_Mono',monospace] text-[15px] font-bold text-neutral-800">
        {flightNumber.toUpperCase()} · {date}
      </div>

      {/* Cycling status message */}
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.25 }}
          className="text-[13px] text-neutral-400"
        >
          {CALC_MESSAGES[idx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  )
}

// ─── INPUT SHARED STYLE (light background forms) ──────────────────────────────

const inputCls = [
  'w-full rounded-xl border border-neutral-200 bg-white',
  'px-4 py-3 text-[13px] text-neutral-800 placeholder:text-neutral-300',
  'outline-none transition-colors focus:border-neutral-400',
].join(' ')

// ─── INPUT SECTION ────────────────────────────────────────────────────────────

interface InputSectionProps {
  mode:      InputMode
  setMode:   (m: InputMode) => void
  onExtract: (body: string) => void
  onManual:  (flightNumber: string, date: string) => void
  loading:   boolean
}

function InputSection({ mode, setMode, onExtract, onManual, loading }: InputSectionProps) {
  const [emailText, setEmailText] = useState('')
  const [flightNum, setFlightNum] = useState('')
  const [flightDate, setFlightDate] = useState('')

  const canExtract = emailText.trim().length > 20
  const canManual  = flightNum.trim().length >= 4 && /^\d{4}-\d{2}-\d{2}$/.test(flightDate)

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      {/* Mode tabs */}
      <div className="mb-5 flex rounded-xl border border-neutral-100 bg-neutral-50 p-1">
        {(['email', 'manual'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={[
              'relative flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors',
              mode === m ? 'text-neutral-900' : 'text-neutral-400 hover:text-neutral-600',
            ].join(' ')}
          >
            {mode === m && (
              <motion.span
                layoutId="mode-pill"
                className="absolute inset-0 rounded-lg bg-white shadow-sm"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.32 }}
              />
            )}
            <span className="relative z-10">
              {m === 'email' ? 'Paste Email' : 'Enter Manually'}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {mode === 'email' ? (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
          >
            <textarea
              value={emailText}
              onChange={(e) => setEmailText(e.target.value)}
              placeholder={'예약 확인 이메일 전체 내용을 붙여넣으세요.\n\nKorean Air, Asiana, Emirates, Ryanair 등 모든 항공사 이메일을 그대로 붙여넣으면 항공편 정보를 자동으로 추출합니다.'}
              className={[inputCls, 'min-h-[200px] resize-none leading-relaxed'].join(' ')}
            />
            <p className="mt-2 text-[11px] text-neutral-300">
              이메일 전체를 붙여넣으세요. 광고나 약관 내용이 섞여 있어도 괜찮습니다.
            </p>
            <button
              onClick={() => onExtract(emailText)}
              disabled={!canExtract || loading}
              className={[
                'mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-white transition-colors',
                canExtract && !loading ? 'bg-neutral-900 hover:bg-neutral-700' : 'bg-neutral-200 cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Extracting…</> : 'Extract Flight Details'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="manual"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <input
              type="text"
              value={flightNum}
              onChange={(e) => setFlightNum(e.target.value)}
              placeholder="Flight number — KE001, BA 456, LH 100"
              className={inputCls}
            />
            <input
              type="date"
              value={flightDate}
              onChange={(e) => setFlightDate(e.target.value)}
              className={inputCls}
            />
            <button
              onClick={() => onManual(flightNum, flightDate)}
              disabled={!canManual || loading}
              className={[
                'flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold text-white transition-colors',
                canManual && !loading ? 'bg-neutral-900 hover:bg-neutral-700' : 'bg-neutral-200 cursor-not-allowed',
              ].join(' ')}
            >
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : 'Check Eligibility'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── REVIEW SECTION (EDITABLE BOARDING PASS) ─────────────────────────────────

interface ReviewSectionProps {
  extracted: ParsedEmailFlight
  onConfirm: (flightNumber: string, date: string) => void
  onBack:    () => void
  loading:   boolean
}

function ReviewSection({ extracted, onConfirm, onBack, loading }: ReviewSectionProps) {
  const d = extracted.details

  // Initialise form from Claude's extraction; null → empty string
  const [form, setForm] = useState<FormData>({
    airline:       d.airline       ?? '',
    flightNumber:  d.flightNumber  ?? '',
    origin:        d.origin?.toUpperCase()      ?? '',
    destination:   d.destination?.toUpperCase() ?? '',
    departureDate: d.departureDate ?? '',
    amount:        d.amount        ?? '',
    currency:      d.currency?.toUpperCase()    ?? '',
    status:        d.status,
  })

  const set = <K extends keyof FormData>(k: K) =>
    (v: FormData[K]) => setForm((f) => ({ ...f, [k]: v }))

  // Which fields Claude failed to extract → warn user
  const wasNull = {
    airline:       d.airline       == null,
    flightNumber:  d.flightNumber  == null,
    origin:        d.origin        == null,
    destination:   d.destination   == null,
    departureDate: d.departureDate == null,
  }

  const nullCount = Object.values(wasNull).filter(Boolean).length

  // All four "must-haves" for the check API
  const canSubmit =
    form.flightNumber.trim().length >= 3 &&
    isValidIata(form.origin) &&
    isValidIata(form.destination) &&
    /^\d{4}-\d{2}-\d{2}$/.test(form.departureDate.trim())

  const STATUS_CFG = {
    CONFIRMED: { label: 'Confirmed', active: 'border-emerald-500/30 bg-emerald-500/[0.12] text-emerald-400' },
    CANCELLED: { label: 'Cancelled', active: 'border-red-500/30    bg-red-500/[0.12]    text-red-400'       },
    DELAYED:   { label: 'Delayed',   active: 'border-amber-500/30  bg-amber-500/[0.12]  text-amber-400'     },
  } as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* Boarding-pass card */}
      <div className="rounded-2xl bg-[#003366] px-6 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.35)]">

        {/* ── Top row: status selector + attention badge ── */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1.5">
            {(Object.keys(STATUS_CFG) as Array<keyof typeof STATUS_CFG>).map((s) => (
              <button
                key={s}
                onClick={() => set('status')(s)}
                className={[
                  'rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors',
                  form.status === s
                    ? STATUS_CFG[s].active
                    : 'border-white/[0.06] bg-white/[0.03] text-white/20 hover:text-white/40',
                ].join(' ')}
              >
                {STATUS_CFG[s].label}
              </button>
            ))}
          </div>

          {nullCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-amber-400/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400/70" />
              {nullCount}개 필드 입력 필요
            </span>
          )}
        </div>

        {/* ── Airline + Flight Number ── */}
        <div className="mb-5 grid grid-cols-5 gap-4">
          <div className="col-span-3">
            <Field label="항공사 (Airline)" wasNull={wasNull.airline}>
              <input
                type="text"
                value={form.airline}
                onChange={(e) => set('airline')(e.target.value)}
                placeholder="Korean Air"
                className={darkInput(!form.airline, wasNull.airline)}
              />
            </Field>
          </div>
          <div className="col-span-2">
            <Field label="편명 (Flight No.)" wasNull={wasNull.flightNumber}>
              <input
                type="text"
                value={form.flightNumber}
                onChange={(e) => set('flightNumber')(e.target.value.toUpperCase())}
                placeholder="KE001"
                className={[
                  darkInput(!form.flightNumber, wasNull.flightNumber),
                  "font-['JetBrains_Mono',monospace] tracking-wide",
                ].join(' ')}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
          </div>
        </div>

        {/* ── Route (IATA with autocomplete) ── */}
        <div className="mb-5">
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30">
            노선 (Route)
          </div>
          <div className="flex items-start gap-3">
            <IataInput
              label="출발 (FROM)"
              value={form.origin}
              onChange={set('origin')}
              required={wasNull.origin}
            />

            {/* Plane icon divider — centered on the IATA input row */}
            <div className="flex flex-shrink-0 flex-col items-center" style={{ paddingTop: '28px' }}>
              <div className="relative w-10">
                <div className="absolute inset-y-0 flex w-full items-center">
                  <div className="w-full border-t border-dashed border-white/[0.09]" />
                </div>
                <div className="relative flex justify-center">
                  <Plane className="h-3 w-3 rotate-90 text-white/[0.15]" style={{ background: '#171717', padding: '0 2px' }} />
                </div>
              </div>
            </div>

            <IataInput
              label="도착 (TO)"
              value={form.destination}
              onChange={set('destination')}
              required={wasNull.destination}
            />
          </div>
        </div>

        {/* ── Departure Date ── */}
        <div className="mb-5">
          <Field label="출발 날짜 (Departure Date)" wasNull={wasNull.departureDate}>
            <input
              type="date"
              value={form.departureDate}
              onChange={(e) => set('departureDate')(e.target.value)}
              className={[
                darkInput(!form.departureDate, wasNull.departureDate),
                'w-auto',   // date inputs shouldn't stretch full width on all browsers
              ].join(' ')}
            />
          </Field>
        </div>

        {/* ── Perforation ── */}
        <div className="my-5 border-t border-dashed border-white/[0.07]" />

        {/* ── Amount + Currency (optional) ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="결제 금액 (Amount)" wasNull={false}>
              <input
                type="text"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => set('amount')(e.target.value.replace(/\D/g, ''))}
                placeholder="850000"
                className={[darkInput(false, false), "font-['JetBrains_Mono',monospace]"].join(' ')}
              />
            </Field>
          </div>
          <div>
            <Field label="통화 (Currency)" wasNull={false}>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => set('currency')(e.target.value.toUpperCase())}
                placeholder="KRW"
                maxLength={3}
                className={[darkInput(false, false), "font-['JetBrains_Mono',monospace] tracking-widest"].join(' ')}
              />
            </Field>
          </div>
        </div>

        {/* ── AI Reasoning (collapsed hint) ── */}
        {extracted.raw_reasoning && (
          <p className="mt-5 border-t border-white/[0.05] pt-3.5 text-[11px] leading-relaxed text-white/20">
            {extracted.raw_reasoning}
          </p>
        )}
      </div>

      {/* ── Validation hint ── */}
      {!canSubmit && (form.origin || form.destination || form.flightNumber) && (
        <p className="mt-2.5 text-[11px] text-amber-500/70">
          {!isValidIata(form.origin) && form.origin ? '출발지 IATA 코드를 확인하세요 (예: ICN). ' : ''}
          {!isValidIata(form.destination) && form.destination ? '도착지 IATA 코드를 확인하세요 (예: JFK). ' : ''}
          {!form.departureDate ? '출발 날짜를 입력해주세요.' : ''}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="mt-4 flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-[13px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          다시 입력
        </button>
        <button
          onClick={() => canSubmit && onConfirm(form.flightNumber.trim(), form.departureDate.trim())}
          disabled={!canSubmit || loading}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5',
            'text-[13px] font-semibold text-white transition-colors',
            canSubmit && !loading ? 'bg-neutral-900 hover:bg-neutral-700' : 'cursor-not-allowed bg-neutral-300',
          ].join(' ')}
        >
          {loading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> 확인 중…</>
            : '데이터 확정 및 보상 확인 →'}
        </button>
      </div>
    </motion.div>
  )
}

// ─── ANIMATED KRW (direct manwon value, no EUR conversion) ───────────────────

function AnimatedKrwDirect({ manwon }: { manwon: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const ctrl = animate(0, manwon, {
      duration: 1.2,
      ease:     [0.16, 1, 0.3, 1],
      onUpdate(v) { node.textContent = `≈ ₩${(Math.round(v) * 10_000).toLocaleString()}` },
    })
    return () => ctrl.stop()
  }, [manwon])
  return <span ref={ref}>≈ ₩0</span>
}

// ─── RESULT SECTION ───────────────────────────────────────────────────────────

interface ResultSectionProps {
  check:        CheckData
  flightNumber: string
  date:         string
  onReset:      () => void
  /** undefined = auth state still loading; null = not signed in; string = user ID */
  userId:       string | null | undefined
}

function ResultSection({ check, flightNumber, date, onReset, userId }: ResultSectionProps) {
  const router = useRouter()
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [saveError, setSaveError]  = useState<string | null>(null)
  const [copied, setCopied]        = useState(false)

  // computeCompensation detects KR_DOMESTIC when server returned NONE
  const comp = computeCompensation(
    check.flight.departure_airport,
    check.flight.arrival_airport,
    check.flight.airline_iata,
    check.flight.delay_minutes,
    check.flight.status === 'CANCELLED',
    check.regulation,
    check.distanceKm,
  )

  const isEu261 = comp.eligible && (comp.regulation === 'EU261' || comp.regulation === 'UK261')
  const isKrDom = comp.eligible && comp.regulation === 'KR_DOMESTIC'
  const manwon  = Math.round(comp.compensationKrw / 10_000)

  // ── Save or redirect to login ──────────────────────────────────────────────
  // If signed in → normal save flow
  // If not signed in → stash result in sessionStorage, redirect to login
  //   After OAuth/magic-link, callback → /flights/check → component restores state

  function handleLoginToSave() {
    const pending: PendingClaim = { check, flightNumber, date }
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    router.push(`/login?next=${encodeURIComponent('/flights/check')}`)
  }

  async function handleSave() {
    if (saveState !== 'idle' || !isEu261 || comp.tier == null) return
    setSaveState('saving')
    setSaveError(null)
    const result = await saveFlightClaim({
      flightNumber:     flightNumber.toUpperCase(),
      airlineIata:      check.flight.airline_iata,
      departureAirport: check.flight.departure_airport,
      arrivalAirport:   check.flight.arrival_airport,
      scheduledDate:    date,
      delayMinutes:     check.flight.delay_minutes,
      cancelled:        check.flight.status === 'CANCELLED',
      compensationEur:  comp.tier,                           // 250 | 400 | 600, typed via FullCompensationResult.tier
      regulation:       comp.regulation as 'EU261' | 'UK261',
    })
    if (result.ok === false) {
      setSaveState('idle')
      setSaveError(result.error)
      return
    }
    setSaveState('saved')
    router.refresh()                                         // invalidate RSC router cache so /dashboard renders fresh data
    setTimeout(() => router.push('/dashboard'), 1200)
  }

  async function handleShare() {
    const flightLabel = flightNumber.toUpperCase()
    const shareText = comp.eligible
      ? isEu261
        ? `✈️ ${flightLabel} is eligible for EU261 compensation!\nUp to €${comp.compensationEur} (≈ ₩${(manwon * 10_000).toLocaleString()}) per passenger.\n\nCheck your flight too 👇`
        : `✈️ ${flightLabel} 국내선 항공편이 보상 대상이에요!\n≈ ₩${(manwon * 10_000).toLocaleString()}을 받을 수 있어요.\n\n내 항공편도 확인해보세요 👇`
      : `✈️ 내 항공편 보상 여부를 FlyBack에서 확인했어요. 친구도 확인해봐요! 👇`
    const shareUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/flights/check`
      : ''

    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: 'FlyBack 항공 보상 결과', text: shareText, url: shareUrl }) }
      catch { /* user cancelled — no-op */ }
    } else {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Shared: small flight identity row used inside each card
  const FlightMeta = () => (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="font-['JetBrains_Mono',monospace] font-semibold">
        {flightNumber.toUpperCase()}
      </span>
      <span className="opacity-30">·</span>
      <span className="opacity-40">{date}</span>
      <span className="opacity-30">·</span>
      <span className="opacity-40">
        {check.flight.departure_airport} → {check.flight.arrival_airport}
      </span>
    </div>
  )

  // Share button — rendered on all eligible cards
  const ShareButton = () => (
    <button
      onClick={handleShare}
      className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-current/[0.08] py-2.5 text-[12px] opacity-40 transition-opacity hover:opacity-70"
    >
      <Share2 className="h-3.5 w-3.5" />
      {copied ? '링크가 복사되었습니다 ✓' : '내 친구도 보상받을 수 있을까? 공유하기'}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-4"
    >
      {/* ── EU261 / UK261 eligible ── */}
      {isEu261 && (
        <div className="rounded-2xl bg-[#003366] px-6 py-6 shadow-[0_24px_48px_rgba(0,51,102,0.45)]">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
              보상 청구 가능
            </span>
          </div>

          {/* EUR primary + KRW cascade */}
          <div className="mt-3 font-black leading-none tracking-tight text-white"
               style={{ fontSize: 'clamp(40px, 14vw, 64px)' }}>
            <AnimatedEur value={comp.compensationEur} />
          </div>
          <div className="mt-1.5 text-[clamp(16px,5vw,22px)] font-bold text-white/35">
            <AnimatedKrw eur={comp.compensationEur} />
          </div>

          <div className="mt-3 flex items-center gap-3 text-[12px] text-white/40">
            <span>Article 7 · {REGULATION_LABEL[comp.regulation]}</span>
            {check.distanceKm && (
              <span>{Math.round(check.distanceKm).toLocaleString()} km</span>
            )}
          </div>

          {/* Flight identity */}
          <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.04] px-4 py-3 text-white">
            <FlightMeta />
            <div className="mt-1 text-[11px] text-white/30">
              {check.flight.status === 'CANCELLED'
                ? 'Cancelled'
                : check.flight.delay_minutes > 0
                  ? `${Math.floor(check.flight.delay_minutes / 60)}h ${check.flight.delay_minutes % 60}m delay`
                  : 'On time'}
            </div>
          </div>

          {/* Save CTA — three states: loading auth, not signed in, signed in */}
          <div className="mt-5 space-y-2.5">
            {userId === undefined ? (
              // Auth state still resolving — show skeleton to prevent layout shift
              <div className="h-[46px] w-full animate-pulse rounded-xl bg-white/[0.06]" />
            ) : userId === null ? (
              // Not signed in → prompt to log in
              <button
                onClick={handleLoginToSave}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13px] font-semibold text-neutral-900 transition-colors hover:bg-white/90"
              >
                로그인하여 저장하기
              </button>
            ) : (
              // Signed in → normal save flow
              <button
                onClick={handleSave}
                disabled={saveState !== 'idle'}
                className={[
                  'flex w-full items-center justify-center gap-2 rounded-xl py-3',
                  'text-[13px] font-semibold transition-all duration-300',
                  saveState === 'saved'
                    ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                    : saveState === 'saving'
                      ? 'bg-white/[0.08] text-white/40 cursor-not-allowed'
                      : 'bg-white text-neutral-900 hover:bg-white/90',
                ].join(' ')}
              >
                {saveState === 'saved' ? (
                  <><CheckCircle className="h-4 w-4" /> 대시보드에 저장됨 — 이동 중…</>
                ) : saveState === 'saving' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> 저장 중…</>
                ) : '대시보드에 저장하기'}
              </button>
            )}

            {/* Save error */}
            <AnimatePresence>
              {saveError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-[12px] text-red-300"
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1">{saveError}</span>
                  <button
                    onClick={() => setSaveError(null)}
                    className="shrink-0 opacity-50 hover:opacity-100"
                    aria-label="닫기"
                  >
                    ×
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <Link
              href="/dashboard"
              className="block w-full text-center text-[12px] text-white/30 transition-colors hover:text-white/60"
            >
              청구서 자동 생성하기 →
            </Link>

            <div className="text-white">
              <ShareButton />
            </div>
          </div>
        </div>
      )}

      {/* ── Korean domestic eligible ── */}
      {isKrDom && (
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-6 py-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-amber-500" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-600">
              국내선 보상 대상
            </span>
          </div>
          <div className="mt-3 font-black leading-none tracking-tight text-amber-900"
               style={{ fontSize: 'clamp(36px, 12vw, 52px)' }}>
            <AnimatedKrwDirect manwon={manwon} />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-amber-700/80">{comp.reason}</p>
          <div className="mt-4 text-amber-700">
            <FlightMeta />
          </div>
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-100/60 px-4 py-3 text-[12px] text-amber-700">
            국내선 보상은 항공사에 직접 청구하거나 한국소비자원에 조정 신청할 수 있습니다.
          </div>
          <div className="mt-3 text-amber-700">
            <ShareButton />
          </div>
        </div>
      )}

      {/* ── Not eligible ── */}
      {!comp.eligible && (
        <div className="rounded-2xl border border-neutral-200 bg-white px-6 py-6 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-neutral-400" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
              {comp.regulation === 'NONE' ? 'Not Covered' : '기준 미달'}
            </span>
          </div>
          <p className="mt-3 text-[15px] font-semibold leading-snug text-neutral-800">
            {comp.regulation === 'NONE'
              ? '이 항공편은 EU261 / UK261 적용 대상이 아닙니다.'
              : comp.regulation === 'KR_DOMESTIC'
                ? '국내선 보상 기준을 충족하지 않습니다.'
                : '보상 기준을 충족하지 않습니다.'}
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">{comp.reason}</p>
          <div className="mt-4 text-neutral-500">
            <FlightMeta />
          </div>
          <div className="mt-5">
            <Link
              href="mailto:support@claimkit.io"
              className="inline-flex items-center gap-1.5 rounded-xl border border-neutral-200 px-4 py-2.5 text-[12px] font-medium text-neutral-500 transition-colors hover:bg-neutral-50"
            >
              문의하기
            </Link>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 text-[13px] text-neutral-400 transition-colors hover:text-neutral-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> 다른 항공편 확인
      </button>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function FlightCheckClient() {
  const [step, setStep] = useState<Step>({ tag: 'idle' })
  const [mode, setMode] = useState<InputMode>('email')
  // undefined = resolving, null = signed out, string = user ID
  const [userId, setUserId] = useState<string | null | undefined>(undefined)

  // ── Auth state + pending claim restore ──────────────────────────────────
  useEffect(() => {
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    sb.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null
      setUserId(uid)

      // If signed in, check for a pending claim stashed before the login redirect
      if (uid) {
        const raw = sessionStorage.getItem(PENDING_KEY)
        if (raw) {
          sessionStorage.removeItem(PENDING_KEY)
          try {
            const pending = JSON.parse(raw) as PendingClaim
            setStep({ tag: 'result', check: pending.check, flightNumber: pending.flightNumber, date: pending.date })
          } catch {
            // malformed data — ignore
          }
        }
      }
    })

    // Keep userId in sync if the user signs out in another tab
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleExtract = useCallback(async (emailBody: string) => {
    setStep({ tag: 'extracting' })
    const res = await postJson<ParsedEmailFlight>('/api/flights/parse-email', { emailBody })
    if (res.success === false) {
      const isAuthError = res.error === 'Unauthorized'
      setStep({
        tag: 'error',
        isAuthError,
        message: isAuthError
          ? '이메일 자동 분석은 로그인 후 사용할 수 있어요. 로그인하거나 직접 입력 탭을 이용해주세요.'
          : res.error,
      })
      return
    }
    setStep({ tag: 'reviewing', extracted: res.data })
  }, [])

  const handleCheck = useCallback(async (flightNumber: string, date: string) => {
    setStep({ tag: 'checking', flightNumber, date })
    const res = await postJson<CheckData>('/api/flights/check', { flightNumber, date })
    if (res.success === false) { setStep({ tag: 'error', message: res.error }); return }
    setStep({ tag: 'result', check: res.data, flightNumber, date })
  }, [])

  const reset = useCallback(() => setStep({ tag: 'idle' }), [])

  return (
    <div className="min-h-[100svh] bg-[#FDFDFD] px-5 py-10 md:px-12 md:py-12"
         style={{ paddingLeft: 'max(20px, env(safe-area-inset-left))', paddingRight: 'max(20px, env(safe-area-inset-right))' }}>
      <div className="mx-auto max-w-xl">

        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#003366]">
            <Plane className="h-[18px] w-[18px] text-white" />
          </div>
          <h1 className="text-[26px] font-black tracking-tight text-neutral-900">
            항공편 보상 조회
          </h1>
          <p className="mt-1.5 text-[14px] text-neutral-400">
            EU261 또는 UK261에 따른 보상 여부를 즉시 확인하세요 — 최대 €600/인.
          </p>
        </div>

        {/* State views */}
        <AnimatePresence mode="wait" initial={false}>
          {(step.tag === 'idle' || step.tag === 'extracting') && (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              <InputSection
                mode={mode} setMode={setMode}
                onExtract={handleExtract} onManual={handleCheck}
                loading={step.tag === 'extracting'}
              />
            </motion.div>
          )}

          {step.tag === 'reviewing' && (
            <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ReviewSection
                extracted={step.extracted}
                onConfirm={handleCheck}
                onBack={reset}
                loading={false}
              />
            </motion.div>
          )}

          {step.tag === 'checking' && (
            <motion.div
              key="checking"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              <CalculatingSection flightNumber={step.flightNumber} date={step.date} />
            </motion.div>
          )}

          {step.tag === 'result' && (
            <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ResultSection
                check={step.check} flightNumber={step.flightNumber}
                date={step.date} onReset={reset} userId={userId}
              />
            </motion.div>
          )}

          {step.tag === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5"
            >
              <p className="text-[13px] font-semibold text-red-700">오류가 발생했습니다</p>
              <p className="mt-1 text-[12px] leading-relaxed text-red-500">{step.message}</p>
              <div className="mt-4 flex items-center gap-4">
                <button onClick={reset} className="flex items-center gap-1.5 text-[12px] font-medium text-red-600 hover:text-red-800">
                  <ArrowLeft className="h-3 w-3" /> 다시 시도
                </button>
                {step.isAuthError && (
                  <Link
                    href={`/login?next=${encodeURIComponent('/flights/check')}`}
                    className="text-[12px] font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
                  >
                    로그인하기 →
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}
