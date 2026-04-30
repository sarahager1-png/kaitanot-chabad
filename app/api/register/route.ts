import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rate-limit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 7 && digits.length <= 15
}

function sanitizeString(s: unknown, maxLen: number): string | null {
  if (!s || typeof s !== 'string') return null
  return s.trim().slice(0, maxLen) || null
}

export async function POST(req: Request) {
  // rate limiting: 5 הרשמות לשעה לכל IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`register:${ip}`, 5, 60 * 60 * 1000))
    return NextResponse.json({ error: 'יותר מדי בקשות, נסה שוב מאוחר יותר' }, { status: 429 })

  try {
    const body = await req.json()
    const {
      camp_id, track_id, birth_date, group_name,
      parent2_name, parent2_phone, primary_phone, email,
      gender, shirt_size, kippah_size, photo_consent,
      emergency_contact_name, emergency_contact_phone,
      is_healthy, health_issues, allergies, medications,
    } = body

    // שדות חובה
    const first_name = sanitizeString(body.first_name, 100)
    const last_name  = sanitizeString(body.last_name, 100)
    const parent1_name  = sanitizeString(body.parent1_name, 100)
    const parent1_phone = sanitizeString(body.parent1_phone, 20)
    const notes = sanitizeString(body.notes, 1000)

    if (!camp_id || !first_name || !last_name || !parent1_name || !parent1_phone)
      return NextResponse.json({ error: 'שדות חובה חסרים' }, { status: 400 })

    // ולידציית פורמטים
    if (email && !EMAIL_REGEX.test(email))
      return NextResponse.json({ error: 'כתובת מייל לא תקינה' }, { status: 400 })

    if (!validatePhone(parent1_phone))
      return NextResponse.json({ error: 'מספר טלפון לא תקין' }, { status: 400 })

    if (parent2_phone && !validatePhone(parent2_phone))
      return NextResponse.json({ error: 'מספר טלפון שני לא תקין' }, { status: 400 })

    const supabase = createServiceClient()

    // אימות שה-track_id שייך ל-camp_id שנבחר — מניעת רישום למסלול שלא שייך לקייטנה
    if (track_id) {
      const { data: track } = await supabase
        .from('tracks')
        .select('camp_id')
        .eq('id', track_id)
        .single()

      if (!track || track.camp_id !== camp_id)
        return NextResponse.json({ error: 'מסלול לא תקין עבור קייטנה זו' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('registrants')
      .insert({
        camp_id,
        track_id: track_id || null,
        first_name,
        last_name,
        birth_date: birth_date || null,
        group_name: sanitizeString(group_name, 50),
        parent1_name,
        parent1_phone,
        parent2_name: sanitizeString(parent2_name, 100),
        parent2_phone: sanitizeString(parent2_phone, 20),
        primary_phone: sanitizeString(primary_phone, 20) ?? parent1_phone,
        email: email?.trim().toLowerCase() || null,
        notes,
        gender: gender || null,
        shirt_size: shirt_size || null,
        kippah_size: kippah_size || null,
        photo_consent: photo_consent ?? false,
        emergency_contact_name: sanitizeString(emergency_contact_name, 100),
        emergency_contact_phone: sanitizeString(emergency_contact_phone, 20),
        is_healthy: is_healthy ?? true,
        health_issues: sanitizeString(health_issues, 500),
        allergies: sanitizeString(allergies, 500),
        medications: sanitizeString(medications, 500),
        payment_status: 'טרם שולם',
        amount_paid: 0,
        amount_due: 0,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ registrantId: data.id })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
