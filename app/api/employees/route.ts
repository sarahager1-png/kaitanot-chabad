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
    .from('employees')
    .insert({
      camp_id: body.camp_id,
      name: body.name,
      role: body.role ?? null,
      monthly_salary: Number(body.monthly_salary) || 0,
      notes: body.notes ?? null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
