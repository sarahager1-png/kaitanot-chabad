import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ServicesClient } from '@/components/services/services-client'
import type { Order, NetworkService } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'

export default async function ServicesPage() {
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

  const [{ data: services }, { data: orders }] = await Promise.all([
    service.from('network_services').select('*').eq('is_active', true).order('category'),
    campId
      ? service.from('orders').select('*, network_services(*)').eq('camp_id', campId).order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">שירותים ואספקה</h1>
        <p className="mt-1 text-sm text-muted-foreground">הזמן ציוד ושירותים</p>
      </div>

      <ServicesClient
        services={services as NetworkService[] ?? []}
        orders={orders as (Order & { network_services: NetworkService })[] ?? []}
        campId={campId ?? ''}
        isAdmin={userRole === 'אדמין מערכת' || userRole === 'מנהל רשת'}
      />
    </div>
  )
}
