import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SalariesClient } from '@/components/salaries/salaries-client'
import { isCampScoped } from '@/lib/roles'
import { Users } from 'lucide-react'

export default async function SalariesPage() {
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

  if (!campId) return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <Users className="h-10 w-10 text-[#9091A8]" />
      <p className="text-sm text-[#6B6D8A]">אין קייטנה משויכת</p>
    </div>
  )

  const [{ data: employees }, { data: payments }] = await Promise.all([
    service.from('employees').select('*').eq('camp_id', campId).eq('is_active', true).order('name'),
    service.from('salary_payments').select('*').eq('camp_id', campId),
  ])

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <h1 className="text-2xl font-black text-[#333654]">ניהול משכורות</h1>
      <SalariesClient
        employees={employees ?? []}
        payments={payments ?? []}
        campId={campId}
      />
    </div>
  )
}
