'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Upload, CheckCircle, Clock, PlayCircle, FileText, ExternalLink, Trash2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { PaymentRequest, RequestStatus } from '@/lib/types'
import { EXPENSE_CATEGORIES } from '@/lib/constants'

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:     { label: 'ממתין',   color: 'bg-[#FEF3E2] text-[#B45309]',  dot: 'bg-[#B45309]', icon: Clock },
  in_progress: { label: 'בביצוע', color: 'bg-[#E0F7F7] text-[#00B1AE]',  dot: 'bg-[#00B1AE]', icon: PlayCircle },
  paid:        { label: 'שולם',   color: 'bg-[#EFF6FF] text-[#1D4ED8]',  dot: 'bg-[#1D4ED8]', icon: FileText },
  completed:   { label: 'הושלם', color: 'bg-[#E5F4EC] text-[#1A7A4A]',  dot: 'bg-[#1A7A4A]', icon: CheckCircle },
}

const STEPS: RequestStatus[] = ['pending', 'in_progress', 'paid', 'completed']

function StatusStepper({ status }: { status: RequestStatus }) {
  const activeIdx = STEPS.indexOf(status)
  return (
    <div className="flex items-center gap-1 mt-3">
      {STEPS.map((step, i) => (
        <div key={step} className="flex items-center flex-1">
          <div className={['flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold', i <= activeIdx ? 'bg-[#333654] text-white' : 'bg-[#E5E5E8] text-[#9091A8]'].join(' ')}>
            {i < activeIdx ? '✓' : i + 1}
          </div>
          {i < STEPS.length - 1 && <div className={['flex-1 h-1 mx-1 rounded-full', i < activeIdx ? 'bg-[#333654]' : 'bg-[#E5E5E8]'].join(' ')} />}
        </div>
      ))}
    </div>
  )
}

interface RequestsClientProps {
  requests: PaymentRequest[]
  campId: string
}

