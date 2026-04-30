'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Budget, ExpenseEntry } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

interface BudgetOverviewProps {
  budgets: Budget[]
  expenses: ExpenseEntry[]
  campId: string
}

export function BudgetOverview({ budgets: initialBudgets, expenses, campId }: BudgetOverviewProps) {
  const router = useRouter()
  const [budgets, setBudgets] = useState(initialBudgets)
  const [editing, setEditing] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [newCat, setNewCat] = useState(EXPENSE_CATEGORIES[0])
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const actualByCategory: Record<string, number> = {}
  expenses.forEach((e) => {
    actualByCategory[e.category] = (actualByCategory[e.category] ?? 0) + Number(e.amount)
  })

  const existingCats = new Set(budgets.map(b => b.category))
  const availableCats = EXPENSE_CATEGORIES.filter(c => !existingCats.has(c))

  async function saveBudget(category: string, planned_amount: number) {
    setSaving(true)
    try {
      const res = await fetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: campId, category, planned_amount }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const updated = await res.json()
      setBudgets(prev => {
        const idx = prev.findIndex(b => b.category === category)
        if (idx >= 0) { const arr = [...prev]; arr[idx] = updated; return arr }
        return [...prev, updated]
      })
      toast.success('תקציב עודכן')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {budgets.length === 0 && !addOpen && (
        <div className="rounded-lg border border-dashed border-[#E5E5E8] py-8 text-center">
          <p className="text-sm text-[#9091A8] mb-3">לא הוגדר תקציב עדיין</p>
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-2 text-sm font-bold text-white hover:bg-[#444668] transition-colors"
          >
            <Plus className="h-4 w-4" />הגדר תקציב
          </button>
        </div>
      )}

      {budgets.map((b) => {
        const actual = actualByCategory[b.category] ?? 0
        const pct = b.planned_amount > 0 ? Math.round((actual / b.planned_amount) * 100) : 0
        const isOver = pct >= 100
        const isWarning = pct >= (b.alert_threshold ?? 0.9) * 100
        const barColor = isOver ? 'bg-[#C8251D]' : isWarning ? 'bg-[#B45309]' : 'bg-[#00B1AE]'

        return (
          <div key={b.id ?? b.category} className="rounded-xl border border-[#E5E5E8] bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-[#333654]">{b.category}</span>
              <div className="flex items-center gap-2">
                {editing === b.category ? (
                  <>
                    <span className="text-xs text-[#9091A8]">₪</span>
                    <input
                      type="number"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      className="w-24 h-7 rounded border border-[#E5E5E8] px-2 text-xs focus:border-[#00B1AE] focus:outline-none"
                      autoFocus
                    />
                    <button
                      onClick={async () => { await saveBudget(b.category, Number(editValue)); setEditing(null) }}
                      disabled={saving}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E5F4EC] text-[#1A7A4A] hover:bg-[#1A7A4A] hover:text-white transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F5F5F3] text-[#6B6D8A] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isOver ? 'bg-[#FDE8E7] text-[#C8251D]' : isWarning ? 'bg-[#FEF3E2] text-[#B45309]' : 'bg-[#F5F5F3] text-[#6B6D8A]'}`}>
                      {pct}%
                    </span>
                    <span className="text-xs text-[#9091A8]">₪{actual.toLocaleString()} / ₪{b.planned_amount.toLocaleString()}</span>
                    <button
                      onClick={() => { setEditing(b.category); setEditValue(String(b.planned_amount)) }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#F5F5F3] hover:text-[#00B1AE] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-[#F5F5F3] overflow-hidden">
              <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        )
      })}

      {/* Add new budget category */}
      {addOpen ? (
        <div className="rounded-xl border border-[#E5E5E8] bg-white p-3 flex flex-wrap items-center gap-2">
          <select
            value={newCat}
            onChange={e => setNewCat(e.target.value as typeof newCat)}
            className="flex-1 h-9 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
          >
            {(availableCats.length > 0 ? availableCats : EXPENSE_CATEGORIES).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#9091A8]">₪</span>
            <input
              type="number"
              value={newAmount}
              onChange={e => setNewAmount(e.target.value)}
              placeholder="סכום"
              className="w-28 h-9 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              if (!newAmount) return
              await saveBudget(newCat, Number(newAmount))
              setNewAmount(''); setAddOpen(false)
            }}
            disabled={saving || !newAmount}
            className="flex items-center gap-1 h-9 rounded-lg bg-[#333654] px-3 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors"
          >
            <Check className="h-4 w-4" />שמור
          </button>
          <button onClick={() => setAddOpen(false)} className="h-9 w-9 flex items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#F5F5F3] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : budgets.length > 0 && (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#9091A8] hover:border-[#00B1AE] hover:text-[#00B1AE] transition-colors"
        >
          <Plus className="h-4 w-4" />הוסף קטגוריה
        </button>
      )}
    </div>
  )
}
