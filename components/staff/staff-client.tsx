'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, Loader2, UserCheck, Phone, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import { STAFF_ROLES, SALARY_TYPES } from '@/lib/constants'
import type { StaffMember } from '@/lib/types'

interface StaffClientProps {
  staffList: StaffMember[]
  campId: string
}

const emptyForm: {
  full_name: string; role: string; phone: string; email: string;
  salary: string; salary_type: 'חודשי' | 'יומי' | 'שעתי'; start_date: string; end_date: string; notes: string;
} = {
  full_name: '', role: STAFF_ROLES[0], phone: '', email: '',
  salary: '', salary_type: 'חודשי', start_date: '', end_date: '', notes: '',
}

const roleColor: Record<string, string> = {
  'מנהל קייטנה':      'bg-[#FEF0EC] text-[#333654]',
  'רכז פעילות':       'bg-[#E0F7F7] text-[#00B1AE]',
  'מדריך בכיר':       'bg-[#E5F4EC] text-[#1A7A4A]',
  'מדריך':            'bg-[#F5F5F3] text-[#333654]',
  'אחראי לוגיסטיקה':  'bg-[#FEF3E2] text-[#B45309]',
  'אחר':              'bg-[#F5F5F3] text-[#6B6D8A]',
}

export function StaffClient({ staffList, campId }: StaffClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

  function setField(k: keyof typeof emptyForm, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  function openNew() { setEditing(null); setForm(emptyForm); setFormOpen(true) }

  function openEdit(s: StaffMember) {
    setEditing(s)
    setForm({
      full_name: s.full_name, role: s.role, phone: s.phone ?? '', email: s.email ?? '',
      salary: String(s.salary ?? ''), salary_type: s.salary_type,
      start_date: s.start_date ?? '', end_date: s.end_date ?? '', notes: s.notes ?? '',
    })
    setFormOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.role) { toast.error('שם ותפקיד הם שדות חובה'); return }
    setLoading(true)
    try {
      const body = {
        ...form, camp_id: campId,
        salary: form.salary ? Number(form.salary) : null,
        phone: form.phone || null, email: form.email || null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        notes: form.notes || null,
      }
      const url = editing ? `/api/staff?id=${editing.id}` : '/api/staff'
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error(await res.text())
      toast.success(editing ? 'עודכן בהצלחה' : 'חבר צוות נוסף')
      router.refresh()
      setFormOpen(false)
    } catch (err) { toast.error('שגיאה: ' + String(err)) } finally { setLoading(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/staff?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('שגיאה במחיקה'); return }
    toast.success('נמחק')
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B6D8A]">{staffList.length} חברי צוות</p>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-2 text-sm font-bold text-white hover:bg-[#444668] transition-colors"
        >
          <Plus className="h-4 w-4" />הוסף חבר צוות
        </button>
      </div>

      {staffList.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-dashed border-[#E5E5E8]">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F3]">
            <UserCheck className="h-7 w-7 text-[#9091A8]" />
          </div>
          <p className="text-sm text-[#6B6D8A]">אין חברי צוות עדיין</p>
          <button onClick={openNew} className="text-sm font-semibold text-[#00B1AE] hover:underline">
            הוסף חבר צוות ראשון
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden divide-y divide-[#FEF0EC]">
          {staffList.map((s) => {
            const badgeStyle = roleColor[s.role] ?? roleColor['אחר']
            return (
              <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3]/50 transition-colors">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F3] flex-shrink-0 font-bold text-[#333654] text-sm">
                  {s.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-[#333654]">{s.full_name}</span>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${badgeStyle}`}>{s.role}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {s.phone && (
                      <span className="flex items-center gap-1 text-xs text-[#9091A8]" dir="ltr">
                        <Phone className="h-3 w-3" />{s.phone}
                      </span>
                    )}
                    {s.salary && (
                      <span className="flex items-center gap-1 text-xs text-[#9091A8]">
                        <DollarSign className="h-3 w-3" />₪{s.salary} {s.salary_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(s)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#F5F5F3] hover:text-[#00B1AE] transition-colors">
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>מחיקת חבר צוות</AlertDialogTitle>
                        <AlertDialogDescription>האם למחוק את {s.full_name}? פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(s.id)} className="bg-[#C8251D] hover:bg-[#a01e17] text-white">מחק</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFormOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
              <h2 className="font-black text-[#333654]">{editing ? 'עריכת חבר צוות' : 'הוספת חבר צוות'}</h2>
              <button onClick={() => setFormOpen(false)} className="text-[#9091A8] hover:text-[#6B6D8A]">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 col-span-2">
                  <label className="text-sm font-semibold text-[#333654]">שם מלא *</label>
                  <input value={form.full_name} onChange={(e) => setField('full_name', e.target.value)} required
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none focus:ring-2 focus:ring-[#00B1AE]/20" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">תפקיד *</label>
                  <select value={form.role} onChange={(e) => setField('role', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none">
                    {STAFF_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">טלפון</label>
                  <input dir="ltr" value={form.phone} onChange={(e) => setField('phone', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">שכר (₪)</label>
                  <input type="number" value={form.salary} onChange={(e) => setField('salary', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">סוג שכר</label>
                  <select value={form.salary_type} onChange={(e) => setField('salary_type', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none">
                    {SALARY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">תחילת עבודה</label>
                  <input type="date" value={form.start_date} onChange={(e) => setField('start_date', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">סיום עבודה</label>
                  <input type="date" value={form.end_date} onChange={(e) => setField('end_date', e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3] transition-colors">
                  ביטול
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors">
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : editing ? 'עדכן' : 'הוסף'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
