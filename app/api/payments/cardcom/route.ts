import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

// POST /api/payments/cardcom — יוצר קישור תשלום עבור רשום
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { registrant_id, amount } = await request.json()
  if (!registrant_id || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  if (typeof amount !== 'number' || amount <= 0)
    return NextResponse.json({ error: 'סכום לא תקין' }, { status: 400 })

  const service = createServiceClient()

  const { data: registrant } = await service
    .from('registrants')
    .select('id, camp_id, first_name, last_name, email, parent1_phone')
    .eq('id', registrant_id)
    .single()

  if (!registrant) return NextResponse.json({ error: 'רשום לא נמצא' }, { status: 404 })

  // אימות שהמשתמש רשאי לגשת לקייטנה של הרשום — מניעת IDOR
  try {
    await assertCampAccess(supabase, user.id, registrant.camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // קבלת פרטי סליקה: קייטנה → fallback לרשת
  const { data: camp } = await service
    .from('camps')
    .select('cardcom_terminal, cardcom_api_name, cardcom_api_password')
    .eq('id', registrant.camp_id)
    .single()

  let terminal = camp?.cardcom_terminal
  let apiName  = camp?.cardcom_api_name
  let apiPass  = camp?.cardcom_api_password

  if (!terminal || !apiName || !apiPass) {
    const { data: netSettings } = await service
      .from('network_settings')
      .select('key, value')
      .in('key', ['cardcom_terminal', 'cardcom_api_name', 'cardcom_api_password'])
    const ns: Record<string, string> = {}
    ;(netSettings ?? []).forEach(r => { ns[r.key] = r.value })
    terminal = terminal || ns['cardcom_terminal'] || process.env.CARDCOM_TERMINAL
    apiName  = apiName  || ns['cardcom_api_name']  || process.env.CARDCOM_API_NAME
    apiPass  = apiPass  || ns['cardcom_api_password'] || process.env.CARDCOM_API_PASSWORD
  }

  if (!terminal || !apiName || !apiPass)
    return NextResponse.json({
      error: 'Cardcom לא מוגדר — הגדר פרטי סליקה בניהול מערכת'
    }, { status: 503 })

  // יצירת רשומת עסקה ב-DB
  const { data: tx, error: txErr } = await service
    .from('payment_transactions')
    .insert({
      registrant_id,
      camp_id: registrant.camp_id,
      amount,
      status: 'pending',
      provider: 'cardcom',
    })
    .select()
    .single()

  if (txErr) return NextResponse.json({ error: txErr.message }, { status: 500 })

  const webhookSecret = process.env.CARDCOM_WEBHOOK_SECRET

  // שליחת בקשה ל-Cardcom
  const cardcomParams = new URLSearchParams({
    TerminalNumber: terminal,
    UserName: apiName,
    APILevel: '10',
    codepage: '65001',
    Operation: '2',
    Amount: String(amount),
    CoinID: '1',
    MaxPayments: '12',
    ReturnValue: tx.id,
    SuccessRedirectUrl: `${APP_URL}/payment/success?tx=${tx.id}`,
    ErrorRedirectUrl: `${APP_URL}/payment/error?tx=${tx.id}`,
    indicatorUrl: `${APP_URL}/api/payments/webhook`,
    InvoiceHead_CustName: `${registrant.first_name} ${registrant.last_name}`,
    InvoiceHead_SendByEmail: registrant.email ? 'true' : 'false',
    ...(registrant.email ? { InvoiceHead_Email: registrant.email } : {}),
    InvoiceLines1_Description: 'דמי קייטנה',
    InvoiceLines1_Quantity: '1',
    InvoiceLines1_Price: String(amount),
    InvoiceLines1_ProductID: '1',
    // IndicatorSecret — Cardcom ישלח אותו חזרה ב-webhook לאימות
    ...(webhookSecret ? { IndicatorSecret: webhookSecret } : {}),
  })

  const cardcomRes = await fetch(
    `https://secure.cardcom.solutions/Interface/LowProfile.aspx?${cardcomParams.toString()}`
  )
  const text = await cardcomRes.text()

  const params = new URLSearchParams(text)
  const code = params.get('ResponseCode')
  const paymentUrl = params.get('url')

  if (code !== '0' || !paymentUrl)
    return NextResponse.json({
      error: `Cardcom שגיאה: ${params.get('Description') ?? text}`
    }, { status: 502 })

  await service
    .from('payment_transactions')
    .update({ payment_url: paymentUrl })
    .eq('id', tx.id)

  return NextResponse.json({ payment_url: paymentUrl, transaction_id: tx.id })
}
