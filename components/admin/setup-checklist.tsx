'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Tent, Star, User, CreditCard, Share2, CheckSquare2,
  ChevronDown, ChevronUp, ExternalLink, CheckCircle2, Circle, X
} from 'lucide-react'

interface SetupChecklistProps {
  campsCount: number
  hasCardcom: boolean
  hasCampManager: boolean
  hasShliach: boolean
  firstCampId: string | null
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
  tip?: string
}

export function SetupChecklist({
  campsCount,
  hasCardcom,
  hasCampManager,
  hasShliach,
  firstCampId,
}: SetupChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('admin_setup_dismissed') === '1'
  })
  const [manualDone, setManualDone] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try { return JSON.parse(localStorage.getItem('admin_setup_manual') ?? '[]') } catch { return [] }
  })
  const [expanded, setExpanded] = useState(true)

  const steps: Step[] = [
    {
      id: 'create-camp',
      title: 'צור קייטנה ראשונה',
      desc: 'שם, שנת לימודים, תאריכי פתיחה/סגירה, יעד רישום ומסלולים.',
      icon: Tent,
      color: 'text-[#333654]', bg: 'bg-[#F5F5F3]',
      done: campsCount > 0,
      href: '/camps/new',
    },
    {
      id: 'cardcom',
      title: 'הגדר פרטי סליקה (Cardcom)',
      desc: 'ערוך קייטנה ← גלול ל"פרטי סליקה" ← הזן מספר טרמינל, שם משתמש API וסיסמה.',
      icon: CreditCard,
      color: 'text-[#1A7A4A]', bg: 'bg-[#E5F4EC]',
      done: hasCardcom,
      href: firstCampId ? `/camps/${firstCampId}/edit` : '/camps',
      tip: 'אם אין טרמינל נפרד לקייטנה — הגדר ב-.env.local את CARDCOM_TERMINAL, CARDCOM_API_NAME, CARDCOM_API_PASSWORD',
    },
    {
      id: 'invite-manager',
      title: 'הזמן מנהל קייטנה',
      desc: 'לחץ "הזמן משתמש" ← תפקיד: מנהל קייטנה ← שייך לקייטנה.',
      icon: Star,
      color: 'text-[#A07830]', bg: 'bg-[#FEF9EC]',
      done: hasCampManager,
      manual: true,
    },
    {
      id: 'invite-shliach',
      title: 'הזמן שליח',
      desc: 'לחץ "הזמן משתמש" ← תפקיד: שליח ← שייך לקייטנה.',
      icon: User,
      color: 'text-[#6B6D8A]', bg: 'bg-[#F5F5F3]',
      done: hasShliach,
      manual: true,
    },
    {
      id: 'share-link',
      title: 'שלח קישורי כניסה לצוות',
      desc: 'דף הקייטנה ← "שתף רישום" ← העתק "קישור כניסה לשליח" ← שלח בוואצאפ למנהל ולשליח.',
      icon: Share2,
      color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]',
      done: manualDone.includes('share-link'),
      href: firstCampId ? `/camps/${firstCampId}` : '/camps',
      manual: true,
    },
    {
      id: 'test-form',
      title: 'בדוק טופס רישום הורים',
      desc: 'דף הקייטנה ← "שתף רישום" ← לחץ על קישור טופס הרישום ← וודא שנראה תקין.',
      icon: CheckSquare2,
      color: 'text-[#C8251D]', bg: 'bg-[#FDE8E7]',
      done: manualDone.includes('test-form'),
      href: firstCampId ? `/camps/${firstCampId}` : '/camps',
      manual: true,
    },
  ]

  const doneCount = steps.filter(s =>
    s.done || manualDone.includes(s.id)
  ).length
  const allDone = doneCount === steps.length

  function markManualDone(id: string) {
    const next = [...manualDone, id]
    setManualDone(next)
    localStorage.setItem('admin_setup_manual', JSON.stringify(next))
  }

  function dismiss() {
    localStorage.setItem('admin_setup_dismissed', '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
        style={{ background: 'linear-gradient(135deg,#252740 0%,#333654 100%)' }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-black text-white">הגדרות ראשוניות</h2>
            <p className="text-xs text-white/60">
              {allDone ? 'כל השלבים הושלמו! המערכת מוכנה.' : `${doneCount} מתוך ${steps.length} שלבים הושלמו`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* Progress pill */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-2 w-32 rounded-full bg-white/20 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.round((doneCount / steps.length) * 100)}%`,
                  background: allDone ? '#1A7A4A' : 'linear-gradient(90deg,#F8AD1D,#FDE68A)'
                }}
              />
            </div>
            <span className="text-xs font-bold text-white/80">
              {Math.round((doneCount / steps.length) * 100)}%
            </span>
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
                {/* Step number / check */}
                <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                  {isDone
                    ? <CheckCircle2 className="h-5 w-5 text-[#1A7A4A]" />
                    : <Circle className="h-5 w-5 text-[#D1D1D8]" />
                  }
                  <span className="text-[10px] font-bold text-[#9091A8]">{i + 1}</span>
                </div>

                {/* Icon */}
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${isDone ? 'bg-[#E5F4EC]' : step.bg}`}>
                  <Icon className={`h-4 w-4 ${isDone ? 'text-[#1A7A4A]' : step.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-bold ${isDone ? 'text-[#9091A8] line-through' : 'text-[#333654]'}`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-[#9091A8] mt-0.5 leading-relaxed">{step.desc}</p>
                  {step.tip && !isDone && (
                    <p className="text-[11px] text-[#B45309] mt-1 bg-[#FEF3E2] px-2 py-1 rounded-lg">{step.tip}</p>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isDone && step.href && (
                    <Link
                      href={step.href}
                      className="flex items-center gap-1 rounded-lg bg-[#333654] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#444668] transition-colors"
                    >
                      פתח <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  {!isDone && step.manual && (
                    <button
                      onClick={() => markManualDone(step.id)}
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

      {/* All done banner */}
      {allDone && expanded && (
        <div className="flex items-center justify-between px-5 py-3 bg-[#E5F4EC] border-t border-[#BBF7D0]">
          <span className="text-sm font-bold text-[#1A7A4A]">המערכת מוכנה לשימוש!</span>
          <button onClick={dismiss} className="text-xs text-[#1A7A4A] hover:underline">הסתר</button>
        </div>
      )}
    </div>
  )
}
