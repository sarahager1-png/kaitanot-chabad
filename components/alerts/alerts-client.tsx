'use client'

import { useRouter } from 'next/navigation'
import { AlertCircle, Info, AlertTriangle, CheckCheck, Bell } from 'lucide-react'
import { toast } from 'sonner'
import type { Alert } from '@/lib/types'
import { format, parseISO } from 'date-fns'

const severityConfig: Record<string, {
  icon: React.ElementType
  label: string
  iconColor: string
  badgeBg: string
  badgeText: string
  borderColor: string
  leftBar: string
}> = {
  error:   { icon: AlertCircle,   label: 'דחוף',   iconColor: 'text-[#C8251D]', badgeBg: 'bg-[#FDE8E7]', badgeText: 'text-[#C8251D]', borderColor: 'border-[#FDE8E7]', leftBar: 'bg-[#C8251D]' },
  warning: { icon: AlertTriangle, label: 'אזהרה',  iconColor: 'text-[#B45309]', badgeBg: 'bg-[#FEF3E2]', badgeText: 'text-[#B45309]', borderColor: 'border-[#FEF3E2]', leftBar: 'bg-[#F8AD1D]' },
  info:    { icon: Info,          label: 'מידע',   iconColor: 'text-[#00B1AE]', badgeBg: 'bg-[#E0F7F7]', badgeText: 'text-[#00B1AE]', borderColor: 'border-[#E5E5E8]',  leftBar: 'bg-[#00B1AE]' },
}

interface AlertsClientProps {
  alerts: Alert[]
}

export function AlertsClient({ alerts }: AlertsClientProps) {
  const router = useRouter()

  async function markRead(id: string) {
    const res = await fetch(`/api/alerts?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_read: true }),
    })
    if (!res.ok) { toast.error('שגיאה'); return }
    router.refresh()
  }

  async function markAllRead() {
    const unread = alerts.filter((a) => !a.is_read)
    await Promise.all(unread.map((a) => markRead(a.id)))
    toast.success('כל ההתראות סומנו כנקראו')
  }

  const sorted = [...alerts].sort((a, b) => {
    const order = { error: 0, warning: 1, info: 2 }
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
  })

  return (
    <div className="flex flex-col gap-4">
      {alerts.filter((a) => !a.is_read).length > 0 && (
        <button
          onClick={markAllRead}
          className="flex items-center gap-1.5 self-start rounded-lg border border-[#E5E5E8] bg-white px-3 py-2 text-sm font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors"
        >
          <CheckCheck className="h-4 w-4" />
          סמן הכל כנקרא
        </button>
      )}

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F3]">
            <Bell className="h-7 w-7 text-[#9091A8]" />
          </div>
          <p className="text-sm text-[#6B6D8A]">אין התראות</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 bg-[#333654] px-4 py-3 text-xs font-semibold text-white/80 tracking-wide">
            <span>התראה</span>
            <span>תאריך</span>
            <span></span>
          </div>

          <div className="divide-y divide-[#F5F5F3]">
            {sorted.map((alert) => {
              const cfg = severityConfig[alert.severity] ?? severityConfig.info
              const Icon = cfg.icon
              return (
                <div
                  key={alert.id}
                  className={`relative flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-[#F5F5F3]/40 ${alert.is_read ? 'opacity-50' : ''}`}
                >
                  {/* Left severity bar */}
                  <div className={`absolute top-0 bottom-0 right-0 w-1 rounded-r-xl ${cfg.leftBar}`} />

                  <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${cfg.badgeBg}`}>
                    <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${!alert.is_read ? 'font-bold text-[#333654]' : 'font-medium text-[#6B6D8A]'}`}>
                        {alert.title}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {cfg.label}
                      </span>
                    </div>
                    {alert.body && <p className="text-xs text-[#9091A8] mt-0.5">{alert.body}</p>}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-[#9091A8]">
                      {format(parseISO(alert.created_at), 'dd/MM/yy HH:mm')}
                    </span>
                    {!alert.is_read && (
                      <button
                        onClick={() => markRead(alert.id)}
                        className="rounded-lg bg-[#F5F5F3] px-2.5 py-1 text-xs font-semibold text-[#6B6D8A] hover:bg-[#333654] hover:text-white transition-colors"
                      >
                        נקרא
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
