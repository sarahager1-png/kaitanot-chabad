import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_ROLES = new Set(['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'])

export async function PATCH(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: me } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'אדמין מערכת' && me?.role !== 'מנהל רשת')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role } = await request.json()

  // ולידציית role — מניעת הזרקת תפקידים לא מורשים
  if (!VALID_ROLES.has(role))
    return NextResponse.json({ error: `תפקיד לא תקין: ${role}` }, { status: 400 })

  const { error } = await service.from('profiles').update({ role }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
