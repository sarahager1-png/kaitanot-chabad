'use client'

import Link from 'next/link'
import { MapPin, Calendar, Users, ArrowLeft, Tent, Phone } from 'lucide-react'
import type { Camp } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface CampCardProps {
  camp: Camp & { registrantCount: number }
}

function formatDate(d: string | null) {
  if (!d) return null
  try { return format(parseISO(d), 'dd/MM/yy') } catch { return d }
}

export function CampCard({ camp }: CampCardProps) {
  const goalPct = camp.registration_goal > 0
    ? Math.min(Math.round((camp.registrantCount / camp.registration_goal) * 100), 100)
    : 0

  const now = new Date()
  const isOpen = camp.camp_open_at && camp.camp_close_at
    ? new Date(camp.camp_open_at) <= now && now <= new Date(camp.camp_close_at)
    : false

  return (
    <Link href={`/camps/${camp.id}`} className="group block">
      <div className="flex flex-col rounded-xl bg-white border border-[#E5E5E8] shadow-sm hover:shadow-md hover:border-[#F8AD1D]/50 transition-all duration-200 overflow-hidden">
        {/* Header strip */}
        <div className="p-5 pb-4" style={{background: 'linear-gradient(135deg, #252740 0%, #333654 100%)'}}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0" style={{background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.3)'}}>
              <Tent className="h-4.5 w-4.5" style={{color: '#FDE68A'}} />
            </div>
            <span className={[
              'text-[11px] font-bold px-2.5 py-1 rounded-full',
              isOpen ? 'text-[#333654]' : 'bg-white/10 text-white/60'
            ].join(' ')} style={isOpen ? {background: 'linear-gradient(90deg,#F8AD1D,#FDE68A)'} : {}}>
              {isOpen ? '● פתוחה' : camp.school_year}
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-2 leading-snug">{camp.name}</h3>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-2.5 p-4">
          {camp.address && (
            <div className="flex items-center gap-1.5 text-sm text-[#6B6D8A]">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#9091A8]" />
              <span className="truncate">{camp.address}</span>
            </div>
          )}

          {camp.phone && (
            <div className="flex items-center gap-1.5 text-sm text-[#6B6D8A]">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#9091A8]" />
              <a href={`tel:${camp.phone}`} dir="ltr" className="hover:text-[#333654] transition-colors">{camp.phone}</a>
            </div>
          )}

          {(camp.camp_open_at || camp.camp_close_at) && (
            <div className="flex items-center gap-1.5 text-sm text-[#6B6D8A]">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-[#9091A8]" />
              <span>{formatDate(camp.camp_open_at)} – {formatDate(camp.camp_close_at)}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-sm text-[#6B6D8A]">
            <Users className="h-3.5 w-3.5 shrink-0 text-[#9091A8]" />
            <span>
              <span className="font-semibold text-[#333654]">{camp.registrantCount}</span>
              {' '}רשומים
              {camp.registration_goal > 0 && (
                <span className="text-[#9091A8]"> / {camp.registration_goal} יעד</span>
              )}
            </span>
          </div>

          {/* Progress */}
          {camp.registration_goal > 0 && (
            <div className="mt-1">
              <div className="flex justify-between text-[11px] text-[#9091A8] mb-1">
                <span>התקדמות</span>
                <span className="font-semibold text-[#6B6D8A]">{goalPct}%</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-[#F5F5F3] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${goalPct}%`, background: 'linear-gradient(90deg, #F8AD1D, #FDE68A)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-1.5 rounded-lg border border-[#E5E5E8] bg-[#F5F5F3] py-2 text-sm font-semibold text-[#6B6D8A] transition-all duration-200 group-hover:text-[#333654] group-hover:border-[#F8AD1D]" style={{}} onMouseEnter={e => (e.currentTarget.style.background='linear-gradient(90deg,#F8AD1D,#FDE68A)')} onMouseLeave={e => (e.currentTarget.style.background='')}>
            כניסה לקייטנה
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </div>
        </div>
      </div>
    </Link>
  )
}
