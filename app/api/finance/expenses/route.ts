import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const campId = searchParams.get('camp_id')
  if (!campId) return NextResponse.json({ error: 'Missing camp_id' }, { status: 400 })

  // אימות שהמשתמש רשאי לראות את הנתונים של הקייטנה
  try {
    await assertCampAccess(supabase, user.id, campId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('expense_entries')
    .select('*')
    .eq('camp_id', campId)
    .order('entry_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  try {
    await assertCampAccess(supabase, user.id, body.camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const { data, error } = await service.from('expense_entries').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // קבלת ה-camp_id לפני עדכון — מניעת IDOR
  const { data: entry } = await service
    .from('expense_entries')
    .select('camp_id')
    .eq('id', id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await assertCampAccess(supabase, user.id, entry.camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await service.from('expense_entries').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const service = createServiceClient()

  // קבלת ה-camp_id של הרשומה לפני מחיקה — מניעת IDOR
  const { data: entry } = await service
    .from('expense_entries')
    .select('camp_id')
    .eq('id', id)
    .single()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await assertCampAccess(supabase, user.id, entry.camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await service.from('expense_entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
