import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const campId = req.nextUrl.searchParams.get('camp_id')
  if (!campId) return NextResponse.json({ error: 'camp_id required' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('trip_files')
    .select('*')
    .eq('camp_id', campId)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
