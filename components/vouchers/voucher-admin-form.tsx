'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useRouter } from 'next/navigation'

const AUDIENCE_OPTIONS = ['חניכים', 'צוות', 'הכל'] as const
const EMOJIS = ['🎨', '🎉', '🏊', '🎭', '🎶', '🏆', '🎁', '🍕', '⚽', '🎯']

interface VoucherAdminFormProps {
  open: boolean
  onClose: () => void
}

export function VoucherAdminForm({ open, onClose }: VoucherAdminFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    emoji: '🎨',
    expiry_date: '31/08/2025',
    audience: 'חניכים' as 'חניכים' | 'צוות' | 'הכל',
  })

  if (!open) return null

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/voucher-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        price: form.price ? Number(form.price) : null,
      }),
    })
    setSaving(false)
    onClose()
    router.refresh()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-base font-black text-[#333654]">הוסף סוג שובר</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/* Emoji picker */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">אייקון</label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  className={['text-xl rounded-lg p-1.5 transition-all', form.emoji === e ? 'bg-[#00B1AE]/20 ring-2 ring-[#00B1AE]' : 'hover:bg-gray-100'].join(' ')}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">שם השובר *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder='שוברים לסדנאות'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none"
              dir="rtl"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">תיאור</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder='סדנאות העשרה ייחודיות לחניכים'
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none"
              dir="rtl"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold text-gray-500">ערך (₪)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                placeholder="80"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-bold text-gray-500">תוקף עד</label>
              <input
                type="text"
                value={form.expiry_date}
                onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
                placeholder="31/08/2025"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-500">קהל יעד</label>
            <div className="flex gap-2">
              {AUDIENCE_OPTIONS.map((a) => (
                <button
                  key={a}
                  onClick={() => setForm((f) => ({ ...f, audience: a }))}
                  className={['flex-1 rounded-lg py-2 text-sm font-semibold transition-all', form.audience === a ? 'bg-[#333654] text-white' : 'border border-gray-200 text-gray-600 hover:border-[#00B1AE]'].join(' ')}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            className="flex-1 rounded-lg bg-[#00B1AE] py-2 text-sm font-bold text-white hover:bg-[#006A82] disabled:opacity-50 transition-colors"
          >
            {saving ? 'שומר...' : 'שמור'}
          </button>
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            ביטול
          </button>
        </div>
      </div>
    </div>
  )
}
