import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from '@/components/settings/settings-form'
import { Settings } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F3]">
          <Settings className="h-5 w-5 text-[#333654]" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">הגדרות חשבון</h1>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
      </div>

      <SettingsForm
        currentEmail={user.email ?? ''}
        currentName={profile?.full_name ?? ''}
        currentPhone={profile?.phone ?? ''}
        role={profile?.role ?? ''}
      />
    </div>
  )
}
