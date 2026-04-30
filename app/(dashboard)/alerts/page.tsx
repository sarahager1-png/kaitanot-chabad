import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertsClient } from '@/components/alerts/alerts-client'
import type { Alert } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'

export default async function AlertsPage() {
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

  const { data: alerts } = await (campId
    ? service.from('alerts').select('*').eq('camp_id', campId).order('created_at', { ascending: false })
    : service.from('alerts').select('*').order('created_at', { ascending: false }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">התראות</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(alerts ?? []).filter((a) => !a.is_read).length} לא נקראו
        </p>
      </div>
      <AlertsClient alerts={alerts as Alert[] ?? []} />
    </div>
  )
}
