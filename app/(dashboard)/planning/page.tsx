import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanningClient } from '@/components/planning/planning-client'
import { BudgetSimulator } from '@/components/planning/budget-simulator'
import { PlanningTabs } from '@/components/planning/planning-tabs'
import type { DailyPlan } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'
import { differenceInDays, parseISO } from 'date-fns'

export default async function PlanningPage() {
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

  let plans: DailyPlan[] = []
  let campDays = 10

  if (campId) {
    const { data: camp } = await service.from('camps').select('camp_open_at, camp_close_at').eq('id', campId).single()
    const { data: planData } = await service
      .from('daily_plans')
      .select('*, activities(*)')
      .eq('camp_id', campId)
      .order('plan_date')
    plans = planData as DailyPlan[] ?? []
    if (camp?.camp_open_at && camp?.camp_close_at) {
      const diff = differenceInDays(parseISO(camp.camp_close_at), parseISO(camp.camp_open_at))
      if (diff > 0) campDays = diff
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">תכנון קייטנה</h1>
        <p className="mt-1 text-sm text-muted-foreground">לוז יומי, פעילויות והדמיית תקציב</p>
      </div>
      <PlanningTabs
        planningContent={
          campId
            ? <PlanningClient plans={plans} duties={[]} campId={campId} campOpenAt={null} campCloseAt={null} />
            : <div className="py-16 text-center text-muted-foreground"><p>צרי קייטנה ראשונה כדי לתכנן לוז יומי</p></div>
        }
        budgetContent={<BudgetSimulator campDays={campDays} />}
      />
    </div>
  )
}
