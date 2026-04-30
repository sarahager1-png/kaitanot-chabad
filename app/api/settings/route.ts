import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()

  // Update profile (name / phone)
  if ('full_name' in body || 'phone' in body) {
    const service = createServiceClient()
    const update: Record<string, string> = {}
    if ('full_name' in body) update.full_name = body.full_name
    if ('phone' in body) update.phone = body.phone
    const { error } = await service.from('profiles').update(update).eq('id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Change email
  if ('email' in body) {
    const { error } = await supabase.auth.updateUser({ email: body.email })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  // Change password
  if ('new_password' in body) {
    const { error } = await supabase.auth.updateUser({ password: body.new_password })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
}
