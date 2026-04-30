import { createServiceClient } from '@/lib/supabase/server'
import { RegisterForm } from './register-form'

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ camp?: string }> }) {
  const { camp: preselectedCampId } = await searchParams
  const supabase = createServiceClient()

  const { data: camps } = await supabase
    .from('camps')
    .select('id, name, school_year, address, camp_open_at, camp_close_at, registration_open_at, registration_close_at')
    .order('school_year', { ascending: false })

  const { data: tracks } = await supabase
    .from('tracks')
    .select('id, camp_id, name, description, price')
    .order('price')

  return (
    <RegisterForm
      camps={camps ?? []}
      allTracks={tracks ?? []}
      preselectedCampId={preselectedCampId}
    />
  )
}
