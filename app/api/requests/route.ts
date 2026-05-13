import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.camp_id || !body.name)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('payment_requests')
    .insert({
      camp_id: body.camp_id,
      name: body.name,
      amount: Number(body.amount) || 0,
      category: body.category ?? null,
      notes: body.notes ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
