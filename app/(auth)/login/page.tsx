import { LoginForm } from '@/components/auth/login-form'
import { createServiceClient } from '@/lib/supabase/server'

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ camp?: string }> }) {
  const { camp: campId } = await searchParams

  let campName: string | undefined
  if (campId) {
    const supabase = createServiceClient()
    const { data } = await supabase.from('camps').select('name').eq('id', campId).single()
    campName = data?.name ?? undefined
  }

  return <LoginForm campName={campName} />
}
