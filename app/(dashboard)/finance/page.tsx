import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FinanceClient } from '@/components/finance/finance-client'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import { ShekelIcon } from '@/components/icons/shekel-icon'
import type { IncomeEntry, ExpenseEntry, Budget } from '@/lib/types'
import { isCampScoped } from '@/lib/roles'

export default async function FinancePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  const service = createServiceClient()

  let campId: string | null = null
  if (isCampScoped(userRole)) {
    const { data: cu } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = cu?.camp_id ?? null
  } else {
    const { data: firstCamp } = await service.from('camps').select('id').limit(1).single()
    campId = firstCamp?.id ?? null
  }

  if (!campId) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F3]">
          <ShekelIcon className="h-7 w-7 text-[#9091A8]" />
        </div>
        <p className="text-sm text-[#6B6D8A]">אין קייטנה משויכת</p>
      </div>
    )
  }

  const [{ data: income }, { data: expenses }, { data: budgets }, { count: registrantCount }] = await Promise.all([
    service.from('income_entries').select('*').eq('camp_id', campId).order('entry_date', { ascending: false }),
    service.from('expense_entries').select('*').eq('camp_id', campId).order('entry_date', { ascending: false }),
    service.from('budgets').select('*').eq('camp_id', campId),
    service.from('registrants').select('id', { count: 'exact', head: true }).eq('camp_id', campId),
  ])

  const totalIncome = (income ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = (expenses ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const profit = totalIncome - totalExpenses

  const summaryCards = [
    { label: 'הכנסות', value: totalIncome, icon: TrendingUp, color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]', bar: 'bg-[#00B1AE]' },
    { label: 'הוצאות', value: totalExpenses, icon: TrendingDown, color: 'text-[#C8251D]', bg: 'bg-[#FDE8E7]', bar: 'bg-[#C8251D]' },
    { label: profit >= 0 ? 'רווח' : 'הפסד', value: Math.abs(profit), icon: Wallet, color: profit >= 0 ? 'text-[#1A7A4A]' : 'text-[#C8251D]', bg: profit >= 0 ? 'bg-[#E5F4EC]' : 'bg-[#FDE8E7]', bar: profit >= 0 ? 'bg-[#1A7A4A]' : 'bg-[#C8251D]' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-[#333654]">ניהול כספים</h1>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {summaryCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="relative overflow-hidden rounded-xl bg-white border border-[#E5E5E8] p-5 shadow-sm">
              <div className={`absolute top-0 right-0 left-0 h-1 ${c.bar} rounded-t-xl`} />
              <div className="flex items-center justify-between mb-3 mt-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9091A8]">{c.label}</span>
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.bg}`}>
                  <Icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-black ${c.color}`}>₪{c.value.toLocaleString()}</div>
            </div>
          )
        })}
      </div>

      <FinanceClient
        income={income as IncomeEntry[] ?? []}
        expenses={expenses as ExpenseEntry[] ?? []}
        budgets={budgets as Budget[] ?? []}
        campId={campId}
        registrantCount={registrantCount ?? 0}
      />
    </div>
  )
}
