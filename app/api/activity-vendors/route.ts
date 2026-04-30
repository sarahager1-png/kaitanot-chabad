import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest) {
  const service = createServiceClient()

  const { data: vendors, error } = await service
    .from('activity_vendors')
    .select('*')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Compute avg stars per vendor from vendor_reviews
  const { data: reviews } = await service
    .from('vendor_reviews')
    .select('vendor_id, stars')

  const statsMap = new Map<string, { sum: number; count: number }>()
  for (const r of reviews ?? []) {
    const s = statsMap.get(r.vendor_id) ?? { sum: 0, count: 0 }
    s.sum += r.stars; s.count++
    statsMap.set(r.vendor_id, s)
  }

  const enriched = (vendors ?? []).map(v => {
    const s = statsMap.get(v.id)
    return { ...v, avg_stars: s ? Math.round((s.sum / s.count) * 10) / 10 : null, review_count: s?.count ?? 0 }
  })

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['מנהל רשת', 'אדמין מערכת'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'אין הרשאה' }, { status: 403 })
  }

  const body = await req.json()
  const { name, activity, phone, website, notes } = body
  if (!name || !activity) return NextResponse.json({ error: 'name and activity required' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('activity_vendors')
    .insert({ name, activity, phone: phone || null, website: website || null, notes: notes || null, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
