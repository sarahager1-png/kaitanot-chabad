import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HelpContent } from '@/components/help/help-content'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name').eq('id', user.id).single()
  const role = profile?.role ?? 'שליח'

  return <HelpContent role={role} userName={profile?.full_name ?? ''} />
}
