'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { X, RotateCcw, Printer, Info, ChevronDown } from 'lucide-react'

type CampType = 'regular' | 'wheels'

function N(v: string | number): number { return Math.max(0, parseFloat(String(v)) || 0) }
function fmt(n: number): string { return '₪' + Math.round(n).toLocaleString('he-IL') }

interface AutoItem {
  id: string
  label: string
  kind: 'auto'
  defaultRate: number
  isFixed?: boolean
  compute: (c: number, d: number, ct: CampType, rate: number) => number
  countStr: (c: number, d: number, ct: CampType) => string
  isNA?: (ct: CampType) => boolean
}

interface InputItem {
  id: string
  label: string
  kind: 'input'
  defaultRate?: number
  computeWheels?: (c: number, d: number, rate: number) => number
  countWheels?: (c: number, d: number) => string
}

interface ManualItem {
  id: string
  label: string
  kind: 'manual'
}

type BudgetItem = AutoItem | InputItem | ManualItem

const ITEMS: BudgetItem[] = [
  {
    id: 'staff', label: 'שכר צוות', kind: 'auto', defaultRate: 2000,
    compute: (c, _d, _ct, rate) => Math.ceil(c / 10) * rate,
    countStr: (c) => `${Math.ceil(c / 10)} אנשי צוות`,
  },
  {
    id: 'insurance', label: 'ביטוח', kind: 'auto', defaultRate: 40,
    compute: (c, _d, _ct, rate) => c * rate,
    countStr: (c) => `${c} חניכים`,
  },
  {
    id: 'breakfast', label: 'ארוחת בוקר', kind: 'auto', defaultRate: 5,
    compute: (c, d, _ct, rate) => c * d * rate,
    countStr: (c, d) => `${c} חניכים × ${d} ימים`,
  },
  {
    id: 'lunch', label: 'ארוחת צהריים', kind: 'auto', defaultRate: 20,
    compute: (c, d, _ct, rate) => c * d * rate,
    countStr: (c, d) => `${c} חניכים × ${d} ימים`,
  },
  {
    id: 'arts', label: 'חומרי יצירה, פעילות ואווירה', kind: 'auto', defaultRate: 5,
    compute: (c, d, ct, rate) => ct === 'wheels' ? 0 : c * d * rate,
    countStr: (c, d, ct) => ct === 'wheels' ? '— לא רלוונטי' : `${c} חניכים × ${d} ימים`,
    isNA: (ct) => ct === 'wheels',
  },
  {
    id: 'shirts', label: 'חולצות', kind: 'auto', defaultRate: 20,
    compute: (c, _d, _ct, rate) => c * rate,
    countStr: (c) => `${c} חניכים`,
  },
  {
    id: 'regfee', label: 'רישום לקייטנה', kind: 'auto', defaultRate: 40,
    compute: (c, _d, _ct, rate) => c * rate,
    countStr: (c) => `${c} חניכים`,
  },
  {
    id: 'printing', label: 'הדפסות נוספות', kind: 'auto', defaultRate: 500, isFixed: true,
    compute: (_c, _d, _ct, rate) => rate,
    countStr: () => 'סכום קבוע',
  },
  {
    id: 'workshops', label: 'סדנאות', kind: 'input',
    defaultRate: 0,
    computeWheels: (_c, _d, rate) => rate,
    countWheels: () => 'סכום קבוע',
  },
  {
    id: 'trips', label: 'טיולים', kind: 'input',
    defaultRate: 80,
    computeWheels: (c, d, rate) => d * c * rate,
    countWheels: (c, d) => `${d} ימים × ${c} חניכים`,
  },
  { id: 'photographer', label: 'צלם', kind: 'manual' },
  { id: 'misc', label: 'שונות', kind: 'manual' },
  { id: 'cleaning', label: 'ניקיון', kind: 'manual' },
  { id: 'electricity', label: 'חשמל', kind: 'manual' },
  { id: 'staff_treats', label: 'פינוקים לצוות', kind: 'manual' },
]

const ALL_IDS = ITEMS.map(i => i.id)

const LS_KEY = 'kaitanot_budget_sim_v3'

