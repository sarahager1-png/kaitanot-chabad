import { createServiceClient } from '@/lib/supabase/server'
import { FileText } from 'lucide-react'
import { AgreementsLinks } from '@/components/admin/agreements-links'
import { SignedAgreementsList } from '@/components/agreements/signed-agreements-list'
import { RabbiSignatureUpload } from '@/components/admin/rabbi-signature-upload'

export default async function AgreementsPage() {
  const service = createServiceClient()
  const { data: signed } = await service
    .from('signed_agreements')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F0F0EC]">
          <FileText className="h-5 w-5 text-[#333654]" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#333654]">הסכמים</h1>
          <p className="text-sm text-[#9091A8]">שיתוף הסכמים והסכמים חתומים שהתקבלו</p>
        </div>
      </div>

      <AgreementsLinks />

      <RabbiSignatureUpload />

      <SignedAgreementsList agreements={signed ?? []} />
    </div>
  )
}
