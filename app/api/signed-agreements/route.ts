import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.agreement_type || !body.signature_data)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (!['camp-contract', 'direct-operation'].includes(body.agreement_type))
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  const service = createServiceClient()
  const { data, error } = await service
    .from('signed_agreements')
    .insert({
      agreement_type: body.agreement_type,
      city: body.city ?? null,
      emissary: body.emissary ?? null,
      camp_year: body.camp_year ?? null,
      sign_day: body.sign_day ?? null,
      sign_place: body.sign_place ?? null,
      signature_data: body.signature_data,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
