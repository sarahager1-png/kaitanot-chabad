import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_ROLES = new Set(['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'])

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: me } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'אדמין מערכת' && me?.role !== 'מנהל רשת')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email, full_name, role } = await request.json()
  if (!email || !role) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 })

  // ולידציית role — מניעת הזרקת תפקידים לא מורשים
  if (!VALID_ROLES.has(role))
    return NextResponse.json({ error: `תפקיד לא תקין: ${role}` }, { status: 400 })

  const { data, error } = await service.auth.admin.inviteUserByEmail(email, {
    data: { full_name, role },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ id: data.user.id })
}
