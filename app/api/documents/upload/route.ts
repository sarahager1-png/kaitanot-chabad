import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { assertCampAccess } from '@/lib/server-utils'

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])
const ALLOWED_EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'png', 'docx'])
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const docId = formData.get('docId') as string
  const campId = formData.get('campId') as string

  if (!file || !docId || !campId)
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  // אימות UUID — מניעת path traversal
  if (!UUID_REGEX.test(docId) || !UUID_REGEX.test(campId))
    return NextResponse.json({ error: 'מזהה לא תקין' }, { status: 400 })

  // בדיקת גודל קובץ
  if (file.size > MAX_FILE_SIZE)
    return NextResponse.json({ error: 'קובץ גדול מדי — מקסימום 10MB' }, { status: 400 })

  // בדיקת MIME type (כפי שהדפדפן מדווח)
  if (!ALLOWED_MIME_TYPES.has(file.type))
    return NextResponse.json({ error: 'סוג קובץ לא מותר — PDF, JPG, PNG, DOCX בלבד' }, { status: 400 })

  // בדיקת סיומת עצמאית מה-MIME
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(ext))
    return NextResponse.json({ error: 'סיומת קובץ לא מותרת' }, { status: 400 })

  // אימות שהמשתמש שייך לקייטנה
  try {
    await assertCampAccess(supabase, user.id, campId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = createServiceClient()

  // אימות שה-docId שייך לאותה קייטנה — מונע העלאה לטבלת מסמכים של קייטנה אחרת
  const { data: doc } = await service
    .from('documents')
    .select('id, camp_id')
    .eq('id', docId)
    .eq('camp_id', campId)
    .single()

  if (!doc) return NextResponse.json({ error: 'מסמך לא נמצא' }, { status: 404 })

  const path = `${campId}/${docId}.${ext}`
  const bytes = await file.arrayBuffer()

  // ניסיון העלאה — אם הקובץ קיים, מעדכנים
  const { error: uploadError } = await service.storage
    .from('camp-documents')
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError?.message?.includes('already exists')) {
    const { error: updateStorageError } = await service.storage
      .from('camp-documents')
      .update(path, bytes, { contentType: file.type })
    if (updateStorageError)
      return NextResponse.json({ error: updateStorageError.message }, { status: 500 })
  } else if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  // שמירת ה-path (לא URL ציבורי — הבקט פרטי)
  const { error: updateError } = await service
    .from('documents')
    .update({ file_url: path, is_completed: true })
    .eq('id', docId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // יצירת URL חתום ל-7 ימים לצפייה מיידית
  const { data: signed } = await service.storage
    .from('camp-documents')
    .createSignedUrl(path, 60 * 60 * 24 * 7)

  return NextResponse.json({ url: signed?.signedUrl ?? path })
}
