'use client'

import { useState } from 'react'
import { FileText, Copy, Check, ExternalLink } from 'lucide-react'

const AGREEMENTS = [
  {
    id: 'camp-contract',
    label: 'הסכם התקשרות',
    description: 'לניהול קייטנה עצמאי במסגרת הרשת',
    path: '/agreements/camp-contract',
  },
  {
    id: 'direct-operation',
    label: 'הסכם הפעלה ישירה',
    description: 'להפעלת קייטנה ישירה ע"י אגף מבצע חינוך',
    path: '/agreements/direct-operation',
  },
]

export function AgreementsLinks() {
  const [copied, setCopied] = useState<string | null>(null)

  function getFullUrl(path: string) {
    const base = typeof window !== 'undefined' ? window.location.origin : ''
    return base + path
  }

  async function handleCopy(id: string, path: string) {
    await navigator.clipboard.writeText(getFullUrl(path))
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      <div className="bg-[#333654] px-5 py-4 flex items-center gap-3">
        <FileText className="h-4 w-4 text-[#F8AD1D]" />
        <span className="text-sm font-bold text-white">הסכמים — קישורים לשיתוף</span>
      </div>
      <div className="divide-y divide-[#F5F5F3]">
        {AGREEMENTS.map(ag => (
          <div key={ag.id} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-[#333654]">{ag.label}</p>
              <p className="text-xs text-[#9091A8] mt-0.5">{ag.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={ag.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E5E8] px-3 text-xs font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                פתח
              </a>
              <button
                onClick={() => handleCopy(ag.id, ag.path)}
                className={[
                  'flex items-center gap-1.5 h-8 rounded-lg px-3 text-xs font-bold transition-all',
                  copied === ag.id
                    ? 'bg-[#E5F4EC] text-[#1A7A4A] border border-[#1A7A4A]/20'
                    : 'bg-[#333654] text-white hover:bg-[#444668]',
                ].join(' ')}
              >
                {copied === ag.id ? (
                  <><Check className="h-3 w-3" />הועתק!</>
                ) : (
                  <><Copy className="h-3 w-3" />העתק קישור</>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
