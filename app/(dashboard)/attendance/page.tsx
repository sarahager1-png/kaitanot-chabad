import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AttendanceClient } from '@/components/attendance/attendance-client'
import { isCampScoped } from '@/lib/roles'

export default async function AttendancePage() {
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
  }

  const [{ data: registrants }, { data: camps }] = await Promise.all([
    campId
      ? service.from('registrants').select('id, first_name, last_name, group_name').eq('camp_id', campId).eq('is_waiting', false).order('group_name').order('first_name')
      : service.from('registrants').select('id, first_name, last_name, group_name').eq('is_waiting', false).order('group_name').order('first_name'),
    campId
      ? service.from('camps').select('id, name').eq('id', campId)
      : service.from('camps').select('id, name'),
  ])

  const activeCampId = campId ?? (camps ?? [])[0]?.id ?? ''

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">נוכחות יומית</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(registrants ?? []).length} ילדים פעילים
        </p>
      </div>
      <AttendanceClient
        registrants={registrants ?? []}
        campId={activeCampId}
      />
    </div>
  )
}
