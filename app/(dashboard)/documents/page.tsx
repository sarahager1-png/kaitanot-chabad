import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DocumentsClient } from '@/components/documents/documents-client'
import type { Document } from '@/lib/types'
import { DOCUMENT_TEMPLATES } from '@/lib/constants'
import { isCampScoped } from '@/lib/roles'

export default async function DocumentsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  const service = createServiceClient()

  let campId: string | null = null
  if (isCampScoped(userRole)) {
    const { data: cu } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = cu?.camp_id ?? null
  } else {
    const { data: firstCamp } = await service.from('camps').select('id').limit(1).single()
    campId = firstCamp?.id ?? null
  }

  if (!campId) {
    return <div className="py-16 text-center text-muted-foreground"><p>אין קייטנה משויכת</p></div>
  }

  let { data: documents } = await service
    .from('documents')
    .select('*')
    .eq('camp_id', campId)

  if (!documents || documents.length === 0) {
    const templates = DOCUMENT_TEMPLATES.map((t) => ({
      camp_id: campId!,
      doc_type: t.type,
      label: t.label,
      file_url: null,
      is_completed: false,
      due_date: null,
    }))
    const { data: inserted } = await service.from('documents').insert(templates).select()
    documents = inserted ?? []
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">מסמכים ורישוי</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(documents ?? []).filter((d) => d.is_completed).length} / {(documents ?? []).length} הושלמו
        </p>
      </div>
      <DocumentsClient documents={documents as Document[]} campId={campId} />
    </div>
  )
}
