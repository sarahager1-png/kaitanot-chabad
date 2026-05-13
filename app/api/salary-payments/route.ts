import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.camp_id || !body.employee_id || !body.month)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('salary_payments')
    .upsert({
      camp_id: body.camp_id,
      employee_id: body.employee_id,
      month: body.month,
      amount: Number(body.amount) || 0,
      status: 'paid',
      receipt_url: body.receipt_url ?? null,
      notes: body.notes ?? null,
      paid_at: new Date().toISOString(),
    }, { onConflict: 'employee_id,month' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
