'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, CheckCircle, Clock, Users, Calendar, Upload, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Employee, SalaryPayment } from '@/lib/types'

const CAMP_MONTHS = [
  { month: 6, label: 'יולי' },
  { month: 7, label: 'אוגוסט' },
]

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function currentMonthKey() {
  const d = new Date()
  return monthKey(d.getFullYear(), d.getMonth())
}

interface SalariesClientProps {
  employees: Employee[]
  payments: SalaryPayment[]
  campId: string
}

export function SalariesClient({ employees: init, payments: initPay, campId }: SalariesClientProps) {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>(init)
  const [payments, setPayments] = useState<Record<string, SalaryPayment>>(
    Object.fromEntries(initPay.map(p => [`${p.employee_id}-${p.month.slice(0, 7)}`, p]))
  )
  const [activeTab, setActiveTab] = useState<'monthly' | 'employees'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState(() => currentMonthKey().slice(0, 7))
  const [empFormOpen, setEmpFormOpen] = useState(false)
  const [empForm, setEmpForm] = useState({ name: '', role: '', monthly_salary: '', notes: '' })
  const [payModal, setPayModal] = useState<Employee | null>(null)
  const [payFile, setPayFile] = useState<File | null>(null)
  const [payNotes, setPayNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const year = new Date().getFullYear()
  const months = CAMP_MONTHS.map(m => ({ key: monthKey(year, m.month).slice(0, 7), label: m.label }))

  const totalMonth = employees.reduce((s, e) => s + Number(e.monthly_salary), 0)
  const monthPayments = employees.map(e => ({ emp: e, payment: payments[`${e.id}-${selectedMonth}`] ?? null }))
  const paidCount = monthPayments.filter(p => p.payment?.status === 'paid').length

  async function addEmployee() {
    if (!empForm.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: campId, ...empForm, monthly_salary: Number(empForm.monthly_salary) || 0 }),
      })
      if (!res.ok) throw new Error(await res.text())
      const emp = await res.json()
      setEmployees(prev => [...prev, emp])
      setEmpFormOpen(false)
      setEmpForm({ name: '', role: '', monthly_salary: '', notes: '' })
      toast.success('עובד נוסף')
    } catch (err) { toast.error('שגיאה: ' + String(err)) }
    finally { setSaving(false) }
  }

  async function deleteEmployee(id: string) {
    const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('שגיאה במחיקה'); return }
    setEmployees(prev => prev.filter(e => e.id !== id))
    toast.success('עובד הוסר')
  }

  async function markPaid() {
    if (!payModal) return
    setSaving(true)
    try {
      let receiptUrl: string | null = null
      if (payFile) {
        const fd = new FormData()
        fd.append('file', payFile)
        fd.append('camp_id', campId)
        fd.append('employee_id', payModal.id)
        const uploadRes = await fetch('/api/finance/invoices/upload', { method: 'POST', body: fd })
        if (uploadRes.ok) { const j = await uploadRes.json(); receiptUrl = j.url }
      }
      const res = await fetch('/api/salary-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camp_id: campId, employee_id: payModal.id,
          month: selectedMonth + '-01', amount: payModal.monthly_salary,
          receipt_url: receiptUrl, notes: payNotes,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const payment = await res.json()
      setPayments(prev => ({ ...prev, [`${payModal.id}-${selectedMonth}`]: payment }))
      setPayModal(null); setPayFile(null); setPayNotes('')
      toast.success('תשלום אושר')
    } catch (err) { toast.error('שגיאה: ' + String(err)) }
    finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-[#F5F5F3] p-1 w-fit">
        {([['monthly', 'תשלום חודשי', Calendar], ['employees', 'עובדים', Users]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={['flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all', activeTab === key ? 'bg-white text-[#333654] shadow-sm' : 'text-[#6B6D8A] hover:text-[#333654]'].join(' ')}>
            <Icon className="h-3.5 w-3.5" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'monthly' && (
        <div className="flex flex-col gap-4">
          {/* Month selector */}
          <div className="flex gap-2">
            {months.map(m => (
              <button key={m.key} onClick={() => setSelectedMonth(m.key)}
                className={['flex flex-col items-center px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all', selectedMonth === m.key ? 'bg-[#333654] text-white border-[#333654]' : 'bg-white text-[#6B6D8A] border-[#E5E5E8] hover:border-[#333654]'].join(' ')}>
                <span>{m.label}</span>
                <span className={['text-xs font-bold mt-0.5', selectedMonth === m.key ? 'text-white/70' : 'text-[#9091A8]'].join(' ')}>
                  {employees.filter(e => payments[`${e.id}-${m.key}`]?.status === 'paid').length}/{employees.length}
                </span>
              </button>
            ))}
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 text-center">
              <p className="text-2xl font-black text-[#1A7A4A]">{paidCount}</p>
              <p className="text-xs text-[#9091A8] mt-0.5">שולמו</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 text-center">
              <p className="text-2xl font-black text-[#B45309]">{employees.length - paidCount}</p>
              <p className="text-xs text-[#9091A8] mt-0.5">ממתינים</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 text-center">
              <p className="text-lg font-black text-[#00B1AE]">₪{totalMonth.toLocaleString()}</p>
              <p className="text-xs text-[#9091A8] mt-0.5">סה״כ חודשי</p>
            </div>
          </div>

          {/* Employee rows */}
          <div className="flex flex-col gap-2">
            {monthPayments.map(({ emp, payment }) => {
              const paid = payment?.status === 'paid'
              return (
                <div key={emp.id} className={['rounded-xl border p-4 flex items-center gap-4 bg-white transition-colors', paid ? 'border-[#1A7A4A]/30 bg-[#E5F4EC]/30' : 'border-[#E5E5E8]'].join(' ')}>
                  <div className={['w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0', paid ? 'bg-[#1A7A4A]' : 'bg-[#9091A8]'].join(' ')}>
                    {paid ? <CheckCircle className="h-4 w-4" /> : emp.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#333654] text-sm">{emp.name}</p>
                    <p className="text-xs text-[#9091A8]">{emp.role}</p>
                  </div>
                  <div className="text-left flex-shrink-0">
                    <p className="font-black text-[#333654]">₪{Number(emp.monthly_salary).toLocaleString()}</p>
                    <p className={['text-xs font-medium', paid ? 'text-[#1A7A4A]' : 'text-[#B45309]'].join(' ')}>{paid ? 'שולם ✓' : 'ממתין'}</p>
                  </div>
                  {!paid && (
                    <button onClick={() => setPayModal(emp)}
                      className="flex items-center gap-1.5 h-8 rounded-lg bg-[#333654] px-3 text-xs font-bold text-white hover:bg-[#444668] transition-colors flex-shrink-0">
                      <CheckCircle className="h-3.5 w-3.5" />שולם
                    </button>
                  )}
                  {paid && payment?.receipt_url && (
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 h-8 rounded-lg border border-[#E5E5E8] px-3 text-xs font-semibold text-[#6B6D8A] hover:border-[#333654] transition-colors flex-shrink-0">
                      קבלה
                    </a>
                  )}
                </div>
              )
            })}
            {employees.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E5E5E8] py-14 text-center">
                <p className="text-sm text-[#9091A8] mb-2">אין עובדים</p>
                <button onClick={() => setActiveTab('employees')} className="text-sm font-semibold text-[#00B1AE] hover:underline">הוסף עובדים בלשונית "עובדים"</button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#9091A8]">{employees.length} עובדים פעילים · סה״כ ₪{totalMonth.toLocaleString()} לחודש</p>
            <button onClick={() => setEmpFormOpen(true)}
              className="flex items-center gap-1.5 h-9 rounded-lg bg-[#333654] px-3 text-sm font-bold text-white hover:bg-[#444668] transition-colors">
              <Plus className="h-4 w-4" />הוסף עובד
            </button>
          </div>

          <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
            <div className="bg-[#333654] px-4 py-3">
              <span className="text-xs font-semibold text-white/80 tracking-wide">רשימת עובדים</span>
            </div>
            {employees.length === 0 ? (
              <div className="py-14 text-center text-sm text-[#9091A8]">אין עובדים — הוסף את הראשון</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F5F5F3] border-b border-[#E5E5E8]">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-bold text-[#6B6D8A]">שם</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-[#6B6D8A]">תפקיד</th>
                    <th className="text-right px-3 py-3 text-xs font-bold text-[#6B6D8A]">משכורת חודשית</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5F5F3]">
                  {employees.map(emp => (
                    <tr key={emp.id} className="hover:bg-[#F5F5F3]/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-[#333654]">{emp.name}</td>
                      <td className="px-3 py-3 text-[#6B6D8A]">{emp.role ?? '—'}</td>
                      <td className="px-3 py-3 font-bold text-[#333654]">₪{Number(emp.monthly_salary).toLocaleString()}</td>
                      <td className="px-3 py-3 text-left">
                        <button onClick={() => deleteEmployee(emp.id)} className="p-1.5 rounded-lg text-[#9091A8] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#F5F5F3] border-t-2 border-[#E5E5E8]">
                  <tr>
                    <td className="px-4 py-3 font-bold text-[#333654]" colSpan={2}>סה״כ חודשי</td>
                    <td className="px-3 py-3 font-black text-[#00B1AE]">₪{totalMonth.toLocaleString()}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add employee dialog */}
      <Dialog open={empFormOpen} onOpenChange={o => !o && setEmpFormOpen(false)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>הוספת עובד</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label>שם מלא *</Label><Input value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>תפקיד</Label><Input placeholder="מדריך / מנהלת / ..." value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>משכורת חודשית ₪</Label><Input type="number" value={empForm.monthly_salary} onChange={e => setEmpForm(p => ({ ...p, monthly_salary: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>הערות</Label><Input value={empForm.notes} onChange={e => setEmpForm(p => ({ ...p, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmpFormOpen(false)}>ביטול</Button>
            <Button onClick={addEmployee} disabled={saving || !empForm.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay confirmation dialog */}
      <Dialog open={!!payModal} onOpenChange={o => !o && (setPayModal(null), setPayFile(null), setPayNotes(''))}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>אישור תשלום משכורת</DialogTitle></DialogHeader>
          {payModal && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#6B6D8A]">{payModal.name} · ₪{Number(payModal.monthly_salary).toLocaleString()}</p>
              <div className="flex flex-col gap-1.5">
                <Label>קובץ אסמכתא (אופציונלי)</Label>
                <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[#E5E5E8] rounded-xl p-4 cursor-pointer hover:border-[#00B1AE] transition-colors">
                  <Upload className="h-5 w-5 text-[#9091A8]" />
                  <span className="text-sm text-[#9091A8]">{payFile ? payFile.name : 'לחץ לבחירת קובץ'}</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setPayFile(e.target.files?.[0] ?? null)} />
                </label>
              </div>
              <div className="flex flex-col gap-1.5"><Label>הערות</Label><Input value={payNotes} onChange={e => setPayNotes(e.target.value)} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPayModal(null); setPayFile(null); setPayNotes('') }}>ביטול</Button>
            <Button onClick={markPaid} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4" />אשר תשלום</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
