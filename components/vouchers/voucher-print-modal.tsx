'use client'

import { useState, useRef } from 'react'
import { X, Printer } from 'lucide-react'
import Image from 'next/image'
import type { VoucherType } from '@/lib/types'

interface VoucherPrintModalProps {
  voucher: VoucherType
  defaultCount: number
  onClose: () => void
}

export function VoucherPrintModal({ voucher, defaultCount, onClose }: VoucherPrintModalProps) {
  const [recipientName, setRecipientName] = useState('')
  const [notes, setNotes] = useState('')
  const [expiryDate, setExpiryDate] = useState(
    voucher.expiry_date ?? '31/08/2025'
  )
  const [copies, setCopies] = useState(defaultCount || 1)
  const printRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    const style = document.createElement('style')
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        #voucher-print-area, #voucher-print-area * { visibility: visible !important; }
        #voucher-print-area { position: fixed; inset: 0; display: flex; flex-wrap: wrap; gap: 12px; padding: 16px; align-content: flex-start; }
      }
    `
    document.head.appendChild(style)

    const area = document.getElementById('voucher-print-area')
    if (!area) return

    // Build N copies
    const single = area.querySelector('.voucher-single')?.outerHTML ?? ''
    area.innerHTML = Array(copies).fill(single).join('')

    window.print()

    // Restore
    document.head.removeChild(style)
    area.innerHTML = single
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#333654]">מילוי שובר — {voucher.name}</h2>
            <span className="text-xl">{voucher.emoji}</span>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Voucher preview */}
        <div className="px-5 py-4">
          <div id="voucher-print-area">
            <div
              className="voucher-single rounded-xl border-2 border-[#00B1AE] bg-gradient-to-br from-[#f0fdfb] to-white p-4 shadow-sm"
              ref={printRef}
            >
              {/* Top row: logo */}
              <div className="mb-3 flex justify-end">
                <Image src="/logo-chabad.png" alt="רשת חינוך חב״ד" width={80} height={36} className="object-contain" />
              </div>

              {/* Title */}
              <div className="mb-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <h3 className="text-lg font-black text-[#333654]">{voucher.name}</h3>
                  <span className="text-2xl">{voucher.emoji}</span>
                </div>
                {voucher.description && (
                  <p className="mt-0.5 text-xs text-gray-500">{voucher.description}</p>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-[#00B1AE]">לכבוד</p>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="שם המקבל / ת..."
                  className="w-full border-0 border-b border-dashed border-[#00B1AE] bg-transparent pb-1 text-sm font-semibold text-[#333654] placeholder:text-gray-300 focus:border-[#00B1AE] focus:outline-none"
                  dir="rtl"
                />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="הערה / פרטים נוספים (אופציונלי)..."
                  className="w-full border-0 border-b border-dashed border-gray-200 bg-transparent pb-1 text-xs text-gray-500 placeholder:text-gray-300 focus:border-gray-400 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* Footer row */}
              <div className="mt-4 flex items-end justify-between">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-[#333654]">קייטנת חב״ד</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">בתוקף עד:</span>
                    <input
                      type="text"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-20 border-0 border-b border-dashed border-gray-200 bg-transparent text-[10px] text-gray-400 focus:outline-none"
                      dir="ltr"
                    />
                  </div>
                </div>
                {voucher.price != null && (
                  <span className="rounded-full bg-[#00B1AE] px-3 py-1 text-sm font-black text-white">
                    {voucher.price}₪
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="mt-3 text-center text-xs text-gray-400">
            לחצ/י על שדות הטקסט בשובר כדי למלא · אפשר להשאיר ריק להדפסה עם מקומות ריקים
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4">
          <span className="text-sm text-gray-500">
            {copies} עותקים יודפסו
          </span>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
              ביטול
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-lg bg-[#00B1AE] px-4 py-2 text-sm font-bold text-white hover:bg-[#006A82] transition-colors"
            >
              <Printer className="h-4 w-4" />
              הדפס {copies} שוברים
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
