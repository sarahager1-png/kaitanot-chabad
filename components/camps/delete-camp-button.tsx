'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function DeleteCampButton({ campId, campName }: { campId: string; campName: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      const res = await fetch(`/api/camps/${campId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('הקייטנה נמחקה')
      router.push('/camps')
      router.refresh()
    } catch (e) {
      toast.error('שגיאה: ' + (e instanceof Error ? e.message : 'בעיה לא ידועה'))
      setLoading(false)
      setConfirm(false)
    }
  }

  if (confirm) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl border border-[#E5E5E8] shadow-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <Trash2 className="h-6 w-6 text-red-600" />
        </div>
        <h3 className="text-lg font-black text-center text-[#333654] mb-2">מחיקת קייטנה</h3>
        <p className="text-sm text-center text-[#6B6D8A] mb-1">
          האם למחוק את <span className="font-bold text-[#333654]">"{campName}"</span>?
        </p>
        <p className="text-xs text-center text-red-500 mb-6">פעולה זו תמחק את כל הנרשמים, הכספים והמסמכים של הקייטנה ולא ניתן לשחזר.</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirm(false)} disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-[#E5E5E8] text-sm font-bold text-[#6B6D8A] hover:bg-[#F5F5F3] transition-all">
            ביטול
          </button>
          <button onClick={handleDelete} disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition-all flex items-center justify-center gap-1.5">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            מחק סופית
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <button onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 rounded-lg border border-[#E5E5E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#6B6D8A] hover:border-red-300 hover:text-red-500 transition-colors">
      <Trash2 className="h-3.5 w-3.5" />מחק
    </button>
  )
}
