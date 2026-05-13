'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Users, Save, Loader2, CalendarDays, MapPin, Tent, Bus } from 'lucide-react'
import { toast } from 'sonner'
import type { Budget } from '@/lib/types'

interface SimulationsClientProps {
  budgets: Budget[]
  campId: string
  registrationGoal: number
  registrantCount: number
}

type BudgetType = 'קבועה' | 'לילד' | 'ליום'

interface SimItem {
  id: string
  category: string
  budget_type: BudgetType
  amount: number
  isFormula?: boolean
  formulaHint?: string
}

// Items whose budget_type is fixed and cannot be changed by the user
const LOCKED_TYPE_IDS = new Set(['staff', 'breakfast', 'lunch', 'activities', 'trips'])

const DEFAULT_ITEMS: SimItem[] = [
  { id: 'staff',        category: 'שכר צוות',                   budget_type: 'קבועה', amount: 0,   formulaHint: 'נוסחה: ÷10 × ₪2,000' },
  { id: 'insurance',   category: 'ביטוח',                       budget_type: 'לילד',  amount: 40  },
  { id: 'breakfast',   category: 'ארוחת בוקר',                  budget_type: 'ליום',  amount: 5   },
  { id: 'lunch',       category: 'ארוחת צהריים',                 budget_type: 'ליום',  amount: 20  },
  { id: 'activities',  category: 'חומרי יצירה, פעילות ואווירה', budget_type: 'ליום',  amount: 5   },
  { id: 'shirts',      category: 'חולצות',                      budget_type: 'לילד',  amount: 20  },
  { id: 'printing',    category: 'הדפסות',                      budget_type: 'קבועה', amount: 500 },
  { id: 'trips',       category: 'טיולים',                      budget_type: 'לילד',  amount: 0,   isFormula: true, formulaHint: 'כמות טיולים × ₪80' },
  { id: 'photographer',category: 'צלם',                         budget_type: 'קבועה', amount: 0   },
  { id: 'misc',        category: 'שונות',                       budget_type: 'קבועה', amount: 0   },
  { id: 'cleaning',    category: 'ניקיון',                      budget_type: 'קבועה', amount: 0   },
  { id: 'electricity', category: 'חשמל',                        budget_type: 'קבועה', amount: 0   },
  { id: 'staff-perks', category: 'פינוקים לצוות',               budget_type: 'קבועה', amount: 0   },
]

const EXCLUDED_CATEGORIES = new Set(['שכר מדריכים'])

function buildItems(budgets: Budget[]): SimItem[] {
  if (budgets.length === 0) return DEFAULT_ITEMS
  const fromDb = budgets
    .filter(b => !EXCLUDED_CATEGORIES.has(b.category))
    .map(b => ({
      id: b.id,
      category: b.category,
      budget_type: (b.budget_type ?? 'קבועה') as BudgetType,
      amount: b.planned_amount,
    }))
  // merge: keep formula items from defaults, replace/add DB items
  const merged = [...DEFAULT_ITEMS.filter(d => d.isFormula)]
  for (const dbItem of fromDb) {
    const existing = DEFAULT_ITEMS.find(d => d.category === dbItem.category)
    if (existing?.isFormula) continue  // formula items not stored in DB
    merged.push(dbItem)
  }
  // add any default non-formula items not in DB
  for (const def of DEFAULT_ITEMS.filter(d => !d.isFormula)) {
    if (!merged.find(m => m.category === def.category)) merged.push(def)
  }
  return merged
}

