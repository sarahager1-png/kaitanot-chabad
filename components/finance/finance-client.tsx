'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TransactionForm } from './transaction-form'
import { BudgetOverview } from './budget-overview'
import { Plus, Trash2, TrendingUp, TrendingDown, Download, Printer, FileText, Building2 } from 'lucide-react'
import { exportToExcel, exportToPrint } from '@/lib/export'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { IncomeEntry, ExpenseEntry, Budget } from '@/lib/types'
import { format, parseISO } from 'date-fns'

type ActiveTab = 'income' | 'expense' | 'budget' | 'vendors'

interface VendorSummary {
  name: string
  total: number
  paid: number
  unpaid: number
  count: number
}

interface FinanceClientProps {
  income: IncomeEntry[]
  expenses: ExpenseEntry[]
  budgets: Budget[]
  campId: string
}

const categoryColor: Record<string, string> = {
  'דמי קייטנה': 'bg-[#E0F7F7] text-[#00B1AE]',
  'טיולים':     'bg-[#FEF0EC] text-[#333654]',
  'צהרון':      'bg-[#E5F4EC] text-[#1A7A4A]',
  'העשרה':      'bg-[#FEF3E2] text-[#B45309]',
  'צוות':       'bg-[#FDE8E7] text-[#C8251D]',
  'ציוד':       'bg-[#F5F5F3] text-[#6B6D8A]',
  'פרסום':      'bg-[#FEF0EC] text-[#333654]',
  'שכירות':     'bg-[#FDE8E7] text-[#C8251D]',
  'תחבורה':     'bg-[#FEF3E2] text-[#B45309]',
  'אחר':        'bg-[#F5F5F3] text-[#6B6D8A]',
}

