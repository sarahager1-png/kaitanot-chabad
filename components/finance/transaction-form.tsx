'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Paperclip, X } from 'lucide-react'
import { toast } from 'sonner'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/lib/constants'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  type: 'income' | 'expense'
  campId: string
}

export function TransactionForm({ open, onClose, onSaved, type, campId }: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [vendor, setVendor] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'שולם' | 'לא שולם'>('לא שולם')
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  useEffect(() => {
    if (open && type === 'expense') {
      fetch('/api/vendors').then(r => r.json()).then(data => {
        if (Array.isArray(data)) setVendors(data.map((v: { name: string }) => v.name))
      }).catch(() => {})
    }
  }, [open, type])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!category || !amount) { toast.error('קטגוריה וסכום הם שדות חובה'); return }

    setLoading(true)
    try {
      const body = {
        camp_id: campId,
        category,
        description: description || null,
        amount: Number(amount),
        entry_date: date,
        ...(type === 'expense' ? {
          vendor: vendor || null,
          payment_status: paymentStatus,
        } : {}),
      }

      const url = type === 'income' ? '/api/finance/income' : '/api/finance/expenses'
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text())
      const saved = await res.json()

      if (type === 'expense') {
        if (vendor.trim()) {
          fetch('/api/vendors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: vendor.trim() }),
          }).catch(() => {})
        }

        if (invoiceFile && saved?.id) {
          const form = new FormData()
          form.append('file', invoiceFile)
          form.append('expenseId', saved.id)
          form.append('campId', campId)
          const uploadRes = await fetch('/api/finance/invoices/upload', { method: 'POST', body: form })
          if (!uploadRes.ok) toast.warning('ההוצאה נשמרה אך העלאת החשבונית נכשלה')
        }
      }

      toast.success(type === 'income' ? 'הכנסה נוספה' : 'הוצאה נוספה')
      onSaved()
      onClose()
      setCategory(''); setDescription(''); setAmount(''); setVendor('')
      setPaymentStatus('לא שולם'); setInvoiceFile(null)
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה לא ידועה'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'income' ? 'הוספת הכנסה' : 'הוספת הוצאה'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>קטגוריה *</Label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} required
              className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
              <option value="">בחר קטגוריה</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>סכום ₪ *</Label>
              <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תאריך</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>תיאור</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="פירוט..." />
          </div>
          {type === 'expense' && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label>ספק</Label>
                <input
                  list="vendors-list"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="שם הספק"
                  className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none"
                />
                <datalist id="vendors-list">
                  {vendors.map(v => <option key={v} value={v} />)}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>סטטוס תשלום</Label>
                <div className="flex gap-2">
                  {(['שולם', 'לא שולם'] as const).map(s => (
                    <button key={s} type="button" onClick={() => setPaymentStatus(s)}
                      className={[
                        'flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-all',
                        paymentStatus === s
                          ? s === 'שולם' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-amber-400 bg-amber-50 text-amber-700'
                          : 'border-[#E5E5E8] text-[#6B6D8A]'
                      ].join(' ')}>
                      {s === 'שולם' ? '✓ שולם' : '⏳ לא שולם'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>חשבונית</Label>
                {invoiceFile ? (
                  <div className="flex items-center gap-2 h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm text-[#333654]">
                    <Paperclip className="h-4 w-4 text-[#333654]" />
                    <span className="flex-1 truncate">{invoiceFile.name}</span>
                    <button type="button" onClick={() => setInvoiceFile(null)} className="text-[#9091A8] hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-2 h-10 rounded-lg border border-dashed border-[#E5E5E8] px-3 text-sm text-[#9091A8] hover:border-[#333654] hover:text-[#333654] transition-colors">
                    <Paperclip className="h-4 w-4" />
                    צרף חשבונית (PDF / תמונה)
                  </button>
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                  onChange={e => { setInvoiceFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
              </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : 'הוסף'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
