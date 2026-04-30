import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SharedClient } from '@/components/shared/shared-client'
import { isCampScoped } from '@/lib/roles'

export default async function SharedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  let campId: string | null = null
  if (isCampScoped(userRole)) {
    const { data: cu } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = cu?.camp_id ?? null
  }

  const service = createServiceClient()

  const [{ data: content }, { data: vendors }, { data: reviews }] = await Promise.all([
    service.from('shared_content').select('*').order('created_at', { ascending: false }),
    service.from('activity_vendors').select('*').order('name'),
    service.from('vendor_reviews').select('*, profiles(full_name)').order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">ספרייה משותפת</h1>
        <p className="mt-1 text-sm text-muted-foreground">תכנים ופעילויות משותפים לכל הקייטנות</p>
      </div>
      <SharedClient
        initialContent={content ?? []}
        initialVendors={vendors ?? []}
        initialReviews={reviews ?? []}
        campId={campId ?? ''}
        userId={user.id}
        userRole={userRole}
      />
    </div>
  )
}
