import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await req.formData()
  const file = form.get('file') as File | null
  const contentId = form.get('contentId') as string | null

  if (!file || !contentId) return NextResponse.json({ error: 'file and contentId required' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'bin'
  const path = `shared/${contentId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const service = createServiceClient()
  const { error: uploadErr } = await service.storage
    .from('camp-documents')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from('camp-documents').getPublicUrl(path)

  const { error: updateErr } = await service
    .from('shared_content')
    .update({ file_url: publicUrl })
    .eq('id', contentId)

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })
  return NextResponse.json({ url: publicUrl })
}