export function SimulationsClient({ budgets, campId, registrationGoal, registrantCount }: SimulationsClientProps) {
  const router = useRouter()
  const [mode, setMode] = useState<'regular' | 'on-wheels'>('regular')
  const [childCount, setChildCount] = useState(registrationGoal > 0 ? registrationGoal : registrantCount || 50)
  const [campDays, setCampDays] = useState(10)
  const [numTrips, setNumTrips] = useState(1)
  const [margin, setMargin] = useState(10)
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<SimItem[]>(() => buildItems(budgets))

  const effectiveTrips = mode === 'on-wheels' ? campDays : numTrips

  const staffFormula = Math.ceil(childCount / 10) * 2000

  function getAmount(item: SimItem): number {
    if (item.id === 'staff') return item.amount > 0 ? item.amount : staffFormula
    if (item.id === 'trips') return 80 * effectiveTrips
    if (item.id === 'activities' && mode === 'on-wheels') return 0
    return item.amount
  }

  function setAmount(id: string, val: number) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, amount: val } : it))
  }

  function setType(id: string, type: BudgetType) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, budget_type: type } : it))
  }

  // Totals
  const fixedTotal    = items.filter(it => it.budget_type === 'קבועה').reduce((s, it) => s + getAmount(it), 0)
  const perChildTotal = items.filter(it => it.budget_type === 'לילד').reduce((s, it) => s + getAmount(it), 0)
  const perDayTotal   = items.filter(it => it.budget_type === 'ליום').reduce((s, it) => s + getAmount(it), 0)

  const fixedPerChild   = childCount > 0 ? fixedTotal / childCount : 0
  const dailyPerChild   = perDayTotal * campDays
  const minPrice        = fixedPerChild + perChildTotal + dailyPerChild
  const withMargin      = minPrice * (1 + margin / 100)
  const withOverhead    = withMargin / 0.95   // 5% to network, so camp needs to charge 100/95 of costs

  async function save() {
    setSaving(true)
    try {
      const saveable = items.filter(it => !it.isFormula)
      await Promise.all(saveable.map(it =>
        fetch('/api/budgets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ camp_id: campId, category: it.category, planned_amount: it.amount, budget_type: it.budget_type }),
        })
      ))
      toast.success('תקציב נשמר')
      router.refresh()
    } catch { toast.error('שגיאה בשמירה') }
    finally { setSaving(false) }
  }

  const typeOptions: BudgetType[] = ['קבועה', 'לילד', 'ליום']
  const typeLabels: Record<BudgetType, string> = { 'קבועה': 'קבועה', 'לילד': 'לילד', 'ליום': 'ליום' }

  return (
    <div className="flex flex-col gap-5">

      {/* Mode toggle */}
      <div className="flex gap-2 rounded-2xl bg-white border border-[#E5E5E8] p-1.5 shadow-sm w-fit">
        {([
          { key: 'regular',   label: 'קייטנה רגילה',      icon: Tent, desc: 'יצירה + טיולים נפרדים' },
          { key: 'on-wheels', label: 'קייטנה על גלגלים', icon: Bus,  desc: 'טיול בכל יום, ללא יצירה' },
        ] as const).map(m => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            className={[
              'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all',
              mode === m.key
                ? 'bg-[#333654] text-white shadow-md'
                : 'text-[#6B6D8A] hover:bg-[#F5F5F3] hover:text-[#333654]',
            ].join(' ')}
          >
            <m.icon className="h-4 w-4 shrink-0" />
            <div className="text-right">
              <div>{m.label}</div>
              <div className={['text-[10px] font-normal', mode === m.key ? 'text-white/60' : 'text-[#9091A8]'].join(' ')}>{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Children */}
        <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 flex flex-col gap-2">
          <label className="text-xs font-bold text-[#6B6D8A] flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />מספר ילדים</label>
          <input type="range" min={1} max={500} step={1} value={childCount} onChange={e => setChildCount(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#333654]" />
          <div className="flex justify-between text-xs text-[#9091A8]">
            <span>1</span><span className="font-black text-[#333654] text-base">{childCount}</span><span>500</span>
          </div>
          {registrantCount > 0 && <p className="text-xs text-[#9091A8]">{registrantCount} רשומים כרגע</p>}
        </div>

        {/* Days */}
        <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 flex flex-col gap-2">
          <label className="text-xs font-bold text-[#6B6D8A] flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />ימי קייטנה</label>
          <input type="range" min={1} max={30} step={1} value={campDays} onChange={e => setCampDays(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#00B1AE]" />
          <div className="flex justify-between text-xs text-[#9091A8]">
            <span>1</span><span className="font-black text-[#00B1AE] text-base">{campDays}</span><span>30</span>
          </div>
        </div>

        {/* Trips */}
        {mode === 'on-wheels' ? (
          <div className="rounded-xl bg-[#333654] border border-[#333654] p-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-white/70 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />טיולים (אוטומטי)</label>
            <div className="flex-1 flex items-center justify-center">
              <span className="font-black text-white text-xl">{campDays} טיולים</span>
            </div>
            <p className="text-xs text-white/50">טיול בכל יום · ₪{(80 * campDays).toLocaleString()} לילד</p>
          </div>
        ) : (
          <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 flex flex-col gap-2">
            <label className="text-xs font-bold text-[#6B6D8A] flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />מספר טיולים</label>
            <input type="range" min={0} max={5} step={1} value={numTrips} onChange={e => setNumTrips(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#F68E75]" />
            <div className="flex justify-between text-xs text-[#9091A8]">
              <span>0</span><span className="font-black text-[#F68E75] text-base">{numTrips}</span><span>5</span>
            </div>
            {numTrips > 0 && <p className="text-xs text-[#9091A8]">₪{(80 * numTrips).toLocaleString()} לילד</p>}
          </div>
        )}

        {/* Margin */}
        <div className="rounded-xl bg-white border border-[#E5E5E8] p-4 flex flex-col gap-2">
          <label className="text-xs font-bold text-[#6B6D8A] flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" />מרווח רווח %</label>
          <input type="range" min={0} max={50} step={1} value={margin} onChange={e => setMargin(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-[#F8AD1D]" />
          <div className="flex justify-between text-xs text-[#9091A8]">
            <span>0%</span><span className="font-black text-[#F8AD1D] text-base">{margin}%</span><span>50%</span>
          </div>
        </div>
      </div>

      {/* Result cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'הוצאות קבועות (סה"כ)',  value: fixedTotal,   color: 'text-[#C8251D]', bg: 'bg-[#FDE8E7]', sub: `÷${childCount} = ₪${Math.ceil(fixedPerChild)}/ילד` },
          { label: 'הוצאות לילד',            value: perChildTotal + dailyPerChild, color: 'text-[#B45309]', bg: 'bg-[#FEF3E2]', sub: `כולל ${campDays} ימים` },
          { label: 'מינימום לגביה',          value: minPrice,    color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]', sub: `+${margin}% = ₪${Math.ceil(withMargin)}` },
          { label: 'כולל תקורה 5% לרשת',    value: withOverhead, color: 'text-[#5B3AAB]', bg: 'bg-[#F3EEFF]', sub: 'מחיר מומלץ לגביה' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-4 text-center ${c.bg}`}>
            <p className={`text-xl font-black ${c.color}`}>₪{Math.ceil(c.value).toLocaleString()}</p>
            <p className="text-xs text-[#6B6D8A] mt-1 font-semibold">{c.label}</p>
            <p className="text-[10px] text-[#9091A8] mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Budget table */}
      <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
        <div className="bg-[#333654] px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-white/80 tracking-wide">פירוט הוצאות</span>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 h-7 rounded-lg bg-white/10 border border-white/20 px-3 text-xs font-bold text-white hover:bg-white/20 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}שמור
          </button>
        </div>

        {/* Header */}
        <div className="grid px-4 py-2 bg-[#F9F9F7] border-b border-[#E5E5E8] text-[10px] font-bold text-[#9091A8] uppercase tracking-wide"
          style={{ gridTemplateColumns: '1fr 120px 140px 100px' }}>
          <span>קטגוריה</span><span className="text-center">סוג</span><span className="text-center">סכום</span><span className="text-left">סה"כ / לילד</span>
        </div>

        <div className="divide-y divide-[#F5F5F3]">
          {items.map(it => {
            const amt = getAmount(it)
            let totalLabel = ''
            if (it.budget_type === 'קבועה' && amt > 0 && childCount > 0)
              totalLabel = `÷${childCount} = ₪${Math.ceil(amt / childCount)}/ילד`
            else if (it.budget_type === 'לילד' && amt > 0 && childCount > 0)
              totalLabel = `×${childCount} = ₪${(amt * childCount).toLocaleString()}`
            else if (it.budget_type === 'ליום' && amt > 0)
              totalLabel = `×${campDays}י = ₪${amt * campDays}/ילד`

            return (
              <div key={it.id}
                className={['grid items-center gap-3 px-4 py-3 transition-colors', it.id === 'activities' && mode === 'on-wheels' ? 'opacity-35' : 'hover:bg-[#F9F9F7]'].join(' ')}
                style={{ gridTemplateColumns: '1fr 120px 140px 100px' }}>

                {/* Category */}
                <div>
                  <span className="text-sm font-semibold text-[#333654]">{it.category}</span>
                  {it.formulaHint && (
                    <span className="mr-2 text-[10px] text-[#9091A8] bg-[#F0F0EC] rounded-full px-1.5 py-0.5">{it.formulaHint}</span>
                  )}
                </div>

                {/* Type toggle — locked for certain items */}
                {LOCKED_TYPE_IDS.has(it.id) ? (
                  <div className="flex justify-center">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white text-[#333654] shadow-sm border border-[#E5E5E8]">
                      {typeLabels[it.budget_type]}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-0.5 rounded-lg bg-[#F5F5F3] p-0.5">
                    {typeOptions.map(t => (
                      <button key={t} onClick={() => setType(it.id, t)}
                        className={['px-2 py-1 rounded-md text-[10px] font-bold transition-all', it.budget_type === t ? 'bg-white text-[#333654] shadow-sm' : 'text-[#9091A8] hover:text-[#333654]'].join(' ')}>
                        {typeLabels[t]}
                      </button>
                    ))}
                  </div>
                )}

                {/* Amount — trips is formula-only, all others editable */}
                {it.isFormula && it.id === 'trips' ? (
                  <div className="flex items-center justify-center">
                    <span className="text-sm font-black text-[#333654]">₪{amt.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#9091A8]">₪</span>
                    <input type="number" value={it.amount || ''} onChange={e => setAmount(it.id, Number(e.target.value))}
                      placeholder={it.id === 'staff' ? String(staffFormula) : '0'}
                      className="w-full h-8 rounded-lg border border-[#E5E5E8] px-2 text-sm text-left focus:border-[#00B1AE] focus:outline-none"
                      dir="ltr" />
                  </div>
                )}

                {/* Summary */}
                <span className="text-[11px] text-[#9091A8] text-left">{totalLabel}</span>
              </div>
            )
          })}
        </div>

        {/* Totals footer */}
        <div className="bg-[#F5F5F3] border-t-2 border-[#E5E5E8] px-4 py-3">
          <div className="grid gap-2 text-xs" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
            <div className="text-[#6B6D8A]">קבועות: <strong className="text-[#C8251D]">₪{fixedTotal.toLocaleString()}</strong></div>
            <div className="text-[#6B6D8A]">לילד: <strong className="text-[#B45309]">₪{Math.ceil(perChildTotal + dailyPerChild)}/ילד</strong></div>
            <div className="text-[#6B6D8A] text-left">מחיר כולל תקורה: <strong className="text-[#5B3AAB]">₪{Math.ceil(withOverhead)}</strong></div>
          </div>
        </div>
      </div>

      <p className="text-xs text-[#9091A8] text-center">
        <strong>קבועה</strong> = הוצאה שאינה תלויה בכמות ·
        <strong> לילד</strong> = עלות לכל ילד לכל הקייטנה ·
        <strong> ליום</strong> = עלות לילד ליום ·
        <strong> תקורה</strong> = 5% מהתשלום הכולל לרשת קייטנות חב&quot;ד
      </p>
    </div>
  )
}
