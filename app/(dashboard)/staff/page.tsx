import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StaffClient } from '@/components/staff/staff-client'
import type { StaffMember } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'

export default async function StaffPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  let campId: string | null = null
  if (isCampScoped(userRole)) {
    const { data: cu } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = cu?.camp_id ?? null
  } else {
    const { data: firstCamp } = await supabase.from('camps').select('id').limit(1).single()
    campId = firstCamp?.id ?? null
  }

  if (!campId) {
    return <div className="py-16 text-center text-muted-foreground"><p>אין קייטנה משויכת</p></div>
  }

  const service = createServiceClient()
  const { data: staffList } = await service
    .from('staff')
    .select('*')
    .eq('camp_id', campId)
    .order('full_name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">ניהול צוות</h1>
        <p className="mt-1 text-sm text-muted-foreground">{(staffList ?? []).length} חברי צוות</p>
      </div>
      <StaffClient staffList={staffList as StaffMember[] ?? []} campId={campId} />
    </div>
  )
}
