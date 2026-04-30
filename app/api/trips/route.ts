import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campId = req.nextUrl.searchParams.get('camp_id')
  if (!campId) return NextResponse.json({ error: 'camp_id required' }, { status: 400 })

  try {
    await assertCampAccess(supabase, user.id, campId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('camp_id', campId)
    .order('trip_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { camp_id, title, description, trip_date } = body

  if (!camp_id || !title) return NextResponse.json({ error: 'camp_id and title required' }, { status: 400 })

  try {
    await assertCampAccess(supabase, user.id, camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('trips')
    .insert({ camp_id, title, description: description || null, trip_date: trip_date || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
