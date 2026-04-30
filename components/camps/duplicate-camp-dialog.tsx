'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { SCHOOL_YEARS } from '@/lib/constants'

interface DuplicateCampDialogProps {
  campId: string
  currentYear: string
  open: boolean
  onClose: () => void
}

export function DuplicateCampDialog({ campId, currentYear, open, onClose }: DuplicateCampDialogProps) {
  const router = useRouter()
  const nextYears = SCHOOL_YEARS.filter((y) => y > currentYear)
  const [schoolYear, setSchoolYear] = useState(nextYears[0] ?? SCHOOL_YEARS[SCHOOL_YEARS.length - 1])
  const [loading, setLoading] = useState(false)

  async function handleDuplicate() {
    setLoading(true)
    try {
      const res = await fetch(`/api/camps/${campId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_year: schoolYear }),
      })
      if (!res.ok) throw new Error(await res.text())
      const { id } = await res.json()
      toast.success('הקייטנה שוכפלה בהצלחה')
      onClose()
      router.push(`/camps/${id}`)
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה לא ידועה'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>שכפל קייטנה לשנה הבאה</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label>שנת לימודים</Label>
            <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value as typeof schoolYear)}
              className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#00B1AE] focus:outline-none cursor-pointer w-full">
              {(nextYears.length > 0 ? nextYears : SCHOOL_YEARS).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-muted-foreground">
            יועתקו: שם, כתובת, מסלולים ויעד נרשמים.
            <br />
            לא יועתקו: נרשמים, כספים, צוות ומסמכים.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>ביטול</Button>
          <Button onClick={handleDuplicate} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" />מעתיק...</> : 'שכפל קייטנה'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
