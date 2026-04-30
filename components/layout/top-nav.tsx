'use client'

import { Bell } from 'lucide-react'
import Link from 'next/link'
import { InstallAppButton } from './install-app-button'

interface TopNavProps {
  campName?: string
  alertCount?: number
  userName?: string
}

export function TopNav({ campName, alertCount = 0, userName }: TopNavProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b border-[#E5E5E8] bg-white px-4 md:px-6 gap-4">
      {/* Mobile spacer for hamburger button */}
      <div className="w-10 flex-shrink-0 md:hidden" />
      {/* Right side: breadcrumb */}
      <div className="flex flex-1 items-center gap-2 min-w-0">
        {campName && (
          <div className="flex items-center gap-1.5 text-sm min-w-0">
            <span className="text-[#9091A8]">קייטנה:</span>
            <span className="font-semibold text-[#333654] truncate">{campName}</span>
          </div>
        )}
      </div>

      {/* Left side: actions */}
      <div className="flex items-center gap-2">
        {userName && (
          <span className="hidden md:block text-sm font-medium text-[#6B6D8A] bg-[#F5F5F3] rounded-lg px-3 py-1.5 border border-[#E5E5E8]">
            {userName}
          </span>
        )}

        <InstallAppButton />

        <Link
          href="/alerts"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#F5F5F3] hover:text-[#333654] transition-colors"
          aria-label="התראות"
        >
          <Bell className="h-4.5 w-4.5" />
          {alertCount > 0 && (
            <span className="absolute top-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#C8251D] text-[9px] font-bold text-white">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
