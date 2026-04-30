import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const campId = req.nextUrl.searchParams.get('camp_id')
  if (!campId) return NextResponse.json({ error: 'camp_id required' }, { status: 400 })

  try {
    await assertCampAccess(supabase, user.id, campId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('trip_approvals')
    .select('*')
    .eq('camp_id', campId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
