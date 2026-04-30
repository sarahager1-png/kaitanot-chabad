import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function checkAdmin(supabase: Awaited<ReturnType<typeof createClient>>, service: ReturnType<typeof createServiceClient>, userId: string) {
  const { data: me } = await service.from('profiles').select('role').eq('id', userId).single()
  return me?.role === 'אדמין מערכת' || me?.role === 'מנהל רשת'
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  if (!await checkAdmin(supabase, service, user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { camp_id, user_id } = await request.json()
  const { error } = await service.from('camp_users').insert({ camp_id, user_id })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  if (!await checkAdmin(supabase, service, user.id))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { camp_id, user_id } = await request.json()
  const { error } = await service.from('camp_users').delete().eq('camp_id', camp_id).eq('user_id', user_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
