import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: tripId } = await params
  const supabase = await createClient()
  const service = createServiceClient()

  // Fetch trip details
  const { data: trip, error: tripErr } = await service
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single()

  if (tripErr || !trip) return NextResponse.json({ error: 'טיול לא נמצא' }, { status: 404 })

  // Fetch all registrants for this camp
  const { data: registrants, error: regErr } = await service
    .from('registrants')
    .select('id, first_name, last_name, parent1_name, parent1_phone, parent2_name, parent2_phone, primary_phone')
    .eq('camp_id', trip.camp_id)

  if (regErr) return NextResponse.json({ error: regErr.message }, { status: 500 })
  if (!registrants?.length) return NextResponse.json({ sent: 0, failed: 0, already_signed: 0 })

  // Upsert trip_approvals for all registrants
  const approvalRows = registrants.map(r => ({
    trip_id: tripId,
    registrant_id: r.id,
    camp_id: trip.camp_id,
  }))

  const { data: upserted, error: upsertErr } = await service
    .from('trip_approvals')
    .upsert(approvalRows, { onConflict: 'trip_id,registrant_id', ignoreDuplicates: false })
    .select()

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  // Fetch all approvals (including tokens)
  const { data: approvals } = await service
    .from('trip_approvals')
    .select('*')
    .eq('trip_id', tripId)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const waToken = process.env.WHATSAPP_TOKEN
  const waPhoneId = process.env.WHATSAPP_PHONE_ID

  let sent = 0, failed = 0, already_signed = 0

  for (const approval of approvals ?? []) {
    if (approval.signed) { already_signed++; continue }

    const reg = registrants.find(r => r.id === approval.registrant_id)
    if (!reg) continue

    const phone = (reg.primary_phone || reg.parent1_phone)?.replace(/\D/g, '')
    if (!phone) { failed++; continue }

    const childName = `${reg.first_name} ${reg.last_name}`
    const parentName = reg.parent1_name ?? 'הורה'
    const link = `${appUrl}/trip-approval/${approval.token}`
    const dateStr = trip.trip_date ? new Date(trip.trip_date).toLocaleDateString('he-IL') : ''
    const msgText = `שלום ${parentName},\nנא לאשר השתתפות ${childName} בטיול "${trip.title}"${dateStr ? ` בתאריך ${dateStr}` : ''}.\nלחתימה: ${link}`

    if (waToken && waPhoneId) {
      try {
        const waRes = await fetch(
          `https://graph.facebook.com/v19.0/${waPhoneId}/messages`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${waToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: phone.startsWith('972') ? phone : `972${phone.replace(/^0/, '')}`,
              type: 'text',
              text: { body: msgText },
            }),
          }
        )
        if (waRes.ok) sent++; else failed++
      } catch { failed++ }
    } else {
      // No WhatsApp credentials — log and count as sent for dev
      console.log('[WhatsApp mock]', msgText)
      sent++
    }
  }

  return NextResponse.json({ sent, failed, already_signed })
}
