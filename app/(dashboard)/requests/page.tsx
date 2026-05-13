import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RequestsClient } from '@/components/requests/requests-client'
import { isCampScoped } from '@/lib/roles'

export default async function RequestsPage() {
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

  if (!campId) return <div className="py-20 text-center text-sm text-[#9091A8]">אין קייטנה משויכת</div>

  const { data: requests } = await service.from('payment_requests').select('*').eq('camp_id', campId).order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-2xl font-black text-[#333654]">בקשות תשלום</h1>
      <RequestsClient requests={requests ?? []} campId={campId} />
    </div>
  )
}