interface SimState {
  campType: CampType
  children: string
  days: string
  staffCount: string
  pricePerChild: string
  rates: Record<string, string>
  inputAmounts: Record<string, string>
  removedItems: string[]
}

const DEFAULT: SimState = {
  campType: 'regular',
  children: '30',
  days: '10',
  staffCount: '',
  pricePerChild: '',
  rates: {},
  inputAmounts: {},
  removedItems: [],
}

function loadState(): SimState {
  if (typeof window === 'undefined') return DEFAULT
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch { return DEFAULT }
}

function saveState(s: SimState) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(s))
}

export function BudgetSimulator({ campDays = 0 }: { campDays?: number }) {
  const [state, setState] = useState<SimState>(() => {
    const loaded = loadState()
    if (campDays > 0 && loaded.days === DEFAULT.days) loaded.days = String(campDays)
    return loaded
  })
  const [showRestore, setShowRestore] = useState(false)
  const restoreRef = useRef<HTMLDivElement>(null)

  const { campType, children, days, staffCount, pricePerChild, rates, inputAmounts, removedItems } = state
  const c = N(children)
  const d = N(days)
  const staffNum = N(staffCount) > 0 ? N(staffCount) : Math.ceil(c / 10)

  useEffect(() => { saveState(state) }, [state])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (restoreRef.current && !restoreRef.current.contains(e.target as Node)) {
        setShowRestore(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function update(patch: Partial<SimState>) {
    setState(prev => ({ ...prev, ...patch }))
  }

  function setRate(id: string, val: string) {
    update({ rates: { ...rates, [id]: val } })
  }

  function resetRate(id: string) {
    const next = { ...rates }
    delete next[id]
    update({ rates: next })
  }

  function setInputAmount(id: string, val: string) {
    update({ inputAmounts: { ...inputAmounts, [id]: val } })
  }

  function removeItem(id: string) {
    update({ removedItems: [...removedItems.filter(r => r !== id), id] })
  }

  function restoreItem(id: string) {
    update({ removedItems: removedItems.filter(r => r !== id) })
    setShowRestore(false)
  }

  function resetAll() {
    setState({ ...DEFAULT, campType, children, days })
  }

  const rows = useMemo(() => {
    return ITEMS.map(item => {
      const isRemoved = removedItems.includes(item.id)

      if (item.kind === 'auto') {
        const defaultRate = item.defaultRate
        const rateVal = rates[item.id] !== undefined ? rates[item.id] : String(defaultRate)
        const rate = N(rateVal)
        const isNA = item.isNA?.(campType) ?? false
        const autoAmt = item.id === 'staff'
          ? (isNA ? 0 : staffNum * rate)
          : (isNA ? 0 : item.compute(c, d, campType, rate))
        const countStr = item.id === 'staff'
          ? `${staffNum} אנשי צוות`
          : item.countStr(c, d, campType)
        const hasCustomRate = rates[item.id] !== undefined
        return { item, rate, rateVal, autoAmt, finalAmt: isRemoved ? 0 : autoAmt, countStr, hasCustomRate, isNA, isRemoved }
      }

      if (item.kind === 'input') {
        const isWheels = campType === 'wheels'
        if (isWheels && item.computeWheels) {
          const defaultRate = item.defaultRate ?? 0
          const rateVal = rates[item.id] !== undefined ? rates[item.id] : String(defaultRate)
          const rate = N(rateVal)
          const autoAmt = item.computeWheels(c, d, rate)
          const countStr = item.countWheels ? item.countWheels(c, d) : ''
          const hasCustomRate = rates[item.id] !== undefined
          return { item, rate, rateVal, autoAmt, finalAmt: isRemoved ? 0 : autoAmt, countStr, hasCustomRate, isNA: false, isRemoved }
        }
        // regular: manual input
        const finalAmt = N(inputAmounts[item.id] ?? '0')
        return { item, rate: 0, rateVal: '', autoAmt: 0, finalAmt: isRemoved ? 0 : finalAmt, hasCustomRate: false, isNA: false, isRemoved }
      }

      // manual
      const finalAmt = N(inputAmounts[item.id] ?? '0')
      return { item, rate: 0, rateVal: '', autoAmt: 0, finalAmt: isRemoved ? 0 : finalAmt, hasCustomRate: false, isNA: false, isRemoved }
    })
  }, [state, c, d, campType, staffNum, removedItems, rates, inputAmounts])

  const total = rows.filter(r => !r.isRemoved).reduce((s, r) => s + r.finalAmt, 0)
  const income = N(pricePerChild) * c
  const balance = income - total
  const removedDefs = ITEMS.filter(i => removedItems.includes(i.id))

  const rateCls = 'w-16 rounded border border-[#E5E5E8] px-1.5 py-0.5 text-xs font-bold text-left focus:outline-none focus:ring-1 focus:ring-[#F8AD1D] bg-[#FFFBEB]'

  return (
    <div className="flex flex-col gap-5" dir="rtl">

      {/* Camp type toggle */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-[#F5F5F3] p-1">
          {(['regular', 'wheels'] as CampType[]).map(ct => {
            const isActive = campType === ct
            return (
              <button key={ct} type="button"
                onClick={() => update({ campType: ct })}
                className={[
                  'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                  isActive && ct === 'regular' ? 'bg-[#F8AD1D] text-white shadow-sm' :
                  isActive && ct === 'wheels'  ? 'bg-[#333654] text-white shadow-sm' :
                  'bg-transparent text-[#9091A8]',
                ].join(' ')}>
                {ct === 'regular' ? '🏕 קייטנה רגילה' : '🚌 קייטנה על גלגלים'}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E5E8] text-sm text-[#6B6D8A] hover:bg-[#F8F8FA] transition-colors print:hidden">
          <Printer className="h-4 w-4" />
          הדפסה
        </button>
      </div>

      {/* Note */}
      <div className="flex items-start gap-2 rounded-xl bg-[#FFFBEB] border border-[#F8AD1D]/30 px-4 py-3">
        <Info className="h-4 w-4 text-[#F8AD1D] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#92400E]">החישובים הם הערכה כללית בלבד. ניתן לערוך את התעריפים בעמודת הנוסחה ישירות.</p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#6B6D8A]">מספר חניכים</span>
          <input type="number" min="1" value={children}
            onChange={e => update({ children: e.target.value })}
            className="rounded-lg border border-[#E5E5E8] px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#6B6D8A]">מספר ימי קייטנה</span>
          <input type="number" min="1" value={days}
            onChange={e => update({ days: e.target.value })}
            className="rounded-lg border border-[#E5E5E8] px-3 py-2.5 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]" />
        </label>
      </div>

      {/* Budget table */}
      <div className="rounded-2xl border border-[#E5E5E8] bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8F8FA] border-b border-[#E5E5E8]">
              <th className="text-right px-4 py-3 font-semibold text-[#6B6D8A] w-[30%]">סעיף תקציב</th>
              <th className="text-right px-4 py-3 font-semibold text-[#6B6D8A] hidden sm:table-cell">נוסחה (ניתן לערוך תעריפים)</th>
              <th className="text-left px-4 py-3 font-semibold text-[#6B6D8A] w-28">סכום (₪)</th>
              <th className="w-8 print:hidden"><span className="sr-only">פעולות</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const { item, finalAmt, isRemoved, isNA } = row

              const isInputRegular = item.kind === 'input' && campType === 'regular'
              const isManual = item.kind === 'manual'
              const isInputWheels = item.kind === 'input' && campType === 'wheels'
              const needsAmountInput = isInputRegular || isManual

              return (
                <tr key={item.id}
                  className={[
                    'border-t border-[#F0F0F0] transition-all group',
                    isRemoved ? 'opacity-35 bg-[#F8F8FA]' : idx % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]',
                  ].join(' ')}>

                  {/* Label */}
                  <td className="px-4 py-3 font-medium text-[#333654]">
                    {item.label}
                    {'hasCustomRate' in row && row.hasCustomRate && (
                      <span className="mr-1.5 text-[10px] text-[#F8AD1D] font-normal">✏ מותאם</span>
                    )}
                  </td>

                  {/* Formula column */}
                  <td className="px-4 py-2.5 text-xs hidden sm:table-cell">
                    {isNA ? (
                      <span className="text-[#CBD5E1]">— לא רלוונטי</span>
                    ) : needsAmountInput ? (
                      <span className="text-[#9091A8]">הזנה ידנית</span>
                    ) : item.kind === 'auto' ? (
                      <span className="flex items-center gap-1 flex-wrap">
                        {item.id === 'staff' ? (
                          <span className="flex items-center gap-1">
                            <input
                              type="number" min="1"
                              aria-label="מספר אנשי צוות"
                              value={staffCount || String(Math.ceil(c / 10))}
                              disabled={isRemoved}
                              onChange={e => update({ staffCount: e.target.value })}
                              className={rateCls}
                            />
                            <span className="text-[#6B6D8A]">אנשי צוות × ₪</span>
                          </span>
                        ) : !item.isFixed ? (
                          <span className="text-[#6B6D8A]">{'countStr' in row ? row.countStr : ''} × ₪</span>
                        ) : (
                          <span className="text-[#6B6D8A]">סכום קבוע: ₪</span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <input
                            type="number" min="0"
                            aria-label={`תעריף ${item.label}`}
                            value={row.rateVal}
                            disabled={isRemoved}
                            onChange={e => setRate(item.id, e.target.value)}
                            className={rateCls}
                          />
                          {row.hasCustomRate && (
                            <button type="button" title="אפס לברירת מחדל"
                              onClick={() => resetRate(item.id)}
                              className="text-[#9091A8] hover:text-[#F8AD1D] transition-colors print:hidden">
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                        {!isNA && (
                          <span className="flex items-center gap-1">
                            <span className="text-[#333654] font-semibold">= {fmt(row.autoAmt)}</span>
                            {item.id === 'staff' && staffCount && (
                              <button type="button" title="אפס כמות צוות לאוטומטי"
                                onClick={() => update({ staffCount: '' })}
                                className="text-[#9091A8] hover:text-[#F8AD1D] transition-colors print:hidden">
                                <RotateCcw className="h-3 w-3" />
                              </button>
                            )}
                          </span>
                        )}
                      </span>
                    ) : isInputWheels ? (
                      // wheels input item with auto-calc
                      <span className="flex items-center gap-1 flex-wrap">
                        {'countStr' in row && row.countStr && (
                          <span className="text-[#6B6D8A]">{row.countStr as string} × ₪</span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <input
                            type="number" min="0"
                            aria-label={`תעריף ${item.label}`}
                            value={row.rateVal}
                            disabled={isRemoved}
                            onChange={e => setRate(item.id, e.target.value)}
                            className={rateCls}
                          />
                          {row.hasCustomRate && (
                            <button type="button" title="אפס לברירת מחדל"
                              onClick={() => resetRate(item.id)}
                              className="text-[#9091A8] hover:text-[#F8AD1D] transition-colors print:hidden">
                              <RotateCcw className="h-3 w-3" />
                            </button>
                          )}
                        </span>
                        <span className="text-[#333654] font-semibold">= {fmt(row.autoAmt)}</span>
                      </span>
                    ) : null}
                  </td>

                  {/* Amount */}
                  <td className="px-3 py-2.5 text-left">
                    {needsAmountInput ? (
                      <input
                        type="number" min="0"
                        aria-label={item.label}
                        value={inputAmounts[item.id] ?? ''}
                        placeholder="0"
                        disabled={isRemoved}
                        onChange={e => setInputAmount(item.id, e.target.value)}
                        className="w-full rounded-lg border border-[#E5E5E8] px-2 py-1.5 text-sm font-bold text-left focus:outline-none focus:ring-2 focus:ring-[#F8AD1D] disabled:opacity-40"
                      />
                    ) : isNA ? (
                      <span className="text-[#CBD5E1] font-semibold px-2">—</span>
                    ) : (
                      <span className={['font-bold px-2', isRemoved ? 'text-[#CCC]' : 'text-[#1A1B2E]'].join(' ')}>
                        {fmt(finalAmt)}
                      </span>
                    )}
                  </td>

                  {/* Remove button */}
                  <td className="pr-3 py-2.5 print:hidden">
                    {isRemoved ? (
                      <button type="button" title="שחזר סעיף"
                        onClick={() => restoreItem(item.id)}
                        className="flex items-center justify-center w-6 h-6 rounded-full bg-[#E0F7F7] text-[#00B1AE] hover:bg-[#00B1AE] hover:text-white transition-colors">
                        <RotateCcw className="h-3 w-3" />
                      </button>
                    ) : (
                      <button type="button" title="הסר סעיף"
                        onClick={() => removeItem(item.id)}
                        className="flex items-center justify-center w-6 h-6 rounded-full text-[#CBD5E1] hover:bg-red-50 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>

          {/* Total row */}
          <tfoot>
            <tr className="border-t-2 border-[#E5E5E8] bg-[#1A1B2E]">
              <td colSpan={2} className="px-4 py-4 font-black text-white text-base">סה״כ תקציב</td>
              <td className="px-3 py-4 text-left font-black text-xl text-[#F8AD1D]">{fmt(total)}</td>
              <td className="print:hidden" />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Income / per-child section */}
      <div className="rounded-2xl border border-[#E5E5E8] bg-white overflow-hidden">
        <div className="bg-[#F8F8FA] border-b border-[#E5E5E8] px-4 py-3">
          <p className="text-sm font-bold text-[#333654]">תקבולים והכנסות</p>
        </div>
        <div className="px-4 py-4 flex flex-col gap-3">
          <label className="flex items-center gap-3">
            <span className="text-sm font-medium text-[#6B6D8A] flex-1">מחיר רישום לקייטנה לילד (₪)</span>
            <input
              type="number" min="0"
              value={pricePerChild}
              placeholder="0"
              onChange={e => update({ pricePerChild: e.target.value })}
              className="w-28 rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm font-bold text-left focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]"
            />
          </label>

          {N(pricePerChild) > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t border-[#F0F0F0]">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B6D8A]">סה״כ הכנסות ({c} ילדים × {fmt(N(pricePerChild))})</span>
                <span className="font-bold text-[#1A1B2E]">{fmt(income)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#6B6D8A]">סה״כ הוצאות</span>
                <span className="font-bold text-[#1A1B2E]">{fmt(total)}</span>
              </div>
              <div className={[
                'flex justify-between items-center text-sm font-black rounded-lg px-3 py-2.5',
                balance >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600',
              ].join(' ')}>
                <span>{balance >= 0 ? 'עודף' : 'גירעון'}</span>
                <span>{balance >= 0 ? '+' : ''}{fmt(balance)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="flex items-center gap-3 flex-wrap print:hidden">

        {/* Restore menu */}
        {removedDefs.length > 0 && (
          <div className="relative" ref={restoreRef}>
            <button type="button"
              onClick={() => setShowRestore(v => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E5E5E8] text-sm text-[#6B6D8A] hover:bg-[#F8F8FA] transition-colors">
              <RotateCcw className="h-4 w-4" />
              שחזר סעיפים ({removedDefs.length})
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {showRestore && (
              <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-xl border border-[#E5E5E8] shadow-lg min-w-[200px] overflow-hidden">
                <p className="px-3 py-2 text-xs font-semibold text-[#9091A8] border-b border-[#F0F0F0]">סעיפים שהוסרו</p>
                {removedDefs.map(item => (
                  <button key={item.id} type="button"
                    onClick={() => restoreItem(item.id)}
                    className="w-full text-right px-3 py-2.5 text-sm text-[#333654] hover:bg-[#F8F8FA] flex items-center gap-2 transition-colors">
                    <RotateCcw className="h-3.5 w-3.5 text-[#00B1AE]" />
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reset all */}
        <button type="button" onClick={resetAll}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#9091A8] hover:text-[#6B6D8A] transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />
          אפס הכל
        </button>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .budget-print-area, .budget-print-area * { visibility: visible; }
        }
      `}</style>
    </div>
  )
}
