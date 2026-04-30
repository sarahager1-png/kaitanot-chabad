import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'
import { isCampScoped, isNetworkAdmin } from '@/lib/roles'

export async function GET(_req: Request, { params }: { params: Promise<{ campId: string }> }) {
  const { campId } = await params
  const supabase = await createClient()
  const { data, error } = await supabase.from('camps').select('*, tracks(*)').eq('id', campId).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: { params: Promise<{ campId: string }> }) {
  const { campId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const role = profile?.role ?? ''

  // מנהל קייטנה יכול לערוך את הקייטנה שלו בלבד
  if (isCampScoped(role)) {
    try { await assertCampAccess(supabase, user.id, campId) }
    catch { return NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }

  const service = createServiceClient()
  const body = await request.json()
  const { tracks, ...campData } = body

  const { data, error } = await service
    .from('camps')
    .update({ ...campData, updated_at: new Date().toISOString() })
    .eq('id', campId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (tracks) {
    await service.from('tracks').delete().eq('camp_id', campId)
    if (tracks.length > 0) {
      await service.from('tracks').insert(
        tracks.map((t: { name: string; description: string | null; price: number }) => ({
          ...t,
          camp_id: campId,
        }))
      )
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ campId: string }> }) {
  const { campId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isNetworkAdmin(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await supabase.from('camps').delete().eq('id', campId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
