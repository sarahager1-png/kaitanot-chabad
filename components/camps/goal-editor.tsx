'use client'

import { useState } from 'react'
import { Target, Pencil, Check, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface GoalEditorProps {
  campId: string
  goal: number
  registrantCount: number
  canEdit: boolean
}

export function GoalEditor({ campId, goal, registrantCount, canEdit }: GoalEditorProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(goal || ''))
  const [saving, setSaving] = useState(false)

  const goalPct = goal > 0 ? Math.min(Math.round((registrantCount / goal) * 100), 100) : 0

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/camps/${campId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registration_goal: Number(value) || 0 }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('יעד עודכן')
      router.refresh()
      setEditing(false)
    } catch {
      toast.error('שגיאה בשמירה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">

      {/* Registrants row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[#6B6D8A]">
          <span className="text-xl font-black text-[#333654]">{registrantCount}</span>
          <span>רשומים</span>
        </div>

        {/* Goal section */}
        {editing ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9091A8]">יעד:</span>
            <input
              type="number"
              value={value}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
              autoFocus
              className="w-20 h-8 rounded-lg border-2 border-[#333654] px-2 text-sm text-center font-bold text-[#333654] focus:outline-none"
            />
            <button onClick={save} disabled={saving}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#333654] text-white hover:bg-[#444668] transition-colors">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E5E8] text-[#9091A8] hover:bg-[#FDE8E7] hover:text-red-500 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : goal > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#9091A8]">יעד: <span className="font-bold text-[#333654]">{goal}</span></span>
            {canEdit && (
              <button onClick={() => { setValue(String(goal)); setEditing(true) }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#C4C4C4] hover:text-[#333654] hover:bg-[#F5F5F3] transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ) : canEdit ? (
          <button
            onClick={() => { setValue(''); setEditing(true) }}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-[#333654] px-3 py-1.5 text-xs font-bold text-[#333654] hover:bg-[#F5F5F3] transition-colors"
          >
            <Target className="h-3.5 w-3.5" />
            הגדר יעד נרשמים
          </button>
        ) : null}
      </div>

      {/* Progress bar */}
      {goal > 0 && (
        <div>
          <div className="flex justify-between text-xs text-[#9091A8] mb-1.5">
            <span>התקדמות לעבר היעד</span>
            <span className="font-bold text-[#333654]">{goalPct}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#F5F5F3] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-l from-[#333654] to-[#00B1AE] transition-all"
              style={{ width: `${goalPct}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
