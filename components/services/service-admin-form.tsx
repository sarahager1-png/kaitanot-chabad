'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { SERVICE_CATEGORIES } from '@/lib/constants'

interface ServiceAdminFormProps {
  open: boolean
  onClose: () => void
}

export function ServiceAdminForm({ open, onClose }: ServiceAdminFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState(SERVICE_CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [priceUnit, setPriceUnit] = useState('')
  const [unitLabel, setUnitLabel] = useState('יח׳')
  const [priceChild, setPriceChild] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category,
          description: description.trim() || null,
          price_per_unit: priceUnit ? Number(priceUnit) : null,
          unit_label: unitLabel || 'יח׳',
          price_per_child: priceChild ? Number(priceChild) : null,
          is_active: true,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('השירות נוסף')
      router.refresh()
      onClose()
      setName(''); setDescription(''); setPriceUnit(''); setPriceChild('')
    } catch {
      toast.error('שגיאה בהוספת שירות')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
          <h2 className="font-black text-[#333654]">הוסף שירות חדש</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#F5F5F3] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">שם השירות *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="לדוגמה: אוזניות סיליקון"
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none focus:ring-2 focus:ring-[#00B1AE]/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">קטגוריה</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            >
              {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="תיאור קצר..."
              className="rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none focus:ring-2 focus:ring-[#00B1AE]/20 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#333654]">מחיר ליחידה (₪)</label>
              <input
                type="number"
                value={priceUnit}
                onChange={(e) => setPriceUnit(e.target.value)}
                placeholder="0"
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#333654]">תווית יחידה</label>
              <input
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
                placeholder="יח׳"
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">מחיר לילד (₪)</label>
            <input
              type="number"
              value={priceChild}
              onChange={(e) => setPriceChild(e.target.value)}
              placeholder="0"
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3] transition-colors">
              ביטול
            </button>
            <button type="submit" disabled={loading} className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : 'הוסף שירות'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
