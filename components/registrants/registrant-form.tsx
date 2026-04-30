'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PAYMENT_STATUSES, SHIRT_SIZES, KIPPAH_SIZES } from '@/lib/constants'
import type { Registrant, Track } from '@/lib/types'

interface RegistrantFormProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
  campId: string
  tracks: Track[]
  initial?: Partial<Registrant>
}

export function RegistrantForm({ open, onClose, onSaved, campId, tracks, initial }: RegistrantFormProps) {
  const isEdit = !!initial?.id
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    first_name: initial?.first_name ?? '',
    last_name: initial?.last_name ?? '',
    birth_date: initial?.birth_date ?? '',
    group_name: initial?.group_name ?? '',
    track_id: initial?.track_id ?? '',
    parent1_name: initial?.parent1_name ?? '',
    parent1_phone: initial?.parent1_phone ?? '',
    parent2_name: initial?.parent2_name ?? '',
    parent2_phone: initial?.parent2_phone ?? '',
    primary_phone: initial?.primary_phone ?? '',
    emergency_contact_name: initial?.emergency_contact_name ?? '',
    emergency_contact_phone: initial?.emergency_contact_phone ?? '',
    email: initial?.email ?? '',
    payment_status: initial?.payment_status ?? 'טרם שולם',
    amount_paid: String(initial?.amount_paid ?? '0'),
    amount_due: String(initial?.amount_due ?? '0'),
    notes: initial?.notes ?? '',
    gender: initial?.gender ?? '',
    photo_consent: initial?.photo_consent ?? false,
    shirt_size: initial?.shirt_size ?? '',
    kippah_size: initial?.kippah_size ?? '',
    is_healthy: initial?.is_healthy !== false,
    health_issues: initial?.health_issues ?? '',
    allergies: initial?.allergies ?? '',
    medications: initial?.medications ?? '',
    is_waiting: initial?.is_waiting ?? false,
  })

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.first_name || !form.last_name) { toast.error('שם פרטי ושם משפחה הם שדות חובה'); return }

    setLoading(true)
    try {
      const body = {
        ...form,
        camp_id: campId,
        track_id: form.track_id || null,
        birth_date: form.birth_date || null,
        email: form.email || null,
        amount_paid: Number(form.amount_paid),
        amount_due: Number(form.amount_due),
        notes: form.notes || null,
        gender: form.gender || null,
        shirt_size: form.shirt_size || null,
        kippah_size: form.gender === 'זכר' ? (form.kippah_size || null) : null,
        primary_phone: form.primary_phone || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        is_healthy: form.is_healthy,
        health_issues: form.health_issues || null,
        allergies: form.allergies || null,
        medications: form.medications || null,
        is_waiting: form.is_waiting,
      }

      const url = isEdit ? `/api/registrants/${initial.id}` : '/api/registrants'
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text())
      toast.success(isEdit ? 'הרשום עודכן' : 'הרשום נוסף')
      onSaved()
      onClose()
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה לא ידועה'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] w-[95vw] max-w-lg overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'עריכת רשום' : 'הוספת ילד'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Basic info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>שם פרטי *</Label>
              <Input value={form.first_name} onChange={(e) => setField('first_name', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>שם משפחה *</Label>
              <Input value={form.last_name} onChange={(e) => setField('last_name', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תאריך לידה</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setField('birth_date', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>קבוצה</Label>
              <Input placeholder="כיתה ג׳" value={form.group_name} onChange={(e) => setField('group_name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>מגדר</Label>
              <select value={form.gender} onChange={(e) => setField('gender', e.target.value)}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                <option value="">בחר</option>
                <option value="זכר">זכר</option>
                <option value="נקבה">נקבה</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>מידת חולצה</Label>
              <select value={form.shirt_size} onChange={(e) => setField('shirt_size', e.target.value)}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                <option value="">בחר מידה</option>
                {SHIRT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {form.gender === 'זכר' && (
              <div className="flex flex-col gap-1.5">
                <Label>מידת כיפה (ס״מ)</Label>
                <select value={form.kippah_size} onChange={(e) => setField('kippah_size', e.target.value)}
                  className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                  <option value="">בחר מידה</option>
                  {KIPPAH_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}
          </div>

          {tracks.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>מסלול</Label>
              <select value={form.track_id} onChange={(e) => setField('track_id', e.target.value)}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                <option value="">בחר מסלול</option>
                {tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          )}

          {/* Parents */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>שם הורה 1</Label>
              <Input value={form.parent1_name} onChange={(e) => setField('parent1_name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>טלפון הורה 1</Label>
              <Input type="tel" dir="ltr" value={form.parent1_phone} onChange={(e) => setField('parent1_phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>שם הורה 2</Label>
              <Input value={form.parent2_name} onChange={(e) => setField('parent2_name', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>טלפון הורה 2</Label>
              <Input type="tel" dir="ltr" value={form.parent2_phone} onChange={(e) => setField('parent2_phone', e.target.value)} />
            </div>
          </div>

          {/* Primary phone selection */}
          {(form.parent1_phone || form.parent2_phone) && (
            <div className="flex flex-col gap-1.5">
              <Label>טלפון לקבלת הודעות</Label>
              <select value={form.primary_phone} onChange={(e) => setField('primary_phone', e.target.value)}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                <option value="">ברירת מחדל (הורה 1)</option>
                {form.parent1_phone && <option value={form.parent1_phone}>{form.parent1_name || 'הורה 1'} — {form.parent1_phone}</option>}
                {form.parent2_phone && <option value={form.parent2_phone}>{form.parent2_name || 'הורה 2'} — {form.parent2_phone}</option>}
              </select>
            </div>
          )}

          {/* Emergency contact */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>איש קשר חירום</Label>
              <Input value={form.emergency_contact_name} onChange={(e) => setField('emergency_contact_name', e.target.value)} placeholder="שם" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>טלפון חירום</Label>
              <Input type="tel" dir="ltr" value={form.emergency_contact_phone} onChange={(e) => setField('emergency_contact_phone', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>אימייל</Label>
            <Input type="email" dir="ltr" value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.photo_consent}
              onChange={(e) => setField('photo_consent', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#333654]"
            />
            <span className="text-sm">אני מאשר/ת פרסום תמונות הילד ברשתות החברתיות ובחומרי הפרסום של הקייטנה</span>
          </label>

          {/* Health section */}
          <div className="rounded-xl border border-[#E5E5E8] p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-[#6B6D8A] uppercase tracking-wider">מידע בריאותי</p>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_healthy}
                onChange={(e) => setField('is_healthy', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 accent-[#333654]"
              />
              <span className="text-sm">הילד/ה בריא/ה ואין הגבלות רפואיות</span>
            </label>
            {!form.is_healthy && (
              <div className="flex flex-col gap-1.5">
                <Label>בעיות בריאות</Label>
                <Textarea
                  value={form.health_issues}
                  onChange={(e) => setField('health_issues', e.target.value)}
                  placeholder="פרט את הבעיות הרפואיות..."
                  rows={2}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>אלרגיות</Label>
              <Input value={form.allergies} onChange={(e) => setField('allergies', e.target.value)} placeholder="אלרגיות מזון, תרופות..." />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תרופות קבועות</Label>
              <Input value={form.medications} onChange={(e) => setField('medications', e.target.value)} placeholder="תרופות ומינונים..." />
            </div>
          </div>

          {/* Payment */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>סטטוס תשלום</Label>
              <select value={form.payment_status} onChange={(e) => setField('payment_status', e.target.value)}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer">
                {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>שולם ₪</Label>
              <Input type="number" value={form.amount_paid} onChange={(e) => setField('amount_paid', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>לתשלום ₪</Label>
              <Input type="number" value={form.amount_due} onChange={(e) => setField('amount_due', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>הערות</Label>
            <Textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} rows={2} />
          </div>

          {/* Waiting list */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_waiting}
              onChange={(e) => setField('is_waiting', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#C8251D]"
            />
            <span className="text-sm font-semibold text-[#C8251D]">ברשימת המתנה</span>
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : isEdit ? 'עדכן' : 'הוסף'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