export function RequestsClient({ requests: init, campId }: RequestsClientProps) {
  const router = useRouter()
  const [requests, setRequests] = useState<PaymentRequest[]>(init)
  const [filterStatus, setFilterStatus] = useState<'all' | RequestStatus>('all')
  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; amount: string; category: string; notes: string }>({ name: '', amount: '', category: EXPENSE_CATEGORIES[0], notes: '' })
  const [receiptModal, setReceiptModal] = useState<PaymentRequest | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const statusCounts = Object.fromEntries(STEPS.map(s => [s, requests.filter(r => r.status === s).length])) as Record<RequestStatus, number>
  const filtered = filterStatus === 'all' ? requests : requests.filter(r => r.status === filterStatus)

  async function addRequest() {
    if (!addForm.name.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: campId, ...addForm, amount: Number(addForm.amount) || 0 }),
      })
      if (!res.ok) throw new Error(await res.text())
      const req = await res.json()
      setRequests(prev => [req, ...prev])
      setAddOpen(false)
      setAddForm({ name: '', amount: '', category: EXPENSE_CATEGORIES[0], notes: '' })
      toast.success('בקשה נוספה')
    } catch (err) { toast.error('שגיאה: ' + String(err)) }
    finally { setSaving(false) }
  }

  async function updateStatus(id: string, status: RequestStatus) {
    const res = await fetch(`/api/requests/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) { toast.error('שגיאה בעדכון'); return }
    const updated = await res.json()
    setRequests(prev => prev.map(r => r.id === id ? updated : r))
  }

  async function uploadReceipt() {
    if (!receiptModal || !receiptFile) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('file', receiptFile)
      const res = await fetch(`/api/requests/${receiptModal.id}/receipt`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const updated = await res.json()
      setRequests(prev => prev.map(r => r.id === receiptModal.id ? updated : r))
      setReceiptModal(null); setReceiptFile(null)
      toast.success('קבלה הועלתה')
    } catch (err) { toast.error('שגיאה: ' + String(err)) }
    finally { setSaving(false) }
  }

  async function deleteRequest(id: string) {
    const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('שגיאה במחיקה'); return }
    setRequests(prev => prev.filter(r => r.id !== id))
    toast.success('בקשה נמחקה')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        {STEPS.map(s => {
          const cfg = STATUS_CONFIG[s]
          const Icon = cfg.icon
          return (
            <div key={s} className={`rounded-xl border p-3 flex items-center gap-3 ${cfg.color} border-current/20`}>
              <Icon className="h-5 w-5 flex-shrink-0" />
              <div><p className="text-2xl font-black">{statusCounts[s]}</p><p className="text-xs opacity-75">{cfg.label}</p></div>
            </div>
          )
        })}
      </div>

      {/* Filter + add */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-[#F5F5F3] p-1 flex-wrap">
          {([['all', 'הכל', requests.length], ...STEPS.map(s => [s, STATUS_CONFIG[s].label, statusCounts[s]])] as [string, string, number][]).map(([key, label, count]) => (
            <button key={key} onClick={() => setFilterStatus(key as typeof filterStatus)}
              className={['flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all', filterStatus === key ? 'bg-white text-[#333654] shadow-sm' : 'text-[#6B6D8A] hover:text-[#333654]'].join(' ')}>
              {label}
              {count > 0 && <span className="text-xs rounded-full px-1.5 py-0.5 font-bold bg-[#F5F5F3] text-[#6B6D8A]">{count}</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 h-9 rounded-lg bg-[#333654] px-3 text-sm font-bold text-white hover:bg-[#444668] transition-colors">
          <Plus className="h-4 w-4" />בקשה חדשה
        </button>
      </div>

      {/* Request cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(req => {
          const cfg = STATUS_CONFIG[req.status]
          const Icon = cfg.icon
          return (
            <div key={req.id} className="rounded-xl border border-[#E5E5E8] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#333654] text-base leading-tight">{req.name}</p>
                  {req.category && <p className="text-xs text-[#9091A8] mt-0.5">{req.category}</p>}
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mr-3">
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.color}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                  </span>
                  <span className="font-black text-lg text-[#333654]">₪{Number(req.amount).toLocaleString()}</span>
                </div>
              </div>

              {req.notes && <p className="text-sm text-[#6B6D8A] bg-[#F5F5F3] rounded-lg p-2.5 mb-3">{req.notes}</p>}

              <div className="flex items-center justify-between text-xs text-[#9091A8] mb-3 flex-wrap gap-1">
                <span>נוצר: {new Date(req.created_at).toLocaleDateString('he-IL')}</span>
                {req.paid_at && <span>שולם: {req.paid_at}</span>}
                {req.receipt_url && (
                  <a href={req.receipt_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[#00B1AE] hover:text-[#009490]">
                    <FileText className="h-3 w-3" />צפה בקבלה<ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>

              <StatusStepper status={req.status} />

              <div className="flex gap-2 mt-4">
                {req.status === 'pending' && (
                  <button onClick={() => updateStatus(req.id, 'in_progress')}
                    className="flex items-center gap-1.5 h-8 rounded-lg bg-[#333654] px-3 text-xs font-bold text-white hover:bg-[#444668] transition-colors flex-1 justify-center">
                    <PlayCircle className="h-3.5 w-3.5" />התחל ביצוע
                  </button>
                )}
                {req.status === 'in_progress' && (
                  <button onClick={() => setReceiptModal(req)}
                    className="flex items-center gap-1.5 h-8 rounded-lg bg-[#333654] px-3 text-xs font-bold text-white hover:bg-[#444668] transition-colors flex-1 justify-center">
                    <Upload className="h-3.5 w-3.5" />העלה קבלה
                  </button>
                )}
                {req.status === 'paid' && (
                  <button onClick={() => updateStatus(req.id, 'completed')}
                    className="flex items-center gap-1.5 h-8 rounded-lg bg-[#1A7A4A] px-3 text-xs font-bold text-white hover:bg-[#155e38] transition-colors flex-1 justify-center">
                    <CheckCircle className="h-3.5 w-3.5" />סמן הושלם
                  </button>
                )}
                {req.status === 'completed' && (
                  <div className="flex items-center gap-1.5 text-[#1A7A4A] text-sm font-semibold flex-1">
                    <CheckCircle className="h-4 w-4" />הושלם בהצלחה
                  </div>
                )}
                <AlertDialog>
                  <AlertDialogTrigger className="h-8 w-8 flex items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת בקשה</AlertDialogTitle>
                      <AlertDialogDescription>האם למחוק את הבקשה? פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteRequest(req.id)} className="bg-[#C8251D] hover:bg-[#a01e17] text-white">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#E5E5E8] py-16 text-center">
          <p className="text-sm text-[#9091A8]">אין בקשות {filterStatus !== 'all' ? `בסטטוס "${STATUS_CONFIG[filterStatus as RequestStatus]?.label}"` : ''}</p>
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={o => !o && setAddOpen(false)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>בקשת תשלום חדשה</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5"><Label>שם הבקשה *</Label><Input value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5"><Label>סכום ₪</Label><Input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))} /></div>
            <div className="flex flex-col gap-1.5">
              <Label>קטגוריה</Label>
              <select value={addForm.category} onChange={e => setAddForm(p => ({ ...p, category: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm focus:border-[#00B1AE] focus:outline-none">
                {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5"><Label>הערות</Label><Textarea value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ביטול</Button>
            <Button onClick={addRequest} disabled={saving || !addForm.name.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הוסף'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt upload dialog */}
      <Dialog open={!!receiptModal} onOpenChange={o => !o && (setReceiptModal(null), setReceiptFile(null))}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader><DialogTitle>העלאת קבלה</DialogTitle></DialogHeader>
          {receiptModal && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-[#6B6D8A]">{receiptModal.name} · ₪{Number(receiptModal.amount).toLocaleString()}</p>
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-[#E5E5E8] rounded-xl p-6 cursor-pointer hover:border-[#00B1AE] transition-colors">
                <Upload className="h-6 w-6 text-[#9091A8]" />
                <span className="text-sm text-[#9091A8]">{receiptFile ? receiptFile.name : 'לחץ לבחירת קובץ'}</span>
                <span className="text-xs text-[#C4C4C4]">PDF, JPG, PNG</span>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setReceiptModal(null); setReceiptFile(null) }}>ביטול</Button>
            <Button onClick={uploadReceipt} disabled={saving || !receiptFile}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Upload className="h-4 w-4" />העלה וסמן שולם</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
