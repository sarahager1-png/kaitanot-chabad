import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// שדות Cardcom (סיסמאות) מוסתרים במכוון — אין לחשוף credentials ב-API פתוח
const SAFE_CAMP_FIELDS = 'id,name,school_year,address,phone,registration_open_at,registration_close_at,camp_open_at,camp_close_at,registration_goal,created_at,updated_at'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('camps')
    .select(SAFE_CAMP_FIELDS)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createServiceClient()
  const { data: profile } = await service.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'אדמין מערכת' && profile?.role !== 'מנהל רשת')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()

  // ולידציית שדות חובה
  if (!body.name?.trim())
    return NextResponse.json({ error: 'שם הקייטנה הוא שדה חובה' }, { status: 400 })
  if (!body.school_year?.trim())
    return NextResponse.json({ error: 'שנת לימודים היא שדה חובה' }, { status: 400 })

  const { tracks, ...campData } = body

  const { data: camp, error } = await supabase
    .from('camps')
    .insert(campData)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tracks && tracks.length > 0) {
    await supabase.from('tracks').insert(
      tracks.map((t: { name: string; description: string | null; price: number }) => ({
        ...t,
        camp_id: camp.id,
      }))
    )
  }

  return NextResponse.json(camp, { status: 201 })
}
