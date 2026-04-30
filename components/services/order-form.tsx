'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { NetworkService } from '@/lib/types'

interface OrderFormProps {
  open: boolean
  onClose: () => void
  service: NetworkService | null
  campId: string
}

export function OrderForm({ open, onClose, service, campId }: OrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [quantity, setQuantity] = useState('1')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!service) return

    setLoading(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          camp_id: campId,
          service_id: service.id,
          quantity: Number(quantity),
          delivery_date: deliveryDate || null,
          notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('ההזמנה נשלחה בהצלחה')
      router.refresh()
      onClose()
      setQuantity('1'); setDeliveryDate(''); setNotes('')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה לא ידועה'))
    } finally {
      setLoading(false)
    }
  }

  const total = service
    ? (service.price_per_unit ?? service.price_per_child ?? 0) * Number(quantity)
    : 0

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto" dir="rtl">
        <SheetHeader className="mb-4">
          <SheetTitle>הזמנת שירות</SheetTitle>
          {service && <p className="text-sm text-muted-foreground">{service.name}</p>}
        </SheetHeader>
        {service && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">{service.name}</p>
              {service.description && <p className="text-muted-foreground mt-1">{service.description}</p>}
              <p className="mt-2">
                מחיר:{' '}
                {service.price_per_unit
                  ? `₪${service.price_per_unit} ל${service.unit_label}`
                  : service.price_per_child
                  ? `₪${service.price_per_child} לילד`
                  : 'לפי הצעת מחיר'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>כמות *</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>תאריך מבוקש</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            </div>

            {total > 0 && (
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">סה״כ משוער: ₪{total.toLocaleString()}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <Label>הערות</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="הערות נוספות..." />
            </div>

            <SheetFooter>
              <Button type="button" variant="outline" onClick={onClose}>ביטול</Button>
              <Button type="submit" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" />שולח...</> : 'שלח הזמנה'}
              </Button>
            </SheetFooter>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
