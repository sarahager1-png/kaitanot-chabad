import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

// טוקן חייב להיות UUID v4 — מונע enumeration על מזהים חלשים
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // אימות פורמט טוקן
  if (!UUID_REGEX.test(token))
    return NextResponse.json({ error: 'קישור לא תקין' }, { status: 404 })

  // rate limiting: 10 בקשות לדקה לכל IP
  const ip = getClientIp(req)
  if (!rateLimit(`trip-approval-get:${ip}`, 10, 60_000))
    return NextResponse.json({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' }, { status: 429 })

  const service = createServiceClient()

  const { data: approval, error } = await service
    .from('trip_approvals')
    .select('*, trips(*), registrants(first_name, last_name, parent1_name)')
    .eq('token', token)
    .single()

  if (error || !approval) return NextResponse.json({ error: 'קישור לא תקין' }, { status: 404 })
  return NextResponse.json(approval)
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  // אימות פורמט טוקן
  if (!UUID_REGEX.test(token))
    return NextResponse.json({ error: 'קישור לא תקין' }, { status: 404 })

  // rate limiting: 5 שליחות לדקה לכל IP
  const ip = getClientIp(req)
  if (!rateLimit(`trip-approval-post:${ip}`, 5, 60_000))
    return NextResponse.json({ error: 'יותר מדי בקשות, נסה שוב בעוד דקה' }, { status: 429 })

  const service = createServiceClient()
  const { signer_name, signature_data } = await req.json()

  const { data: approval, error: fetchErr } = await service
    .from('trip_approvals')
    .select('id, signed')
    .eq('token', token)
    .single()

  if (fetchErr || !approval) return NextResponse.json({ error: 'קישור לא תקין' }, { status: 404 })
  if (approval.signed) return NextResponse.json({ already_signed: true })

  const { error } = await service
    .from('trip_approvals')
    .update({
      signed: true,
      signed_at: new Date().toISOString(),
      signer_name: signer_name || null,
      signature_data: signature_data || null,
    })
    .eq('id', approval.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
