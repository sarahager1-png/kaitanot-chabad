import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UsersTable } from '@/components/admin/users-table'
import { SetupChecklist } from '@/components/admin/setup-checklist'
import { NetworkSettingsForm } from '@/components/admin/network-settings-form'
import { Shield } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'אדמין מערכת' && profile?.role !== 'מנהל רשת') redirect('/dashboard')

  const service = createServiceClient()
  const [{ data: profiles }, { data: camps }] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, role, phone, camp_users(camp_id, camps(id, name))')
      .order('full_name'),
    service
      .from('camps')
      .select('id, name, school_year, cardcom_terminal')
      .order('name'),
  ])

  const campsArr = camps ?? []
  const profilesArr = profiles ?? []

  const hasCardcom = campsArr.some(c => c.cardcom_terminal)
  const hasCampManager = profilesArr.some(p => p.role === 'מנהל קייטנה')
  const hasShliach = profilesArr.some(p => p.role === 'שליח')
  const firstCampId = campsArr[0]?.id ?? null

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEF0EC]">
          <Shield className="h-5 w-5 text-[#333654]" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">ניהול מערכת</h1>
          <p className="text-sm text-slate-500">{profilesArr.length} משתמשים רשומים</p>
        </div>
      </div>

      <SetupChecklist
        campsCount={campsArr.length}
        hasCardcom={hasCardcom}
        hasCampManager={hasCampManager}
        hasShliach={hasShliach}
        firstCampId={firstCampId}
      />

      <NetworkSettingsForm />

      <UsersTable
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        profiles={profilesArr as any}
        camps={campsArr}
      />
    </div>
  )
}
