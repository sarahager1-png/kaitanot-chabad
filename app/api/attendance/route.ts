import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const camp_id = searchParams.get('camp_id')
  const date = searchParams.get('date')
  if (!camp_id || !date) return NextResponse.json({ error: 'Missing camp_id or date' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await assertCampAccess(supabase, user.id, camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('camp_id', camp_id)
    .eq('date', date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { camp_id, date, records } = await request.json()
  if (!camp_id || !date || !Array.isArray(records))
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  try {
    await assertCampAccess(supabase, user.id, camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const rows = records.map((r: { registrant_id: string; present: boolean; notes?: string }) => ({
    camp_id,
    date,
    registrant_id: r.registrant_id,
    present: r.present,
    notes: r.notes ?? null,
  }))

  const { data, error } = await service
    .from('attendance')
    .upsert(rows, { onConflict: 'registrant_id,date' })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: data?.length ?? 0 })
}
