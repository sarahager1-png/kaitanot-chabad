'use client'

import { useState } from 'react'
import { Plus, Printer, Users, Gift } from 'lucide-react'
import { VoucherPrintModal } from './voucher-print-modal'
import { VoucherAdminForm } from './voucher-admin-form'
import type { VoucherType } from '@/lib/types'

const audienceColor: Record<string, string> = {
  'חניכים': 'bg-[#E5F4EC] text-[#1A7A4A]',
  'צוות':   'bg-[#FEF3E2] text-[#B45309]',
  'הכל':    'bg-[#EEF2FF] text-[#4F46E5]',
}

const DEFAULT_VOUCHERS: VoucherType[] = [
  {
    id: '__subs__',
    name: 'שוברים לסדנאות',
    description: 'סדנאות העשרה ייחודיות לחניכים',
    price: 80,
    emoji: '🎨',
    expiry_date: '31/08/2025',
    audience: 'חניכים',
    is_active: true,
    created_at: '',
  },
  {
    id: '__party__',
    name: 'מסיבת צוות',
    description: 'ערב הוקרה וחגיגה לצוות הקייטנה',
    price: null,
    emoji: '🎉',
    expiry_date: '31/08/2025',
    audience: 'צוות',
    is_active: true,
    created_at: '',
  },
]

interface VouchersClientProps {
  voucherTypes: VoucherType[]
  registrantCount: number
  campId: string
  isAdmin: boolean
}

export function VouchersClient({ voucherTypes, registrantCount, campId, isAdmin }: VouchersClientProps) {
  const [printVoucher, setPrintVoucher] = useState<VoucherType | null>(null)
  const [adminOpen, setAdminOpen] = useState(false)

  const displayed = voucherTypes.length > 0 ? voucherTypes : DEFAULT_VOUCHERS

  function defaultCopies(v: VoucherType) {
    return v.audience === 'חניכים' ? registrantCount || 1 : 1
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-xl bg-[#F5F5F3] px-4 py-2.5">
          <Users className="h-4 w-4 text-[#6B6D8A]" />
          <span className="text-sm text-[#6B6D8A]">
            רשומים בקייטנה: <span className="font-black text-[#333654]">{registrantCount}</span>
          </span>
        </div>
        {isAdmin && (
          <button
            onClick={() => setAdminOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#444668] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            הוסף סוג שובר
          </button>
        )}
      </div>

      {/* Voucher grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {displayed.map((v) => (
          <div
            key={v.id}
            className="flex flex-col rounded-xl border-2 border-[#00B1AE]/30 bg-gradient-to-br from-[#f0fdfb] to-white shadow-sm hover:border-[#00B1AE] hover:shadow-md transition-all overflow-hidden"
          >
            {/* Card header */}
            <div className="flex items-start justify-between p-4 pb-2">
              <span className="text-4xl">{v.emoji}</span>
              <span className={['rounded-full px-2.5 py-0.5 text-xs font-bold', audienceColor[v.audience] ?? 'bg-gray-100 text-gray-600'].join(' ')}>
                {v.audience}
              </span>
            </div>

            {/* Card body */}
            <div className="flex flex-1 flex-col gap-1 px-4 pb-4">
              <h3 className="font-black text-[#333654]">{v.name}</h3>
              {v.description && (
                <p className="text-xs text-[#6B6D8A] leading-relaxed">{v.description}</p>
              )}

              <div className="mt-auto flex items-center justify-between pt-3 border-t border-[#E5E5E8] mt-3">
                <div className="flex flex-col gap-0.5">
                  {v.price != null && (
                    <span className="text-sm font-black text-[#00B1AE]">{v.price}₪</span>
                  )}
                  <span className="text-[11px] text-gray-400">
                    {defaultCopies(v)} עותקים
                  </span>
                </div>
                <button
                  onClick={() => setPrintVoucher(v)}
                  className="flex items-center gap-1.5 rounded-lg bg-[#00B1AE] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006A82] transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" />
                  הדפס שוברים
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state (when DB is empty, defaults are shown — this won't show) */}
      {displayed.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-dashed border-[#E5E5E8]">
          <Gift className="h-8 w-8 text-[#9091A8]" />
          <p className="text-sm text-[#6B6D8A]">אין סוגי שוברים עדיין</p>
        </div>
      )}

      {printVoucher && (
        <VoucherPrintModal
          voucher={printVoucher}
          defaultCount={defaultCopies(printVoucher)}
          onClose={() => setPrintVoucher(null)}
        />
      )}
      <VoucherAdminForm open={adminOpen} onClose={() => setAdminOpen(false)} />
    </div>
  )
}
