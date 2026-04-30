import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const WA_TOKEN = process.env.WHATSAPP_TOKEN
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!WA_TOKEN || !WA_PHONE_ID)
    return NextResponse.json({ error: 'WhatsApp לא מוגדר — הוסף WHATSAPP_TOKEN ו-WHATSAPP_PHONE_ID ל-.env.local' }, { status: 503 })

  const { phone, message } = await request.json()
  if (!phone || !message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // Normalize Israeli phone: 05X → 9725X
  const normalized = phone.replace(/\D/g, '').replace(/^0/, '972')

  const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: normalized,
      type: 'text',
      text: { body: message },
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.error?.message ?? 'שגיאה בשליחה' }, { status: 500 })
  return NextResponse.json({ success: true, message_id: data.messages?.[0]?.id })
}

// Bulk send to all registrants of a camp
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!WA_TOKEN || !WA_PHONE_ID)
    return NextResponse.json({ error: 'WhatsApp לא מוגדר' }, { status: 503 })

  const { camp_id, message, filter } = await request.json()
  const service = createServiceClient()
  let query = service
    .from('registrants')
    .select('first_name, last_name, parent1_phone, parent1_name, primary_phone')
    .eq('camp_id', camp_id)
  if (filter === 'unpaid') query = query.neq('payment_status', 'שולם מלא') as typeof query
  const { data: registrants } = await query

  const results = { sent: 0, failed: 0 }
  for (const r of registrants ?? []) {
    const phone = (r.primary_phone || r.parent1_phone || '').replace(/\D/g, '').replace(/^0/, '972')
    if (!phone) { results.failed++; continue }
    const personalMsg = message
      .replace('{שם הילד}', `${r.first_name} ${r.last_name}`)
      .replace('{שם הורה}', r.parent1_name ?? '')
    const res = await fetch(`https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: phone, type: 'text', text: { body: personalMsg },
      }),
    })
    if (res.ok) results.sent++; else results.failed++
    await new Promise(r => setTimeout(r, 200)) // rate limit
  }
  return NextResponse.json(results)
}
