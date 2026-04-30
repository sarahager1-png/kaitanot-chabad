'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Loader2, CheckSquare, Square, Save } from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRegistrant {
  id: string
  first_name: string
  last_name: string
  group_name: string | null
}

interface AttendanceRecord {
  registrant_id: string
  present: boolean
  notes: string
}

interface AttendanceClientProps {
  registrants: AttendanceRegistrant[]
  campId: string
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function AttendanceClient({ registrants, campId }: AttendanceClientProps) {
  const [date, setDate] = useState(todayISO)
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>(() =>
    Object.fromEntries(registrants.map(r => [r.id, { registrant_id: r.id, present: true, notes: '' }]))
  )
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const loadingRef = useRef<string>('')

  const groups = [...new Set(registrants.map(r => r.group_name ?? 'ללא קבוצה'))]

  const loadAttendance = useCallback(async (d: string) => {
    loadingRef.current = d
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?camp_id=${campId}&date=${d}`)
      if (loadingRef.current !== d) return
      if (!res.ok) return
      const data: { registrant_id: string; present: boolean; notes: string | null }[] = await res.json()
      const existing = Object.fromEntries(data.map(a => [a.registrant_id, { registrant_id: a.registrant_id, present: a.present, notes: a.notes ?? '' }]))
      setRecords(prev => {
        const next = { ...prev }
        for (const r of registrants) {
          next[r.id] = existing[r.id] ?? { registrant_id: r.id, present: true, notes: '' }
        }
        return next
      })
    } finally {
      if (loadingRef.current === d) setLoading(false)
    }
  }, [campId, registrants])

  useEffect(() => { loadAttendance(date) }, [date, loadAttendance])

  function toggle(id: string) {
    setRecords(prev => ({ ...prev, [id]: { ...prev[id], present: !prev[id].present } }))
  }

  function setNote(id: string, notes: string) {
    setRecords(prev => ({ ...prev, [id]: { ...prev[id], notes } }))
  }

  function markAll(present: boolean) {
    setRecords(prev => Object.fromEntries(Object.entries(prev).map(([k, v]) => [k, { ...v, present }])))
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: campId, date, records: Object.values(records) }),
      })
      if (!res.ok) throw new Error('שגיאה בשמירה')
      const json = await res.json()
      toast.success(`נשמרו ${json.saved} רשומי נוכחות`)
    } catch (err) {
      toast.error(String(err))
    } finally {
      setSaving(false)
    }
  }

  const presentCount = Object.values(records).filter(r => r.present).length
  const total = registrants.length
  const pct = total > 0 ? Math.round((presentCount / total) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#333654] focus:outline-none focus:ring-2 focus:ring-[#333654]/20"
        />
        <button
          onClick={() => markAll(true)}
          className="flex items-center gap-1.5 h-10 rounded-lg border border-[#E5E5E8] bg-white px-4 text-sm font-semibold text-[#1A7A4A] hover:border-[#1A7A4A] transition-colors"
        >
          <CheckSquare className="h-4 w-4" />סמן כולם נוכחים
        </button>
        <button
          onClick={() => markAll(false)}
          className="flex items-center gap-1.5 h-10 rounded-lg border border-[#E5E5E8] bg-white px-4 text-sm font-semibold text-[#C8251D] hover:border-[#C8251D] transition-colors"
        >
          <Square className="h-4 w-4" />נקה הכל
        </button>
        <button
          onClick={save}
          disabled={saving || loading}
          className="flex items-center gap-1.5 h-10 rounded-lg bg-[#333654] px-4 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-50 transition-colors"
        >
          {saving ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : <><Save className="h-4 w-4" />שמור</>}
        </button>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-[#E5E5E8] bg-white p-4 flex items-center gap-4 shadow-sm">
        <div className="flex-1">
          <div className="flex justify-between text-sm font-semibold mb-1.5">
            <span className="text-[#333654]">נוכחים: {presentCount} מתוך {total}</span>
            <span className="text-[#333654]">{pct}%</span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-[#FEF0EC] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#333654] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#333654]" />
        </div>
      )}

      {!loading && groups.map(group => {
        const groupRegs = registrants.filter(r => (r.group_name ?? 'ללא קבוצה') === group)
        if (groupRegs.length === 0) return null
        const groupPresent = groupRegs.filter(r => records[r.id]?.present).length
        return (
          <div key={group} className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#FEF0EC] bg-[#F5F5F3]">
              <span className="font-bold text-[#333654]">{group}</span>
              <span className="text-xs font-semibold text-[#9091A8]">{groupPresent}/{groupRegs.length} נוכחים</span>
            </div>
            <div className="divide-y divide-[#FEF0EC]">
              {groupRegs.map(r => {
                const rec = records[r.id]
                const present = rec?.present ?? true
                return (
                  <div
                    key={r.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${present ? '' : 'bg-[#FDE8E7]/30'}`}
                  >
                    <button
                      onClick={() => toggle(r.id)}
                      className={`shrink-0 flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                        present
                          ? 'bg-[#E5F4EC] text-[#1A7A4A] hover:bg-[#1A7A4A] hover:text-white'
                          : 'bg-[#FDE8E7] text-[#C8251D] hover:bg-[#C8251D] hover:text-white'
                      }`}
                    >
                      {present ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                    <span className={`flex-1 text-sm font-semibold ${present ? 'text-[#333654]' : 'text-[#9091A8] line-through'}`}>
                      {r.first_name} {r.last_name}
                    </span>
                    <input
                      type="text"
                      placeholder="הערה..."
                      value={rec?.notes ?? ''}
                      onChange={e => setNote(r.id, e.target.value)}
                      className="h-7 w-32 rounded-lg border border-[#E5E5E8] px-2 text-xs text-[#333654] placeholder:text-[#C5C5CC] focus:border-[#333654] focus:outline-none"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
