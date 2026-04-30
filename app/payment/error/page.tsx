import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFF1F2] p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-8 text-center flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#FEE2E2]">
          <XCircle className="h-10 w-10 text-[#DC2626]" />
        </div>
        <h1 className="text-2xl font-black text-[#333654]">התשלום נכשל</h1>
        <p className="text-[#6B6D8A] text-sm leading-relaxed">
          אירעה שגיאה בביצוע התשלום.
          <br />ניתן לנסות שוב או לפנות למשרד הקייטנה.
        </p>
        <div className="mt-2 rounded-xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-sm font-semibold text-[#DC2626] w-full">
          ניתן לסגור חלון זה ולנסות שוב
        </div>
      </div>
    </div>
  )
}
