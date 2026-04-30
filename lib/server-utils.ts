import type { SupabaseClient } from '@supabase/supabase-js'

export async function assertCampAccess(supabase: SupabaseClient, userId: string, campId: string) {
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single()
  if (profile?.role === 'מנהל רשת' || profile?.role === 'אדמין מערכת') return
  const { data } = await supabase.from('camp_users').select('camp_id').eq('user_id', userId).eq('camp_id', campId).single()
  if (!data) throw new Error('Forbidden')
}
