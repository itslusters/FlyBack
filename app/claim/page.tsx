'use client'

import { useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane, ArrowRight, ArrowLeft, CheckCircle, FileText,
  Download, Copy, Upload, X, Loader2, Send, ImageIcon,
} from 'lucide-react'

const E = [0.25, 0.46, 0.45, 0.94] as const

function GradText({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ background: 'linear-gradient(135deg,#638cff 0%,#818fff 50%,#55ccff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
      {children}
    </span>
  )
}

// ─── STEPS ────────────────────────────────────────────────────────────────────

const STEPS = ['Flight', 'Date', 'Delay', 'Details', 'Documents', 'Letter']

// ─── FILE UPLOAD HELPERS ──────────────────────────────────────────────────────

interface UploadedFile { name: string; url: string; preview?: string }

async function uploadFile(file: File, folder: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('folder', folder)
  const res  = await fetch('/api/upload', { method: 'POST', body: form })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? 'Upload failed')
  return data.url as string
}

// ─── UPLOAD ZONE ─────────────────────────────────────────────────────────────

function UploadZone({
  label, hint, file, onFile, onClear,
}: {
  label: string; hint: string
  file: UploadedFile | null
  onFile: (f: UploadedFile) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState<string | null>(null)

  async function handle(raw: File) {
    setErr(null)
    setBusy(true)
    try {
      const url     = await uploadFile(raw, 'claims')
      const preview = raw.type.startsWith('image/') ? URL.createObjectURL(raw) : undefined
      onFile({ name: raw.name, url, preview })
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  function onDrop(ev: React.DragEvent) {
    ev.preventDefault()
    const f = ev.dataTransfer.files[0]
    if (f) handle(f)
  }

  return (
    <div>
      <p className="mb-1.5 text-[13px] text-[#8a8f98]">{label}</p>

      {file ? (
        <div className="flex items-center gap-3 rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-3">
          {file.preview
            ? <img src={file.preview} alt="" className="h-10 w-10 rounded-[6px] object-cover" />
            : <div className="flex h-10 w-10 items-center justify-center rounded-[6px] bg-white/[0.05]">
                <FileText className="h-5 w-5 text-[#638cff]" />
              </div>
          }
          <p className="flex-1 truncate text-[13px] text-[#f7f8f8]">{file.name}</p>
          <button onClick={onClear} className="text-[#8a8f98] hover:text-[#f7f8f8]">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-[10px] border border-dashed border-white/[0.12] bg-white/[0.02] px-4 py-8 transition-colors hover:border-white/[0.22] hover:bg-white/[0.04]"
        >
          {busy
            ? <Loader2 className="h-5 w-5 animate-spin text-[#638cff]" />
            : <><ImageIcon className="h-5 w-5 text-[#8a8f98]" />
               <p className="text-[13px] text-[#8a8f98]">{hint}</p>
               <p className="text-[11px] text-[#8a8f98]/60">JPEG · PNG · PDF · max 10 MB</p></>
          }
        </div>
      )}
      {err && <p className="mt-1.5 text-[12px] text-[#ff7a7a]">{err}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        onChange={e => { const f = e.target.files?.[0]; if (f) handle(f) }}
      />
    </div>
  )
}

// ─── FORM INNER ───────────────────────────────────────────────────────────────

function ClaimInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [dir,  setDir]  = useState(1)

  const [flight,    setFlight]    = useState(params.get('flight') ?? '')
  const [date,      setDate]      = useState(params.get('date')   ?? '')
  const [delayType, setDelayType] = useState('')
  const [name,      setName]      = useState('')
  const [email,     setEmail]     = useState('')
  const [copied,    setCopied]    = useState(false)

  // Documents step
  const [boardingPass, setBoardingPass] = useState<UploadedFile | null>(null)
  const [delayDoc,     setDelayDoc]     = useState<UploadedFile | null>(null)

  // Send-email state
  const [sending,    setSending]    = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const amount = Number(params.get('amount') ?? 600)

  function go(n: number) { setDir(n > step ? 1 : -1); setStep(n) }
  function next() { go(step + 1) }
  function back() { go(step - 1) }

  const letter = `Dear Customer Relations Team,

I am writing to claim compensation under EU Regulation 261/2004 (or UK Regulation 261/2004) for flight ${flight || 'KE907'} operated on ${date || '2026-04-14'}.

The flight was ${delayType === 'cancelled' ? 'cancelled' : `delayed by ${delayType === '2-3h' ? '2–3 hours' : delayType === '3-4h' ? '3–4 hours' : 'more than 4 hours'} at the final destination`}, which exceeds the threshold established under Article 6 of the regulation.

Under Article 7(1)(c), I am entitled to compensation of €${amount} per passenger for routes exceeding 3,500 km.

Please process this compensation claim within 14 days. I reserve the right to escalate this matter to the National Enforcement Body and pursue the matter through the courts if necessary.

Yours faithfully,
${name || '[Your name]'}
${email || '[Your email]'}`

  function copyLetter() {
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  async function sendEmail() {
    setSending(true)
    setSendResult(null)
    try {
      const attachmentUrls = [boardingPass?.url, delayDoc?.url].filter(Boolean) as string[]
      const res = await fetch('/api/send-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flight, date,
          delayMin: delayType === '2-3h' ? 150 : delayType === '3-4h' ? 210 : delayType === '4h+' ? 270 : 0,
          cancelled: delayType === 'cancelled',
          amount, name, email,
          attachmentUrls,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSendResult({ ok: true, msg: `Sent to airline. Copy delivered to ${email}.` })
      } else {
        setSendResult({ ok: false, msg: data.error ?? 'Send failed — use the copy button to submit manually.' })
      }
    } catch {
      setSendResult({ ok: false, msg: 'Network error — copy the letter and submit manually.' })
    } finally {
      setSending(false)
    }
  }

  const variants = {
    enter:  (d: number) => ({ opacity: 0, x: d > 0 ?  32 : -32 }),
    center: { opacity: 1, x: 0 },
    exit:   (d: number) => ({ opacity: 0, x: d > 0 ? -32 :  32 }),
  }

  const canNext = [
    flight.trim().length > 0,
    date.length > 0,
    delayType.length > 0,
    name.trim().length > 0 && email.trim().length > 0,
    true,  // documents optional
    true,
  ][step]

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f7f8f8]">

      {/* Nav */}
      <header className="border-b border-white/[0.05]" style={{ background: 'rgba(8,9,10,0.9)', backdropFilter: 'blur(20px)' }}>
        <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[14px]">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[6px] bg-[#638cff]">
              <Plane className="h-3 w-3 text-white" />
            </div>
            <span className="text-[16px] font-[590] leading-[24px] text-[#f7f8f8]">FlyBack</span>
          </Link>
          <Link href="/check" className="text-[14px] font-[510] leading-[21px] text-[#8a8f98] hover:text-[#f7f8f8]">Cancel</Link>
        </nav>
      </header>

      <main className="mx-auto max-w-[560px] px-6 py-[88px]">

        {/* Progress */}
        <div className="mb-[28px]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] text-[#8a8f98]">Step {step + 1} of {STEPS.length}</span>
            <span className="text-[13px] text-[#8a8f98]">{STEPS[step]}</span>
          </div>
          <div className="h-px w-full rounded-full bg-white/[0.06]">
            <div className="h-px rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%`, background: 'linear-gradient(90deg,#638cff 0%,#55ccff 100%)' }} />
          </div>
        </div>

        {/* Steps */}
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.28, ease: E }}>

            {/* 0 — Flight */}
            {step === 0 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">01 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  What&apos;s your<br /><GradText>flight number?</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">Enter the IATA flight code — e.g. KE 907, BA 0007</p>
                <input type="text" value={flight} onChange={e => setFlight(e.target.value.toUpperCase())}
                  placeholder="KE 907" autoFocus
                  className="w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-4 text-[20px] font-[590] text-[#f7f8f8] placeholder:text-[#8a8f98]/40 outline-none transition-all focus:border-[#638cff]/40"
                  style={{ boxShadow: flight ? '0 0 0 1px rgba(99,140,255,0.15)' : undefined }}
                />
              </div>
            )}

            {/* 1 — Date */}
            {step === 1 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">02 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  When did you<br /><GradText>fly?</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">The scheduled departure date of your flight.</p>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} autoFocus
                  className="w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-4 text-[20px] font-[590] text-[#f7f8f8] outline-none transition-all focus:border-[#638cff]/40 [color-scheme:dark]"
                  style={{ boxShadow: date ? '0 0 0 1px rgba(99,140,255,0.15)' : undefined }}
                />
              </div>
            )}

            {/* 2 — Delay type */}
            {step === 2 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">03 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  What happened<br /><GradText>to your flight?</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">Select the option that best describes your situation.</p>
                <div className="space-y-[1px]">
                  {[
                    { v: 'cancelled', l: 'Flight was cancelled',  s: 'Full Article 7 compensation' },
                    { v: '4h+',       l: 'Delayed 4+ hours',      s: 'Full Article 7 compensation' },
                    { v: '3-4h',      l: 'Delayed 3–4 hours',     s: 'Full Article 7 compensation' },
                    { v: '2-3h',      l: 'Delayed 2–3 hours',     s: 'May qualify depending on circumstance' },
                    { v: 'denied',    l: 'Denied boarding',        s: 'Full Article 7 compensation' },
                  ].map(({ v, l, s }) => (
                    <button key={v} onClick={() => setDelayType(v)}
                      className="flex w-full items-center justify-between rounded-[10px] border px-4 py-[14px] text-left transition-all"
                      style={{
                        borderColor: delayType === v ? 'rgba(99,140,255,0.35)' : 'rgba(255,255,255,0.06)',
                        background:  delayType === v ? 'rgba(99,140,255,0.08)'  : 'rgba(255,255,255,0.02)',
                      }}>
                      <div>
                        <p className="text-[16px] font-[590] text-[#f7f8f8]">{l}</p>
                        <p className="text-[13px] text-[#8a8f98]">{s}</p>
                      </div>
                      {delayType === v && <CheckCircle className="h-4 w-4 shrink-0 text-[#638cff]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 3 — Details */}
            {step === 3 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">04 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  Your contact<br /><GradText>details</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">Used in the claim letter. We don&apos;t store this data.</p>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[13px] text-[#8a8f98]">Full name</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Kim Ji-yeon"
                      className="w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-3 text-[16px] text-[#f7f8f8] placeholder:text-[#8a8f98]/40 outline-none transition-all focus:border-[#638cff]/40" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[13px] text-[#8a8f98]">Email address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com"
                      className="w-full rounded-[10px] border border-white/[0.08] bg-[#0f1013] px-4 py-3 text-[16px] text-[#f7f8f8] placeholder:text-[#8a8f98]/40 outline-none transition-all focus:border-[#638cff]/40" />
                  </div>
                </div>
              </div>
            )}

            {/* 4 — Documents */}
            {step === 4 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">05 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  Add supporting<br /><GradText>documents</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">
                  Optional but strengthens your claim. Attach your boarding pass and any delay confirmation.
                </p>
                <div className="space-y-4">
                  <UploadZone
                    label="Boarding Pass"
                    hint="Drag & drop or tap to upload"
                    file={boardingPass}
                    onFile={setBoardingPass}
                    onClear={() => setBoardingPass(null)}
                  />
                  <UploadZone
                    label="Delay / Cancellation Confirmation"
                    hint="Airline notification, app screenshot, etc."
                    file={delayDoc}
                    onFile={setDelayDoc}
                    onClear={() => setDelayDoc(null)}
                  />
                </div>
                <p className="mt-4 text-[12px] text-[#8a8f98]/60">
                  Files are stored securely and only used for your claim.
                </p>
              </div>
            )}

            {/* 5 — Letter */}
            {step === 5 && (
              <div>
                <p className="mb-2 text-[13px] text-[#638cff]">06 / {STEPS.length}</p>
                <h1 className="mb-2 text-[32px] font-[590] leading-[1.1] tracking-[-0.02em]">
                  Your claim letter<br /><GradText>is ready.</GradText>
                </h1>
                <p className="mb-[28px] text-[16px] text-[#8a8f98]">
                  Send it directly to the airline or copy and submit via their web form.
                </p>

                {/* Letter preview */}
                <div className="mb-[28px] overflow-hidden rounded-[10px] border border-white/[0.06] bg-[#0c0d10]">
                  <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-3.5 w-3.5 text-[#638cff]" />
                      <span className="text-[13px] font-[590] text-[#f7f8f8]">claim-{flight || 'KE907'}.txt</span>
                    </div>
                    <span className="rounded-full bg-[#638cff]/10 px-2 py-0.5 text-[11px] text-[#638cff] ring-1 ring-[#638cff]/20">
                      EU261 Art.7 · €{amount}
                    </span>
                  </div>
                  <pre className="overflow-auto p-4 text-[13px] leading-[20px] text-[#8a8f98] whitespace-pre-wrap font-mono">
                    {letter}
                  </pre>
                </div>

                {/* Attachments summary */}
                {(boardingPass || delayDoc) && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[boardingPass, delayDoc].filter(Boolean).map(f => (
                      <div key={f!.url} className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-3 py-1">
                        <Upload className="h-3 w-3 text-[#638cff]" />
                        <span className="max-w-[160px] truncate text-[12px] text-[#8a8f98]">{f!.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Send result */}
                {sendResult && (
                  <div className={`mb-4 flex items-start gap-2 rounded-[8px] border px-3.5 py-3 text-[13px] ${
                    sendResult.ok
                      ? 'border-emerald-500/20 bg-emerald-500/08 text-emerald-400'
                      : 'border-[rgba(255,122,122,0.2)] bg-[rgba(255,122,122,0.08)] text-[#ff7a7a]'
                  }`}>
                    {sendResult.ok ? <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : null}
                    <span>{sendResult.msg}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  {/* Primary: Send to airline */}
                  <button onClick={sendEmail} disabled={sending || sendResult?.ok}
                    className="flex flex-1 min-w-[160px] items-center justify-center gap-1.5 rounded-[10px] py-[11px] text-[14px] font-[590] text-white transition-opacity disabled:opacity-40"
                    style={{ background: 'linear-gradient(135deg,#638cff,#818fff,#55ccff)' }}>
                    {sending
                      ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Sending…</>
                      : sendResult?.ok
                        ? <><CheckCircle className="h-3.5 w-3.5" />Sent</>
                        : <><Send className="h-3.5 w-3.5" />Send to airline</>
                    }
                  </button>

                  {/* Copy */}
                  <button onClick={copyLetter}
                    className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.1] px-4 py-[11px] text-[14px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]">
                    {copied ? <><CheckCircle className="h-3.5 w-3.5" />Copied</> : <><Copy className="h-3.5 w-3.5" />Copy</>}
                  </button>

                  {/* Download */}
                  <button
                    className="flex items-center gap-1.5 rounded-[10px] border border-white/[0.1] px-4 py-[11px] text-[14px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(letter)
                      a.download = `claim-${flight || 'KE907'}.txt`
                      a.click()
                    }}>
                    <Download className="h-3.5 w-3.5" />TXT
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-[28px] flex items-center justify-between">
          {step > 0
            ? <button onClick={back}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.1] px-[18px] py-[9px] text-[13px] text-[#8a8f98] transition-colors hover:border-white/[0.18] hover:text-[#f7f8f8]">
                <ArrowLeft className="h-3.5 w-3.5" />Back
              </button>
            : <div />
          }
          {step < STEPS.length - 1 && (
            <button onClick={next} disabled={!canNext}
              className="flex items-center gap-1.5 rounded-full px-[18px] py-[9px] text-[13px] transition-all disabled:opacity-30"
              style={{ background: canNext ? '#f7f8f8' : 'rgba(255,255,255,0.1)', color: canNext ? '#08090a' : '#8a8f98' }}>
              Continue <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Status page link */}
        {step === STEPS.length - 1 && sendResult?.ok && (
          <div className="mt-5 text-center">
            <Link href="/status" className="text-[13px] text-[#638cff] hover:underline">
              View your claims →
            </Link>
          </div>
        )}

      </main>
    </div>
  )
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-[#08090a]">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#638cff] border-t-transparent" />
      </div>
    }>
      <ClaimInner />
    </Suspense>
  )
}
