import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0FDF4] p-4" dir="rtl">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-8 text-center flex flex-col items-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#DCFCE7]">
          <CheckCircle className="h-10 w-10 text-[#16A34A]" />
        </div>
        <h1 className="text-2xl font-black text-[#333654]">התשלום התקבל!</h1>
        <p className="text-[#6B6D8A] text-sm leading-relaxed">
          התשלום בוצע בהצלחה. פרטי הרישום יעודכנו בקרוב.
          <br />תודה שהרשמת את ילדך לקייטנה!
        </p>
        <div className="mt-2 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] px-4 py-3 text-sm font-semibold text-[#16A34A] w-full">
          ניתן לסגור חלון זה
        </div>
      </div>
    </div>
  )
}
