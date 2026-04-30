import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

// Cardcom קורא ל-webhook הזה אחרי כל תשלום
// https://kb.cardcom.solutions/article/AA-00214
export async function POST(request: Request) {
  const service = createServiceClient()

  let body: Record<string, string>
  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    body = await request.json()
  } else {
    const text = await request.text()
    body = Object.fromEntries(new URLSearchParams(text))
  }

  // אימות סוד webhook — Cardcom שולח את ה-IndicatorSecret שהגדרנו בעת יצירת העסקה
  const webhookSecret = process.env.CARDCOM_WEBHOOK_SECRET
  if (webhookSecret) {
    const received = body['IndicatorSecret'] ?? body['indicatorsecret'] ?? body['indicatorSecret']
    if (received !== webhookSecret) {
      console.error('[Webhook] Invalid IndicatorSecret')
      return NextResponse.json({ ok: false, error: 'Invalid secret' }, { status: 403 })
    }
  } else {
    // אזהרה אם הסוד לא מוגדר — לא בלוק (לא לשבור קיים) אבל רושם שגיאה
    console.warn('[Webhook] CARDCOM_WEBHOOK_SECRET not set — webhook unauthenticated!')
  }

  const txId = body['ReturnValue'] ?? body['InternalDealNumber']
  const responseCode = body['ResponseCode']
  const dealRef = body['InternalDealNumber'] ?? body['DealNumber']

  if (!txId) return NextResponse.json({ ok: false, error: 'No transaction ID' }, { status: 400 })

  const { data: tx } = await service
    .from('payment_transactions')
    .select('id, registrant_id, amount')
    .eq('id', txId)
    .single()

  if (!tx) return NextResponse.json({ ok: false, error: 'Transaction not found' }, { status: 404 })

  const isPaid = responseCode === '0'

  await service
    .from('payment_transactions')
    .update({
      status: isPaid ? 'paid' : 'failed',
      provider_ref: dealRef ?? null,
      ...(isPaid ? { paid_at: new Date().toISOString() } : {}),
    })
    .eq('id', txId)

  if (isPaid) {
    // עדכון סטטוס תשלום של הרשום
    const { data: registrant } = await service
      .from('registrants')
      .select('amount_paid, amount_due')
      .eq('id', tx.registrant_id)
      .single()

    if (registrant) {
      // חישוב כספי בסנטים — מניעת שגיאות floating point
      const paidCents = Math.round(Number(registrant.amount_paid) * 100) + Math.round(Number(tx.amount) * 100)
      const dueCents  = Math.max(0, Math.round(Number(registrant.amount_due) * 100) - Math.round(Number(tx.amount) * 100))
      const newPaid = paidCents / 100
      const newDue  = dueCents  / 100
      const newStatus = newDue === 0 ? 'שולם מלא' : newPaid > 0 ? 'שולם חלקי' : 'טרם שולם'

      await service
        .from('registrants')
        .update({ amount_paid: newPaid, amount_due: newDue, payment_status: newStatus })
        .eq('id', tx.registrant_id)

      // הוספת הכנסה אוטומטית — idempotency: בדיקה שלא קיימת כבר עסקה זהה
      const { data: reg2 } = await service
        .from('registrants')
        .select('camp_id, first_name, last_name')
        .eq('id', tx.registrant_id)
        .single()

      if (reg2) {
        // בדיקת idempotency — webhook עשוי להגיע פעמיים
        const { data: existingIncome } = await service
          .from('income_entries')
          .select('id')
          .eq('camp_id', reg2.camp_id)
          .eq('provider_ref', txId)
          .maybeSingle()

        if (!existingIncome) {
          await service.from('income_entries').insert({
            camp_id: reg2.camp_id,
            category: 'דמי קייטנה',
            description: `תשלום מקוון — ${reg2.first_name} ${reg2.last_name}`,
            amount: tx.amount,
            entry_date: new Date().toISOString().split('T')[0],
            provider_ref: txId,
          })
        }
      }
    }
  }

  // Cardcom מצפה ל-"low_profile_code=OK" בתשובה
  return new Response('low_profile_code=OK', {
    headers: { 'Content-Type': 'text/plain' },
  })
}

// Cardcom יכול גם לשלוח GET
export async function GET(request: Request) {
  return POST(request)
}
