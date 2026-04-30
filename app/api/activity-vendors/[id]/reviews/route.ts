import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('vendor_reviews')
    .select('*, profiles(full_name)')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: vendorId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { stars, comment, camp_id } = await req.json()
  if (!stars || stars < 1 || stars > 5) return NextResponse.json({ error: 'stars 1-5 required' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('vendor_reviews')
    .upsert({
      vendor_id: vendorId,
      reviewer_id: user.id,
      camp_id: camp_id || null,
      stars,
      comment: comment || null,
    }, { onConflict: 'vendor_id,reviewer_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
