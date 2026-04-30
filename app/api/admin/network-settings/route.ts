import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['אדמין מערכת', 'מנהל רשת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const service = createServiceClient()
  const { data } = await service.from('network_settings').select('key, value')
  const settings: Record<string, string> = {}
  ;(data ?? []).forEach(r => { settings[r.key] = r.value })
  return NextResponse.json(settings)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['אדמין מערכת', 'מנהל רשת'].includes(profile?.role ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const service = createServiceClient()

  const updates = [
    { key: 'cardcom_terminal', value: body.cardcom_terminal ?? '' },
    { key: 'cardcom_api_name', value: body.cardcom_api_name ?? '' },
    { key: 'cardcom_api_password', value: body.cardcom_api_password ?? '' },
  ]

  for (const row of updates) {
    await service.from('network_settings').upsert(row, { onConflict: 'key' })
  }

  return NextResponse.json({ ok: true })
}
