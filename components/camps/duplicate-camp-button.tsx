'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Copy } from 'lucide-react'
import { DuplicateCampDialog } from './duplicate-camp-dialog'

interface DuplicateCampButtonProps {
  campId: string
  schoolYear: string
}

export function DuplicateCampButton({ campId, schoolYear }: DuplicateCampButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Copy className="h-4 w-4" />
        שכפל לשנה הבאה
      </Button>
      <DuplicateCampDialog
        campId={campId}
        currentYear={schoolYear}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
