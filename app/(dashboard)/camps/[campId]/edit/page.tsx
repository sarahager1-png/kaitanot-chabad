import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { CampForm } from '@/components/camps/camp-form'
import { isManager } from '@/lib/roles'

export default async function EditCampPage({ params }: { params: Promise<{ campId: string }> }) {
  const { campId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!isManager(profile?.role ?? '')) redirect('/dashboard')

  const { data: camp } = await supabase.from('camps').select('*').eq('id', campId).single()
  if (!camp) notFound()

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black">עריכת קייטנה</h1>
        <p className="mt-1 text-sm text-muted-foreground">{camp.name}</p>
      </div>
      <CampForm initialData={camp} campId={campId} />
    </div>
  )
}
