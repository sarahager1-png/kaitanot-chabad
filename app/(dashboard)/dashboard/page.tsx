import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatsCards } from '@/components/dashboard/stats-cards'
import { GoalProgress } from '@/components/dashboard/goal-progress'
import { RegistrationsChart } from '@/components/dashboard/registrations-chart'
import { FinanceChart } from '@/components/dashboard/finance-chart'
import { IncomeByCategoryChart } from '@/components/dashboard/income-by-category-chart'
import { PaymentStatusChart } from '@/components/dashboard/payment-status-chart'
import { GenderChart } from '@/components/dashboard/gender-chart'
import { GroupSizeChart } from '@/components/dashboard/group-size-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { DashboardStats } from '@/lib/types'
import { format, parseISO, startOfMonth } from 'date-fns'
import { isCampScoped } from '@/lib/roles'
import { CampSetupChecklist } from '@/components/camps/camp-setup-checklist'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'שליח'

  const service = createServiceClient()

  let campId: string | null = null
  if (isCampScoped(userRole)) {
    const { data: campUser } = await supabase.from('camp_users').select('camp_id').eq('user_id', user.id).limit(1).single()
    campId = campUser?.camp_id ?? null
  }

  const campFilter = campId ? { camp_id: campId } : {}

  const [
    { data: registrantsData },
    { data: campData },
    { data: incomeData },
    { data: expenseData },
  ] = await Promise.all([
    service.from('registrants')
      .select('birth_date, payment_status, gender, group_name, is_waiting, is_healthy, health_issues, allergies, medications')
      .match(campFilter),
    campId
      ? service.from('camps').select('registration_goal').eq('id', campId).single()
      : service.from('camps').select('registration_goal').limit(1).single(),
    service.from('income_entries').select('amount, category, entry_date').match(campFilter),
    service.from('expense_entries').select('amount, category, entry_date').match(campFilter),
  ])

  const allRegs = registrantsData ?? []

  const totalIncome = (incomeData ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = (expenseData ?? []).reduce((s, r) => s + Number(r.amount), 0)
  const totalRegistrants = allRegs.length
  const registrationGoal = campData?.registration_goal ?? 0
  const avgPrice = totalRegistrants > 0 ? totalIncome / totalRegistrants : 0

  // Age groups
  const now = Date.now()
  const ageBuckets: Record<string, number> = { 'עד 6': 0, '7–9': 0, '10–12': 0, '13+': 0, 'לא ידוע': 0 }
  allRegs.forEach((r) => {
    if (!r.birth_date) { ageBuckets['לא ידוע']++; return }
    const age = Math.floor((now - new Date(r.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    if (age <= 6) ageBuckets['עד 6']++
    else if (age <= 9) ageBuckets['7–9']++
    else if (age <= 12) ageBuckets['10–12']++
    else ageBuckets['13+']++
  })
  const age_groups = Object.entries(ageBuckets)
    .filter(([, c]) => c > 0)
    .map(([label, count]) => ({ label, count }))

  const waiting_count = allRegs.filter(r => r.is_waiting).length
  const health_flags_count = allRegs.filter(r =>
    r.is_healthy === false || r.allergies?.trim() || r.medications?.trim() || r.health_issues?.trim()
  ).length

  let attendanceTodayCount: number | null = null
  if (campId) {
    const today = new Date().toISOString().slice(0, 10)
    const { count } = await service
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('camp_id', campId)
      .eq('date', today)
    attendanceTodayCount = count ?? 0
  }

  let campSetupData: {
    hasAddress: boolean
    hasPhone: boolean
    hasTracks: boolean
    hasGoal: boolean
    hasStaff: boolean
    registrantsCount: number
    hasPlanning: boolean
  } | null = null

  if (userRole === 'מנהל קייטנה' && campId) {
    const [
      { data: campDetails },
      { count: tracksCount },
      { count: staffCount },
      { count: plansCount },
    ] = await Promise.all([
      service.from('camps').select('address, phone, registration_goal').eq('id', campId).single(),
      service.from('tracks').select('*', { count: 'exact', head: true }).eq('camp_id', campId),
      service.from('staff').select('*', { count: 'exact', head: true }).eq('camp_id', campId),
      service.from('daily_plans').select('*', { count: 'exact', head: true }).eq('camp_id', campId),
    ])
    campSetupData = {
      hasAddress: !!campDetails?.address?.trim(),
      hasPhone: !!campDetails?.phone?.trim(),
      hasTracks: (tracksCount ?? 0) > 0,
      hasGoal: (campDetails?.registration_goal ?? 0) > 0,
      hasStaff: (staffCount ?? 0) > 0,
      registrantsCount: totalRegistrants,
      hasPlanning: (plansCount ?? 0) > 0,
    }
  }

  const stats: DashboardStats = {
    total_registrants: totalRegistrants,
    registration_goal: registrationGoal,
    total_income: totalIncome,
    total_expenses: totalExpenses,
    avg_price_per_child: avgPrice,
    age_groups,
    waiting_count,
    health_flags_count,
    attendance_today_count: attendanceTodayCount,
  }

  // Payment status breakdown
  const paymentCounts: Record<string, number> = { 'שולם מלא': 0, 'שולם חלקי': 0, 'טרם שולם': 0 }
  allRegs.forEach(r => { if (r.payment_status) paymentCounts[r.payment_status] = (paymentCounts[r.payment_status] ?? 0) + 1 })
  const paymentData = Object.entries(paymentCounts).map(([status, count]) => ({ status, count }))

  // Gender breakdown
  const genderCounts: Record<string, number> = { 'זכר': 0, 'נקבה': 0, 'לא ידוע': 0 }
  allRegs.forEach(r => {
    const g = r.gender ?? 'לא ידוע'
    genderCounts[g] = (genderCounts[g] ?? 0) + 1
  })
  const genderData = Object.entries(genderCounts).map(([gender, count]) => ({ gender, count }))

  // Group sizes
  const groupCounts: Record<string, number> = {}
  allRegs.filter(r => r.group_name).forEach(r => {
    const g = r.group_name!
    groupCounts[g] = (groupCounts[g] ?? 0) + 1
  })
  const groupData = Object.entries(groupCounts).map(([group, count]) => ({ group, count })).sort((a, b) => b.count - a.count)

  const { data: registrantsOverTime } = await service
    .from('registrants')
    .select('created_at')
    .match(campFilter)
    .order('created_at')

  const regByDate: Record<string, number> = {}
  ;(registrantsOverTime ?? []).forEach((r) => {
    const day = format(parseISO(r.created_at), 'dd/MM')
    regByDate[day] = (regByDate[day] ?? 0) + 1
  })
  const regChartData = Object.entries(regByDate).map(([date, count]) => ({ date, count }))

  const financeByMonth: Record<string, { income: number; expenses: number }> = {}
  ;(incomeData ?? []).forEach((r) => {
    const m = format(startOfMonth(parseISO(r.entry_date)), 'MM/yy')
    if (!financeByMonth[m]) financeByMonth[m] = { income: 0, expenses: 0 }
    financeByMonth[m].income += Number(r.amount)
  })
  ;(expenseData ?? []).forEach((r) => {
    const m = format(startOfMonth(parseISO(r.entry_date)), 'MM/yy')
    if (!financeByMonth[m]) financeByMonth[m] = { income: 0, expenses: 0 }
    financeByMonth[m].expenses += Number(r.amount)
  })
  const financeChartData = Object.entries(financeByMonth).map(([month, v]) => ({ month, ...v }))

  const incomeByCat: Record<string, number> = {}
  ;(incomeData ?? []).forEach((r) => {
    incomeByCat[r.category] = (incomeByCat[r.category] ?? 0) + Number(r.amount)
  })
  const incomeCatData = Object.entries(incomeByCat).map(([category, amount]) => ({ category, amount }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">סקירה כללית</p>
          <h1 className="text-3xl font-black tracking-tight">לוח בקרה</h1>
        </div>
      </div>

      {campSetupData && campId && (
        <CampSetupChecklist
          campId={campId}
          hasAddress={campSetupData.hasAddress}
          hasPhone={campSetupData.hasPhone}
          hasTracks={campSetupData.hasTracks}
          hasGoal={campSetupData.hasGoal}
          hasStaff={campSetupData.hasStaff}
          registrantsCount={campSetupData.registrantsCount}
          hasPlanning={campSetupData.hasPlanning}
        />
      )}

      <StatsCards stats={stats} />
      <GoalProgress current={stats.total_registrants} goal={stats.registration_goal} />

      <Tabs defaultValue="charts">
        <TabsList className="mb-2">
          <TabsTrigger value="charts">גרפים</TabsTrigger>
          <TabsTrigger value="income">פילוח הכנסות</TabsTrigger>
          <TabsTrigger value="registrants">ניתוח רשומים</TabsTrigger>
        </TabsList>
        <TabsContent value="charts" className="flex flex-col gap-4">
          <RegistrationsChart data={regChartData} />
          <FinanceChart data={financeChartData} />
        </TabsContent>
        <TabsContent value="income">
          <IncomeByCategoryChart data={incomeCatData} />
        </TabsContent>
        <TabsContent value="registrants" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PaymentStatusChart data={paymentData} />
          <GenderChart data={genderData} />
          {groupData.length > 0 && (
            <div className="md:col-span-2">
              <GroupSizeChart data={groupData} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
