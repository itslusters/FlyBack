/**
 * POST /api/upload
 *
 * Server-side file upload to Supabase Storage.
 * Uses service-role key so the client doesn't need auth.
 *
 * Accepts: multipart/form-data
 *   file   — File (image/jpeg, image/png, image/webp, application/pdf)
 *   folder — optional path prefix (default: "claims")
 *
 * Returns: { url, path }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }              from '@supabase/supabase-js'

const BUCKET     = 'claim-attachments'
const MAX_BYTES  = 10 * 1024 * 1024  // 10 MB
const ALLOWED    = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file   = form.get('file')   as File | null
  const folder = (form.get('folder') as string | null) ?? 'claims'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File exceeds 10 MB limit' }, { status: 413 })
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `File type "${file.type}" not allowed. Use JPEG, PNG, WebP, or PDF.` }, { status: 415 })
  }

  const buf  = Buffer.from(await file.arrayBuffer())
  const ext  = file.name.includes('.') ? file.name.split('.').pop() : 'bin'
  const slug = Math.random().toString(36).slice(2, 9)
  const path = `${folder}/${Date.now()}-${slug}.${ext}`

  const db = getDb()
  const { data, error } = await db.storage
    .from(BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[upload]', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(data.path)

  return NextResponse.json({ url: publicUrl, path: data.path })
}
