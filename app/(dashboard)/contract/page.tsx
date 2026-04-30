import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DirectorContractClient } from '@/components/contract/director-contract-client'

export default async function ContractPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">חוזה מנהלת קייטנה</h1>
        <p className="mt-1 text-sm text-muted-foreground">מלאי את הפרטים — החוזה מתעדכן בזמן אמת ומוכן להדפסה</p>
      </div>
      <DirectorContractClient />
    </div>
  )
}
