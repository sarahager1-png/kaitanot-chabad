'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react'
import type { GrantType } from '@/lib/types'

interface GrantTypesAdminProps {
  initial: GrantType[]
}

export function GrantTypesAdmin({ initial }: GrantTypesAdminProps) {
  const [items, setItems] = useState<GrantType[]>(initial)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/grant-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || null,
          amount: newAmount ? Number(newAmount) : null,
          sort_order: items.length,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const created = await res.json()
      setItems(p => [...p, created])
      setNewName('')
      setNewAmount('')
      setNewDesc('')
      toast.success('סוג מענק נוסף')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/admin/grant-types/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json()).error)
      setItems(p => p.filter(g => g.id !== id))
      toast.success('נמחק')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {items.length === 0 ? (
        <p className="text-sm text-[#9091A8] text-center py-4">אין סוגי מענק עדיין</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map(g => (
            <div key={g.id} className="flex items-center gap-3 rounded-xl border border-[#E5E5E8] bg-[#F9F9F7] px-3 py-2.5">
              <GripVertical className="h-4 w-4 text-[#C9C9D0] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#333654]">{g.name}</p>
                {g.description && <p className="text-xs text-[#9091A8] mt-0.5">{g.description}</p>}
              </div>
              {g.amount != null && (
                <span className="text-xs font-bold text-[#1A7A4A] bg-[#E5F4EC] px-2 py-1 rounded-lg flex-shrink-0">
                  ₪{g.amount.toLocaleString()}
                </span>
              )}
              <button
                onClick={() => handleDelete(g.id)}
                className="text-[#9091A8] hover:text-[#C8251D] transition-colors flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 border-t border-[#F0F0F3] pt-4">
        <p className="text-xs font-bold text-[#6B6D8A] mb-1">הוסף סוג מענק חדש</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="שם המענק *"
            required
            className="h-9 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
          />
          <input
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            placeholder="סכום (₪)"
            type="number"
            min="0"
            className="h-9 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
          />
        </div>
        <input
          value={newDesc}
          onChange={e => setNewDesc(e.target.value)}
          placeholder="תיאור (אופציונלי)"
          className="h-9 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
        />
        <button
          type="submit"
          disabled={saving || !newName.trim()}
          className="flex items-center justify-center gap-2 h-9 rounded-lg bg-[#333654] text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" />הוסף</>}
        </button>
      </form>
    </div>
  )
}
