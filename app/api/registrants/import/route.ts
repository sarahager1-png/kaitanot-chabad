import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { rows, camp_id } = await request.json()
  if (!rows?.length || !camp_id)
    return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  try {
    await assertCampAccess(supabase, user.id, camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()
  const records = rows.map((r: Record<string, string>) => ({
    camp_id,
    first_name: r['שם פרטי'] ?? r['first_name'] ?? '',
    last_name: r['שם משפחה'] ?? r['last_name'] ?? '',
    birth_date: r['תאריך לידה'] ?? r['birth_date'] ?? null,
    group_name: r['קבוצה'] ?? r['group'] ?? null,
    parent1_name: r['שם הורה 1'] ?? r['parent1_name'] ?? null,
    parent1_phone: r['טלפון הורה 1'] ?? r['parent1_phone'] ?? null,
    parent2_name: r['שם הורה 2'] ?? r['parent2_name'] ?? null,
    parent2_phone: r['טלפון הורה 2'] ?? r['parent2_phone'] ?? null,
    email: r['אימייל'] ?? r['email'] ?? null,
    payment_status: r['סטטוס תשלום'] ?? 'טרם שולם',
    amount_paid: Number(r['שולם'] ?? r['amount_paid'] ?? 0),
    amount_due: Number(r['לתשלום'] ?? r['amount_due'] ?? 0),
    notes: r['הערות'] ?? r['notes'] ?? null,
  })).filter((r: { first_name: string; last_name: string }) => r.first_name && r.last_name)

  const { data, error } = await service.from('registrants').insert(records).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ count: data.length }, { status: 201 })
}
