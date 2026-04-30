import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role === 'שליח') return NextResponse.json({ error: 'Forbidden — שליחים אינם יכולים לאשר הזמנות' }, { status: 403 })

  // אימות שההזמנה שייכת לקייטנה של המשתמש — מניעת IDOR
  const { data: order } = await service
    .from('orders')
    .select('camp_id')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await assertCampAccess(supabase, user.id, order.camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await service
    .from('orders')
    .update({ ...body, approved_by: user.id, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
