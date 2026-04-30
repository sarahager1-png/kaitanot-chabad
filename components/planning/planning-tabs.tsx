'use client'

import { useState } from 'react'
import { CalendarDays, Calculator } from 'lucide-react'

interface PlanningTabsProps {
  planningContent: React.ReactNode
  budgetContent: React.ReactNode
}

const tabs = [
  { id: 'schedule', label: 'לוז יומי', icon: CalendarDays },
  { id: 'budget', label: 'הדמיית תקציב', icon: Calculator },
]

export function PlanningTabs({ planningContent, budgetContent }: PlanningTabsProps) {
  const [active, setActive] = useState<'schedule' | 'budget'>('schedule')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-1 rounded-xl bg-[#F5F5F3] p-1 w-fit">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id as 'schedule' | 'budget')}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all"
              style={{
                background: isActive ? '#fff' : 'transparent',
                color: isActive ? '#1A1B2E' : '#9091A8',
                boxShadow: isActive ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div>
        {active === 'schedule' ? planningContent : budgetContent}
      </div>
    </div>
  )
}
