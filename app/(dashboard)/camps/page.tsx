import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CampCard } from '@/components/camps/camp-card'
import { Plus, Tent } from 'lucide-react'
import type { Camp } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'

export default async function CampsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  let camps: Camp[] | null = null

  if (isCampScoped(userRole)) {
    const { data: campUsers } = await supabase
      .from('camp_users')
      .select('camp_id')
      .eq('user_id', user.id)
    const campIds = campUsers?.map((cu) => cu.camp_id) ?? []
    if (campIds.length > 0) {
      const res = await supabase
        .from('camps')
        .select('*')
        .in('id', campIds)
        .order('created_at', { ascending: false })
      camps = res.data
    }
  } else {
    const res = await supabase
      .from('camps')
      .select('*')
      .order('created_at', { ascending: false })
    camps = res.data
  }

  const campsWithCount = await Promise.all(
    (camps ?? []).map(async (camp) => {
      const { count } = await supabase
        .from('registrants')
        .select('*', { count: 'exact', head: true })
        .eq('camp_id', camp.id)
      return { ...camp, registrantCount: count ?? 0 }
    })
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">קייטנות</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCampScoped(userRole) ? `${campsWithCount.length} קייטנות שלך` : `${campsWithCount.length} קייטנות`}
          </p>
        </div>
        {(userRole === 'אדמין מערכת' || userRole === 'מנהל רשת') && (
          <Link href="/camps/new">
            <Button><Plus className="h-4 w-4" />קייטנה חדשה</Button>
          </Link>
        )}
      </div>

      {campsWithCount.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Tent className="h-12 w-12 text-muted-foreground/40" />
          <div>
            <p className="font-medium">אין קייטנות עדיין</p>
            <p className="text-sm text-muted-foreground">צור קייטנה ראשונה</p>
          </div>
          {(userRole === 'אדמין מערכת' || userRole === 'מנהל רשת') && (
            <Link href="/camps/new">
              <Button><Plus className="h-4 w-4" />צור קייטנה</Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campsWithCount.map((camp) => (
            <CampCard key={camp.id} camp={camp} />
          ))}
        </div>
      )}
    </div>
  )
}
