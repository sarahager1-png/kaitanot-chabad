import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SimulationsClient } from '@/components/simulations/simulations-client'
import { isCampScoped } from '@/lib/roles'

export default async function SimulationsPage() {
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

  const [{ data: budgets }, { data: camp }, { count: registrantCount }] = await Promise.all([
    service.from('budgets').select('*').eq('camp_id', campId),
    service.from('camps').select('registration_goal').eq('id', campId).single(),
    service.from('registrants').select('*', { count: 'exact', head: true }).eq('camp_id', campId).eq('is_waiting', false),
  ])

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#333654]">סימולציית תקציב</h1>
        <p className="text-sm text-[#9091A8] mt-1">הגדר הוצאות קבועות ומשתנות וחשב את המחיר לילד</p>
      </div>
      <SimulationsClient
        budgets={budgets ?? []}
        campId={campId}
        registrationGoal={camp?.registration_goal ?? 0}
        registrantCount={registrantCount ?? 0}
      />
    </div>
  )
}
