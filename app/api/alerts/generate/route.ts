import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

// Called after key actions (document update, expense added) to generate smart alerts
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { camp_id } = await request.json()
  if (!camp_id) return NextResponse.json({ error: 'Missing camp_id' }, { status: 400 })

  // אימות שהמשתמש רשאי לגשת לקייטנה זו
  try {
    await assertCampAccess(supabase, user.id, camp_id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  const alerts: { camp_id: string; alert_type: string; severity: string; title: string; body: string }[] = []

  // 1. מסמכים חסרים
  const { data: docs } = await service
    .from('documents')
    .select('label, is_completed')
    .eq('camp_id', camp_id)

  const missing = (docs ?? []).filter(d => !d.is_completed)
  if (missing.length > 0) {
    alerts.push({
      camp_id,
      alert_type: 'missing_documents',
      severity: missing.length > 2 ? 'error' : 'warning',
      title: `חסרים ${missing.length} מסמכים`,
      body: missing.map(d => d.label).join(', '),
    })
  }

  // 2. חריגות תקציב
  const [{ data: budgets }, { data: expenses }] = await Promise.all([
    service.from('budgets').select('*').eq('camp_id', camp_id),
    service.from('expense_entries').select('category, amount').eq('camp_id', camp_id),
  ])

  const actualByCategory: Record<string, number> = {}
  ;(expenses ?? []).forEach(e => {
    actualByCategory[e.category] = (actualByCategory[e.category] ?? 0) + Number(e.amount)
  })

  ;(budgets ?? []).forEach(b => {
    const actual = actualByCategory[b.category] ?? 0
    const threshold = b.planned_amount * (b.alert_threshold ?? 0.9)
    if (actual >= threshold && b.planned_amount > 0) {
      const pct = Math.round((actual / b.planned_amount) * 100)
      alerts.push({
        camp_id,
        alert_type: 'budget_overrun',
        severity: actual >= b.planned_amount ? 'error' : 'warning',
        title: `חריגה תקציבית — ${b.category}`,
        body: `${pct}% מהתקציב נוצל (₪${actual.toLocaleString()} מתוך ₪${b.planned_amount.toLocaleString()})`,
      })
    }
  })

  // 3. ילדים עם הערות בריאות — ספירה בלבד, ללא שמות (PII)
  const { data: registrants } = await service
    .from('registrants')
    .select('is_healthy, health_issues, allergies, medications')
    .eq('camp_id', camp_id)

  const flaggedCount = (registrants ?? []).filter(r =>
    r.is_healthy === false || r.allergies?.trim() || r.medications?.trim() || r.health_issues?.trim()
  ).length

  if (flaggedCount > 0) {
    alerts.push({
      camp_id,
      alert_type: 'health_flags',
      severity: 'warning',
      title: `${flaggedCount} ילדים עם הערות בריאות`,
      body: 'עיין ברשימת הנרשמים לפרטים',
    })
  }

  if (alerts.length === 0) return NextResponse.json({ generated: 0 })

  // מחיקת התראות ישנות לא-נקראות מאותם סוגים — מניעת כפולות
  await service
    .from('alerts')
    .delete()
    .eq('camp_id', camp_id)
    .eq('is_read', false)
    .in('alert_type', ['missing_documents', 'budget_overrun', 'health_flags'])

  const { data: inserted } = await service.from('alerts').insert(alerts).select()
  return NextResponse.json({ generated: inserted?.length ?? 0 })
}
