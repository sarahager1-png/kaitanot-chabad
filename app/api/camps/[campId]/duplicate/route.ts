import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { isNetworkAdmin } from '@/lib/roles'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ campId: string }> }
) {
  const { campId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isNetworkAdmin(profile?.role ?? '')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { school_year } = body as { school_year: string }
  if (!school_year) return NextResponse.json({ error: 'school_year required' }, { status: 400 })

  const [{ data: camp }, { data: tracks }] = await Promise.all([
    supabase.from('camps').select('*').eq('id', campId).single(),
    supabase.from('tracks').select('*').eq('camp_id', campId),
  ])

  if (!camp) return NextResponse.json({ error: 'Camp not found' }, { status: 404 })

  const { data: newCamp, error: campError } = await supabase
    .from('camps')
    .insert({
      name: camp.name,
      school_year,
      address: camp.address,
      registration_goal: camp.registration_goal,
    })
    .select()
    .single()

  if (campError || !newCamp) {
    return NextResponse.json({ error: campError?.message ?? 'Failed to create camp' }, { status: 500 })
  }

  if (tracks && tracks.length > 0) {
    await supabase.from('tracks').insert(
      tracks.map(({ name, description, price }) => ({
        camp_id: newCamp.id,
        name,
        description,
        price,
      }))
    )
  }

  return NextResponse.json({ id: newCamp.id })
}
