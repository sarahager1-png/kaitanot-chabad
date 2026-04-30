'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin, Layers, Target, UserCheck, Share2, Users,
  CalendarDays, ChevronDown, ChevronUp, CheckCircle2,
  Circle, ExternalLink, X
} from 'lucide-react'

interface CampSetupChecklistProps {
  campId: string
  hasAddress: boolean
  hasPhone: boolean
  hasTracks: boolean
  hasGoal: boolean
  hasStaff: boolean
  registrantsCount: number
  hasPlanning: boolean
}

interface Step {
  id: string
  title: string
  desc: string
  icon: React.ElementType
  color: string
  bg: string
  done: boolean
  href?: string
  manual?: boolean
}

export function CampSetupChecklist({
  campId,
  hasAddress,
  hasPhone,
  hasTracks,
  hasGoal,
  hasStaff,
  registrantsCount,
  hasPlanning,
}: CampSetupChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(`camp_setup_dismissed_${campId}`) === '1'
  })
  const [manualDone, setManualDone] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem(`camp_setup_manual_${campId}`) ?? '[]') } catch { return [] }
  })
  const [expanded, setExpanded] = useState(true)

  const steps: Step[] = [
    {
      id: 'details',
      title: 'עדכן פרטי הקייטנה',
      desc: 'כתובת מלאה וטלפון יצירת קשר — יופיעו על כרטיס הקייטנה ויסייעו להורים.',
      icon: MapPin,
      color: 'text-[#333654]', bg: 'bg-[#F5F5F3]',
      done: hasAddress && hasPhone,
      href: `/camps/${campId}/edit`,
    },
    {
      id: 'tracks',
      title: 'הגדר מסלולים ומחירות',
      desc: 'לדוגמה: חצי יום / יום שלם / כולל לינה — כל מסלול עם מחיר. ההורים יבחרו בעת הרישום.',
      icon: Layers,
      color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]',
      done: hasTracks,
      href: `/camps/${campId}/edit`,
    },
    {
      id: 'goal',
      title: 'הגדר יעד נרשמים',
      desc: 'כמה ילדים אתם מצפים? פס ההתקדמות בלוח הבקרה ובכרטיס הקייטנה יתעדכן בהתאם.',
      icon: Target,
      color: 'text-[#F8AD1D]', bg: 'bg-[#FEF9EC]',
      done: hasGoal,
      href: `/camps/${campId}`,
    },
    {
      id: 'staff',
      title: 'הוסף אנשי צוות',
      desc: 'מדריכים, עוזרים, רופא קייטנה — כולל תפקיד ופרטי שכר.',
      icon: UserCheck,
      color: 'text-[#333654]', bg: 'bg-[#FEF0EC]',
      done: hasStaff,
      href: '/staff',
    },
    {
      id: 'share',
      title: 'שתף טופס רישום להורים',
      desc: 'דף הקייטנה ← "שתף רישום" ← העתק קישור ושלח בקבוצות וואצאפ של הורים.',
      icon: Share2,
      color: 'text-[#25D366]', bg: 'bg-[#E7FFDB]',
      done: manualDone.includes('share'),
      href: `/camps/${campId}`,
      manual: true,
    },
    {
      id: 'registrants',
      title: 'הוסף ילד ראשון',
      desc: 'הוסף ידנית או ייבא מאקסל. כל רישום כולל פרטי הורים, בריאות וסטטוס תשלום.',
      icon: Users,
      color: 'text-[#1A7A4A]', bg: 'bg-[#E5F4EC]',
      done: registrantsCount > 0,
      href: '/registrants',
    },
    {
      id: 'planning',
      title: 'צור תכנון יומי ראשון',
      desc: 'הגדר לפחות יום אחד עם נושא ופעילויות. ניתן לצרף קבצים ומשימות לכל פעילות.',
      icon: CalendarDays,
      color: 'text-[#1A7A4A]', bg: 'bg-[#E5F4EC]',
      done: hasPlanning,
      href: '/planning',
    },
  ]

  const doneCount = steps.filter(s => s.done || manualDone.includes(s.id)).length
  const allDone = doneCount === steps.length

  function markDone(id: string) {
    const next = [...manualDone, id]
    setManualDone(next)
    localStorage.setItem(`camp_setup_manual_${campId}`, JSON.stringify(next))
  }

  function dismiss() {
    localStorage.setItem(`camp_setup_dismissed_${campId}`, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  const pct = Math.round((doneCount / steps.length) * 100)

  return (
    <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        style={{ background: 'linear-gradient(135deg,#1A4A3A 0%,#1A7A4A 100%)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div>
          <h2 className="text-base font-black text-white">הגדרות ראשוניות — הקייטנה שלי</h2>
          <p className="text-xs text-white/60 mt-0.5">
            {allDone ? 'כל השלבים הושלמו! הקייטנה מוכנה.' : `${doneCount} מתוך ${steps.length} שלבים הושלמו`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-28 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: allDone ? '#FDE68A' : 'linear-gradient(90deg,#F8AD1D,#FDE68A)'
                }}
              />
            </div>
            <span className="text-xs font-bold text-white/80">{pct}%</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss() }}
            className="text-white/40 hover:text-white/80 transition-colors"
            title="הסתר"
          >
            <X className="h-4 w-4" />
          </button>
          {expanded
            ? <ChevronUp className="h-4 w-4 text-white/60" />
            : <ChevronDown className="h-4 w-4 text-white/60" />
          }
        </div>
      </div>

      {/* Steps */}
      {expanded && (
        <div className="divide-y divide-[#F5F5F3]">
          {steps.map((step, i) => {
            const isDone = step.done || manualDone.includes(step.id)
            const Icon = step.icon
            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors ${isDone ? 'bg-[#F9FDF9]' : 'bg-white hover:bg-[#FAFAFA]'}`}
              >
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  {isDone
                    ? <CheckCircle2 className="h-5 w-5 text-[#1A7A4A]" />
                    : <Circle className="h-5 w-5 text-[#D1D1D8]" />
                  }
                  <span className="text-[10px] font-bold text-[#9091A8]">{i + 1}</span>
                </div>

                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${isDone ? 'bg-[#E5F4EC]' : step.bg}`}>
                  <Icon className={`h-4 w-4 ${isDone ? 'text-[#1A7A4A]' : step.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isDone ? 'text-[#9091A8] line-through' : 'text-[#333654]'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-[#9091A8] mt-0.5 leading-relaxed">{step.desc}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!isDone && step.href && (
                    <Link
                      href={step.href}
                      className="flex items-center gap-1 rounded-lg bg-[#1A7A4A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#166040] transition-colors"
                    >
                      פתח <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {!isDone && step.manual && (
                    <button
                      onClick={() => markDone(step.id)}
                      className="rounded-lg border border-[#E5E5E8] px-3 py-1.5 text-xs font-semibold text-[#6B6D8A] hover:border-[#1A7A4A] hover:text-[#1A7A4A] transition-colors"
                    >
                      סמן כבוצע
                    </button>
                  )}
                  {isDone && (
                    <span className="text-xs font-semibold text-[#1A7A4A]">✓ הושלם</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {allDone && expanded && (
        <div className="flex items-center justify-between px-5 py-3 bg-[#E5F4EC] border-t border-[#BBF7D0]">
          <span className="text-sm font-bold text-[#1A7A4A]">הקייטנה מוכנה לשימוש!</span>
          <button onClick={dismiss} className="text-xs text-[#1A7A4A] hover:underline">הסתר</button>
        </div>
      )}
    </div>
  )
}