export function FinanceClient({ income, expenses, budgets, campId }: FinanceClientProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<ActiveTab>('income')
  const [formOpen, setFormOpen] = useState(false)
  const [formType, setFormType] = useState<'income' | 'expense'>('income')
  const [localExpenses, setLocalExpenses] = useState<ExpenseEntry[]>(expenses)

  useEffect(() => { setLocalExpenses(expenses) }, [expenses])

  async function handleDelete(id: string, type: 'income' | 'expense') {
    const url = type === 'income' ? `/api/finance/income?id=${id}` : `/api/finance/expenses?id=${id}`
    const res = await fetch(url, { method: 'DELETE' })
    if (!res.ok) { toast.error('שגיאה במחיקה'); return }
    toast.success('הרשומה נמחקה')
    router.refresh()
  }

  const togglePaymentStatus = useCallback(async (id: string, current: 'שולם' | 'לא שולם') => {
    const next = current === 'שולם' ? 'לא שולם' : 'שולם'
    setLocalExpenses(prev => prev.map(e => e.id === id ? { ...e, payment_status: next } : e))
    const res = await fetch(`/api/finance/expenses?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_status: next }),
    })
    if (!res.ok) {
      setLocalExpenses(prev => prev.map(e => e.id === id ? { ...e, payment_status: current } : e))
      toast.error('שגיאה בעדכון')
    }
  }, [])

  function openForm(type: 'income' | 'expense') {
    setFormType(type)
    setFormOpen(true)
  }

  const vendorSummaries: VendorSummary[] = Object.values(
    localExpenses
      .filter(e => e.vendor)
      .reduce<Record<string, VendorSummary>>((acc, e) => {
        const name = e.vendor!
        if (!acc[name]) acc[name] = { name, total: 0, paid: 0, unpaid: 0, count: 0 }
        acc[name].total += Number(e.amount)
        acc[name].count++
        if (e.payment_status === 'שולם') acc[name].paid += Number(e.amount)
        else acc[name].unpaid += Number(e.amount)
        return acc
      }, {})
  ).sort((a, b) => b.total - a.total)

  const tabs: { key: ActiveTab; label: string; icon?: React.ReactNode; count?: number }[] = [
    { key: 'income',  label: 'הכנסות',  count: income.length },
    { key: 'expense', label: 'הוצאות',  count: localExpenses.length },
    { key: 'budget',  label: 'תקציב' },
    { key: 'vendors', label: 'ספקים', count: vendorSummaries.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar + export */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-[#F5F5F3] p-1 w-fit flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
                activeTab === t.key
                  ? 'bg-white text-[#333654] shadow-sm'
                  : 'text-[#6B6D8A] hover:text-[#333654]',
              ].join(' ')}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${activeTab === t.key ? 'bg-[#F5F5F3] text-[#6B6D8A]' : 'bg-white/60 text-[#9091A8]'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {(activeTab === 'income' || activeTab === 'expense') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => exportToPrint(`finance-table-${activeTab}`, activeTab === 'income' ? 'הכנסות' : 'הוצאות')}
              className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors"
            >
              <Printer className="h-4 w-4" />הדפס
            </button>
            <button
              onClick={() => exportToExcel(
                (activeTab === 'income' ? income : localExpenses).map(e => ({
                  'תאריך': e.entry_date, 'קטגוריה': e.category,
                  'תיאור': e.description ?? '',
                  ...('vendor' in e ? { 'ספק': (e as ExpenseEntry).vendor ?? '', 'סטטוס תשלום': (e as ExpenseEntry).payment_status } : {}),
                  'סכום': e.amount,
                })),
                activeTab === 'income' ? 'הכנסות' : 'הוצאות'
              )}
              className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#1A7A4A] hover:text-[#1A7A4A] transition-colors"
            >
              <Download className="h-4 w-4" />ייצוא Excel
            </button>
          </div>
        )}
      </div>

      {activeTab === 'income' && (
        <EntriesList
          entries={income}
          type="income"
          emptyText="אין הכנסות עדיין"
          onAdd={() => openForm('income')}
          onDelete={(id) => handleDelete(id, 'income')}
          onTogglePayment={() => {}}
        />
      )}

      {activeTab === 'expense' && (
        <EntriesList
          entries={localExpenses}
          type="expense"
          emptyText="אין הוצאות עדיין"
          onAdd={() => openForm('expense')}
          onDelete={(id) => handleDelete(id, 'expense')}
          onTogglePayment={togglePaymentStatus}
        />
      )}

      {activeTab === 'budget' && (
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          <div className="bg-[#333654] px-4 py-3">
            <h3 className="text-sm font-semibold text-white/90 tracking-wide">תקציב מול בפועל</h3>
          </div>
          <div className="p-4">
            <BudgetOverview budgets={budgets} expenses={localExpenses} campId={campId} />
          </div>
        </div>
      )}

      {activeTab === 'vendors' && (
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-[#333654] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Building2 className="h-4 w-4 text-[#F8AD1D]" />
              <span className="text-xs font-semibold text-white/80 tracking-wide">{vendorSummaries.length} ספקים</span>
            </div>
          </div>
          {vendorSummaries.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F3]">
                <Building2 className="h-6 w-6 text-[#9091A8]" />
              </div>
              <p className="text-sm text-[#6B6D8A]">אין ספקים עדיין — הוסף הוצאות עם שם ספק</p>
            </div>
          ) : (
            <div className="divide-y divide-[#FEF0EC]">
              {vendorSummaries.map(v => (
                <div key={v.name} className="flex items-center gap-4 px-4 py-3 hover:bg-[#F5F5F3]/50 transition-colors">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FEF0EC] shrink-0">
                    <Building2 className="h-4 w-4 text-[#333654]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#333654]">{v.name}</p>
                    <p className="text-xs text-[#9091A8]">{v.count} הוצאות</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    {v.paid > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-semibold">
                        ✓ שולם ₪{v.paid.toLocaleString()}
                      </span>
                    )}
                    {v.unpaid > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-semibold">
                        ⏳ ₪{v.unpaid.toLocaleString()}
                      </span>
                    )}
                    <span className="font-black text-[#333654]">₪{v.total.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <TransactionForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          fetch('/api/alerts/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ camp_id: campId }),
          }).catch(() => {})
          router.refresh()
        }}
        type={formType}
        campId={campId}
      />
    </div>
  )
}

function EntriesList({
  entries, type, emptyText, onAdd, onDelete, onTogglePayment,
}: {
  entries: (IncomeEntry | ExpenseEntry)[]
  type: 'income' | 'expense'
  emptyText: string
  onAdd: () => void
  onDelete: (id: string) => void
  onTogglePayment: (id: string, current: 'שולם' | 'לא שולם') => void
}) {
  const Icon = type === 'income' ? TrendingUp : TrendingDown
  const amountColor = type === 'income' ? 'text-[#00B1AE]' : 'text-[#C8251D]'
  const addLabel = type === 'income' ? 'הוסף הכנסה' : 'הוסף הוצאה'

  return (
    <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      {/* Navy header */}
      <div className="flex items-center justify-between bg-[#333654] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Icon className={`h-4 w-4 ${amountColor}`} />
          <span className="text-xs font-semibold text-white/80 tracking-wide">{entries.length} רשומות</span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />{addLabel}
        </button>
      </div>

      {/* Column labels */}
      {entries.length > 0 && (
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-[#F5F5F3] px-4 py-2 text-xs font-semibold text-[#6B6D8A] tracking-wide border-b border-[#E5E5E8]">
          <span>פרטים</span>
          <span>סכום</span>
          <span></span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-14">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5F5F3]">
            <Icon className="h-6 w-6 text-[#9091A8]" />
          </div>
          <p className="text-sm text-[#6B6D8A]">{emptyText}</p>
          <button onClick={onAdd} className="text-sm font-semibold text-[#00B1AE] hover:underline">{addLabel}</button>
        </div>
      ) : (
        <div id={`finance-table-${type}`} className="divide-y divide-[#FEF0EC]">
          {entries.map((entry) => {
            const catStyle = categoryColor[entry.category] ?? 'bg-[#F5F5F3] text-[#6B6D8A]'
            const isExpense = type === 'expense'
            const exp = isExpense ? entry as ExpenseEntry : null
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8AD1D]/5 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${catStyle}`}>
                      {entry.category}
                    </span>
                    {entry.description && (
                      <span className="text-sm text-[#333654] truncate">{entry.description}</span>
                    )}
                    {exp?.vendor && (
                      <span className="text-xs text-[#9091A8] shrink-0">({exp.vendor})</span>
                    )}
                    {exp && (
                      <button
                        onClick={() => onTogglePayment(entry.id, exp.payment_status)}
                        className={[
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 cursor-pointer transition-colors',
                          exp.payment_status === 'שולם'
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                        ].join(' ')}
                        title="לחץ לשינוי סטטוס"
                      >
                        {exp.payment_status === 'שולם' ? '✓ שולם' : '⏳ לא שולם'}
                      </button>
                    )}
                    {exp?.invoice_url && (
                      <a href={exp.invoice_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-[#F5F5F3] px-2 py-0.5 text-xs text-[#333654] hover:bg-[#FEF0EC] transition-colors shrink-0"
                        title="פתח חשבונית">
                        <FileText className="h-3 w-3" />חשבונית
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-[#9091A8] mt-0.5">
                    {format(parseISO(entry.entry_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <span className={`font-black text-base shrink-0 ${amountColor}`}>
                  ₪{Number(entry.amount).toLocaleString()}
                </span>
                <AlertDialog>
                  <AlertDialogTrigger className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת רשומה</AlertDialogTitle>
                      <AlertDialogDescription>האם למחוק את הרשומה? פעולה זו אינה ניתנת לביטול.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(entry.id)} className="bg-[#C8251D] hover:bg-[#a01e17] text-white">מחק</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
