import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TripsClient } from '@/components/trips/trips-client'
import { isCampScoped } from '@/lib/roles'

export default async function TripsPage() {
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

  const { data: camps } = campId
    ? await service.from('camps').select('id, name').eq('id', campId)
    : await service.from('camps').select('id, name')

  const activeCampId = campId ?? (camps ?? [])[0]?.id ?? ''

  const [{ data: trips }, { data: approvals }, { data: tripFiles }] = await Promise.all([
    activeCampId
      ? service.from('trips').select('*').eq('camp_id', activeCampId).order('trip_date')
      : Promise.resolve({ data: [] }),
    activeCampId
      ? service.from('trip_approvals').select('*').eq('camp_id', activeCampId)
      : Promise.resolve({ data: [] }),
    activeCampId
      ? service.from('trip_files').select('*').eq('camp_id', activeCampId).order('created_at')
      : Promise.resolve({ data: [] }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">טיולים ואישורים</h1>
        <p className="mt-1 text-sm text-muted-foreground">ניהול טיולים ואישורי הורים דיגיטליים</p>
      </div>
      <TripsClient
        initialTrips={trips ?? []}
        initialApprovals={approvals ?? []}
        initialTripFiles={tripFiles ?? []}
        campId={activeCampId}
        camps={camps ?? []}
        userRole={userRole}
      />
    </div>
  )
}
