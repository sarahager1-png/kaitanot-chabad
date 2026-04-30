import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const service = createServiceClient()
  const { data, error } = await service
    .from('trip_files')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const campId = formData.get('camp_id') as string | null
  const docLabel = formData.get('doc_label') as string | null
  if (!file || !campId) return NextResponse.json({ error: 'file and camp_id required' }, { status: 400 })

  const path = `${campId}/trips/${tripId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const service = createServiceClient()
  const { error: uploadErr } = await service.storage
    .from('camp-documents')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from('camp-documents').getPublicUrl(path)

  const { data, error } = await service
    .from('trip_files')
    .insert({ trip_id: tripId, camp_id: campId, file_name: file.name, file_url: publicUrl, file_size: file.size, uploaded_by: user.id, doc_label: docLabel || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { fileId, fileUrl } = await req.json()
  const service = createServiceClient()

  const url = new URL(fileUrl)
  const storagePath = url.pathname.split('/camp-documents/')[1]
  if (storagePath) await service.storage.from('camp-documents').remove([storagePath])

  const { error } = await service.from('trip_files').delete().eq('id', fileId).eq('trip_id', tripId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
