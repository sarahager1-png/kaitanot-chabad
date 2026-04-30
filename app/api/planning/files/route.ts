import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File
  const planId = formData.get('plan_id') as string
  const campId = formData.get('camp_id') as string

  if (!file || !planId || !campId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${campId}/${planId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('planning-files')
    .upload(path, file, { upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabase.storage.from('planning-files').getPublicUrl(path)

  const { data, error } = await supabase.from('plan_files').insert({
    plan_id: planId,
    camp_id: campId,
    file_name: file.name,
    file_url: urlData.publicUrl,
    file_size: file.size,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, file_url } = await req.json()

  // Extract storage path from URL
  const url = new URL(file_url)
  const path = url.pathname.split('/planning-files/')[1]
  if (path) await supabase.storage.from('planning-files').remove([path])

  const { error } = await supabase.from('plan_files').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
