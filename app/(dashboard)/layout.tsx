export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { TopNav } from '@/components/layout/top-nav'
import { Toaster } from '@/components/ui/sonner'
import type { UserRole } from '@/lib/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let user = null
  let profile = null
  let alertCount = 0
  let campName: string | undefined

  try {
    const supabase = await createClient()

    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) redirect('/login')
    user = u

    const [{ data: p }, { count }] = await Promise.all([
      supabase.from('profiles').select('role, full_name').eq('id', u.id).single(),
      supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('is_read', false),
    ])

    profile = p
    alertCount = count ?? 0

    const userRole = (p?.role ?? 'שליח') as UserRole

    if (userRole === 'שליח') {
      const { data: campUser } = await supabase
        .from('camp_users')
        .select('camps(name)')
        .eq('user_id', u.id)
        .limit(1)
        .single()
      const campsRaw = campUser?.camps
      if (campsRaw && !Array.isArray(campsRaw)) {
        campName = (campsRaw as { name: string }).name
      } else if (Array.isArray(campsRaw) && campsRaw.length > 0) {
        campName = (campsRaw[0] as { name: string }).name
      }
    }
  } catch (e: unknown) {
    // If it's a redirect, rethrow it
    if (e && typeof e === 'object' && 'digest' in e) throw e
    // Otherwise redirect to login
    redirect('/login')
  }

  const userRole = (profile?.role ?? 'שליח') as UserRole

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#F5F5F3]" dir="rtl">
      <AppSidebar userRole={userRole} alertCount={alertCount} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <TopNav campName={campName} alertCount={alertCount} userName={profile?.full_name ?? undefined} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  )
}
