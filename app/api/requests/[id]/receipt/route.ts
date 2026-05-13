import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const ALLOWED_EXT  = new Set(['pdf', 'jpg', 'jpeg', 'png'])
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'קובץ גדול מדי' }, { status: 400 })
  if (!ALLOWED_MIME.has(file.type)) return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXT.has(ext)) return NextResponse.json({ error: 'סיומת לא מותרת' }, { status: 400 })

  const service = createServiceClient()

  const { data: req } = await service
    .from('payment_requests')
    .select('camp_id')
    .eq('id', id)
    .single()
  if (!req) return NextResponse.json({ error: 'לא נמצא' }, { status: 404 })

  const path = `${req.camp_id}/requests/${id}.${ext}`
  const bytes = await file.arrayBuffer()

  const { error: upErr } = await service.storage
    .from('camp-documents')
    .upload(path, bytes, { contentType: file.type, upsert: true })
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

  const { data: signed } = await service.storage
    .from('camp-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  const { data: updated, error: updateErr } = await service
    .from('payment_requests')
    .update({ receipt_url: signed?.signedUrl ?? path, status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

  return NextResponse.json(updated)
}
