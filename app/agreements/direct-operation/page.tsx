'use client'

import { useRef, useState } from 'react'
import { SignatureCanvas, SignatureCanvasRef } from '@/components/agreements/signature-canvas'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function DirectOperationPage() {
  const sigRef = useRef<SignatureCanvasRef>(null)
  const [form, setForm] = useState({ emissary: '', city: '', camp_year: new Date().getFullYear().toString(), sign_day: '', sign_place: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.emissary.trim()) { setError('נא למלא שם שליח'); return }
    if (sigRef.current?.isEmpty()) { setError('נא לחתום בחלון החתימה'); return }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/signed-agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreement_type: 'direct-operation', ...form, signature_data: sigRef.current?.toDataURL() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setDone(true)
    } catch (err) {
      setError('שגיאה בשמירה: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-6" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F4EC]">
            <CheckCircle className="h-8 w-8 text-[#1A7A4A]" />
          </div>
          <h1 className="text-2xl font-black text-[#333654]">ההסכם נחתם בהצלחה</h1>
          <p className="text-sm text-[#6B6D8A]">תודה! ההסכם התקבל ויישמר במערכת.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-8 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-[#333654] mb-1">הסכם הפעלה ישירה</h1>
          <p className="text-sm text-[#9091A8]">להפעלת קייטנה ישירה ע"י אגף מבצע חינוך</p>
        </div>

        {/* Agreement text */}
        <div className="bg-white rounded-2xl border border-[#E5E5E8] p-6 mb-6 text-sm text-[#333654] leading-relaxed space-y-3 shadow-sm">
          <p className="font-bold">הסכם זה נערך ונחתם בין:</p>
          <p><span className="font-bold">אגף מבצע חינוך — תנועת חב"ד</span> (להלן: "האגף")</p>
          <p>לבין</p>
          <p><span className="font-bold">השליח המפעיל</span> כמפורט להלן (להלן: "השליח")</p>
          <hr className="border-[#E5E5E8] my-3" />
          <p className="font-semibold">תנאי ההסכם:</p>
          <ol className="list-decimal list-inside space-y-2 text-[#4B4D6A]">
            <li>האגף מפעיל את הקייטנה ישירות ומממן את כלל הפעילות.</li>
            <li>השליח מתפקד כמנהל מקומי מטעם האגף ואחראי לביצוע בפועל.</li>
            <li>הרישום, הגבייה והתשלומים מנוהלים ישירות ע"י האגף.</li>
            <li>השליח מחויב לדיווח שוטף ולעמידה בנהלי האגף ולוחות הזמנים שנקבעו.</li>
            <li>הפעילות כפופה לאישורים ולהנחיות האגף בלבד.</li>
          </ol>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E5E8] p-6 shadow-sm flex flex-col gap-4">
          <h2 className="font-bold text-[#333654]">פרטי החותם</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">שם השליח *</label>
              <input value={form.emissary} onChange={e => setForm(p => ({ ...p, emissary: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">עיר / ישוב</label>
              <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">שנת הקייטנה</label>
              <input value={form.camp_year} onChange={e => setForm(p => ({ ...p, camp_year: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">תאריך החתימה</label>
              <input value={form.sign_day} onChange={e => setForm(p => ({ ...p, sign_day: e.target.value }))}
                placeholder="לדוגמה: כ״ה סיון תשפ״ה"
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-[#6B6D8A]">מקום החתימה</label>
              <input value={form.sign_place} onChange={e => setForm(p => ({ ...p, sign_place: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6B6D8A]">חתימת השליח *</label>
            <SignatureCanvas ref={sigRef} />
          </div>

          {error && <p className="text-sm text-[#C8251D] bg-[#FDE8E7] rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={submitting}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#333654] text-white font-bold text-sm hover:bg-[#444668] disabled:opacity-60 transition-colors mt-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {submitting ? 'שומר...' : 'חתום ושלח הסכם'}
          </button>
        </form>
      </div>
    </div>
  )
}
