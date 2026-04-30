import Link from 'next/link'
import { Users, TrendingUp, TrendingDown, Wallet, Clock, ShieldAlert, CalendarCheck2 } from 'lucide-react'
import type { DashboardStats } from '@/lib/types'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', maximumFractionDigits: 0 }).format(amount)
}

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const profit = stats.total_income - stats.total_expenses
  const goalPct = stats.registration_goal > 0
    ? Math.round((stats.total_registrants / stats.registration_goal) * 100)
    : 0

  const cards = [
    {
      label: 'רשומים',
      value: String(stats.total_registrants),
      sub: stats.registration_goal > 0 ? `${goalPct}% מהיעד (${stats.registration_goal})` : 'ללא יעד מוגדר',
      icon: Users,
      accent: 'bg-[#333654]',
      bg: 'bg-[#F5F5F3]',
      iconColor: 'text-[#333654]',
      valueColor: 'text-[#333654]',
    },
    {
      label: 'הכנסות',
      value: formatCurrency(stats.total_income),
      sub: `ממוצע ${formatCurrency(stats.avg_price_per_child)} לילד`,
      icon: TrendingUp,
      accent: 'bg-[#00B1AE]',
      bg: 'bg-[#E0F7F7]',
      iconColor: 'text-[#00B1AE]',
      valueColor: 'text-[#00B1AE]',
    },
    {
      label: 'הוצאות',
      value: formatCurrency(stats.total_expenses),
      sub: 'סה״כ הוצאות',
      icon: TrendingDown,
      accent: 'bg-[#C8251D]',
      bg: 'bg-[#FDE8E7]',
      iconColor: 'text-[#C8251D]',
      valueColor: 'text-[#C8251D]',
    },
    {
      label: profit >= 0 ? 'רווח נקי' : 'גירעון',
      value: formatCurrency(Math.abs(profit)),
      sub: profit >= 0 ? 'מעל ההוצאות' : 'מתחת להוצאות',
      icon: Wallet,
      accent: profit >= 0 ? 'bg-[#F8AD1D]' : 'bg-[#B45309]',
      bg: profit >= 0 ? 'bg-[#FEF9EC]' : 'bg-[#FEF3E2]',
      iconColor: profit >= 0 ? 'text-[#A07830]' : 'text-[#B45309]',
      valueColor: profit >= 0 ? 'text-[#A07830]' : 'text-[#B45309]',
    },
    ...(stats.waiting_count > 0 ? [{
      label: 'רשימת המתנה',
      value: String(stats.waiting_count),
      sub: 'ממתינים לרישום',
      icon: Clock,
      accent: 'bg-[#B45309]',
      bg: 'bg-[#FEF3E2]',
      iconColor: 'text-[#B45309]',
      valueColor: 'text-[#B45309]',
    }] : []),
    ...(stats.health_flags_count > 0 ? [{
      label: 'הערות בריאות',
      value: String(stats.health_flags_count),
      sub: 'ילדים עם מידע רפואי',
      icon: ShieldAlert,
      accent: 'bg-[#C8251D]',
      bg: 'bg-[#FDE8E7]',
      iconColor: 'text-[#C8251D]',
      valueColor: 'text-[#C8251D]',
    }] : []),
    ...(stats.attendance_today_count !== null ? [{
      label: 'נוכחות היום',
      value: stats.attendance_today_count > 0 ? 'הוזנה ✓' : 'טרם הוזנה',
      sub: stats.attendance_today_count > 0 ? `${stats.attendance_today_count} ילדים סומנו` : 'לחצ/י לסימון',
      icon: CalendarCheck2,
      accent: stats.attendance_today_count > 0 ? 'bg-[#1A7A4A]' : 'bg-[#B45309]',
      bg: stats.attendance_today_count > 0 ? 'bg-[#E5F4EC]' : 'bg-[#FEF3E2]',
      iconColor: stats.attendance_today_count > 0 ? 'text-[#1A7A4A]' : 'text-[#B45309]',
      valueColor: stats.attendance_today_count > 0 ? 'text-[#1A7A4A]' : 'text-[#B45309]',
      href: '/attendance',
    }] : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon
        const inner = (
          <>
            <div className={`absolute top-0 right-0 left-0 h-1 ${card.accent} rounded-t-xl`} />
            <div className="flex items-center justify-between mb-3 mt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9091A8]">
                {card.label}
              </span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}>
                <Icon className={`h-4 w-4 ${card.iconColor}`} />
              </div>
            </div>
            <div className={`text-2xl font-black tracking-tight ${card.valueColor}`}>
              {card.value}
            </div>
            <p className="mt-1 text-xs text-[#9091A8] leading-snug">{card.sub}</p>
          </>
        )
        const cls = `relative overflow-hidden rounded-xl bg-white border border-[#E5E5E8] p-5 shadow-sm hover:shadow-md hover:border-[#F8AD1D]/40 transition-all ${'href' in card ? 'cursor-pointer' : ''}`
        return 'href' in card && card.href ? (
          <Link key={card.label} href={card.href} className={cls}>{inner}</Link>
        ) : (
          <div key={card.label} className={cls}>{inner}</div>
        )
      })}
      {/* Age breakdown */}
      {stats.age_groups.length > 0 && (
        <div className="col-span-2 lg:col-span-4 relative overflow-hidden rounded-xl bg-white border border-[#E5E5E8] p-5 shadow-sm">
          <div className="absolute top-0 right-0 left-0 h-1 bg-[#333654] rounded-t-xl" />
          <div className="flex items-center justify-between mb-3 mt-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9091A8]">פילוח לפי גילאים</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.age_groups.map((g) => (
              <div key={g.label} className="flex items-center gap-2">
                <div className="flex h-9 flex-col items-center justify-center rounded-lg bg-[#FEF0EC] px-3 min-w-[56px]">
                  <span className="text-base font-black text-[#333654] leading-none">{g.count}</span>
                  <span className="text-[10px] text-[#9091A8] font-medium mt-0.5">{g.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
