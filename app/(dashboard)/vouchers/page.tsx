import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { VouchersClient } from '@/components/vouchers/vouchers-client'
import { isCampScoped } from '@/lib/roles'
import type { VoucherType } from '@/lib/types'

export default async function VouchersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  const service = createServiceClient()

  let campId: string | null = null
  let registrantCount = 0

  if (isCampScoped(userRole)) {
    const { data: cu } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = cu?.camp_id ?? null
  } else {
    const { data: firstCamp } = await service.from('camps').select('id').limit(1).single()
    campId = firstCamp?.id ?? null
  }

  if (campId) {
    const { count } = await service
      .from('registrants')
      .select('*', { count: 'exact', head: true })
      .eq('camp_id', campId)
    registrantCount = count ?? 0
  }

  const { data: voucherTypes } = await service
    .from('voucher_types')
    .select('*')
    .eq('is_active', true)
    .order('created_at')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">שוברים</h1>
        <p className="mt-1 text-sm text-muted-foreground">הדפסת שוברים לחניכים ולצוות</p>
      </div>
      <VouchersClient
        voucherTypes={(voucherTypes as VoucherType[]) ?? []}
        registrantCount={registrantCount}
        campId={campId ?? ''}
        isAdmin={userRole === 'אדמין מערכת' || userRole === 'מנהל רשת'}
      />
    </div>
  )
}
