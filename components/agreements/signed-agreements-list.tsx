'use client'

import { useState } from 'react'
import { CheckCircle, FileText, Printer, X } from 'lucide-react'

interface SignedAgreement {
  id: string
  agreement_type: 'camp-contract' | 'direct-operation'
  city: string | null
  emissary: string | null
  camp_year: string | null
  sign_day: string | null
  sign_place: string | null
  signature_data: string | null
  created_at: string
}

const TYPE_LABELS: Record<string, string> = {
  'camp-contract': 'הסכם התקשרות',
  'direct-operation': 'הסכם הפעלה ישירה',
}

export function SignedAgreementsList({ agreements }: { agreements: SignedAgreement[] }) {
  const [preview, setPreview] = useState<SignedAgreement | null>(null)

  if (agreements.length === 0) {
    return (
      <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm">
        <div className="bg-[#F5F5F3] px-5 py-4 border-b border-[#E5E5E8] flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-[#9091A8]" />
          <span className="text-sm font-bold text-[#333654]">הסכמים חתומים</span>
          <span className="mr-auto text-xs text-[#9091A8]">0 הסכמים</span>
        </div>
        <div className="py-16 text-center text-sm text-[#9091A8]">
          טרם התקבלו הסכמים חתומים
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
        <div className="bg-[#333654] px-5 py-4 flex items-center gap-3">
          <CheckCircle className="h-4 w-4 text-[#F8AD1D]" />
          <span className="text-sm font-bold text-white">הסכמים חתומים</span>
          <span className="mr-auto text-xs text-white/50">{agreements.length} הסכמים</span>
        </div>
        <div className="divide-y divide-[#F5F5F3]">
          {agreements.map(ag => (
            <div key={ag.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#F9F9F7] transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F0EC] shrink-0">
                <FileText className="h-4 w-4 text-[#333654]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#333654]">{TYPE_LABELS[ag.agreement_type] ?? ag.agreement_type}</p>
                <p className="text-xs text-[#9091A8] mt-0.5">
                  {[ag.emissary, ag.city].filter(Boolean).join(' — ')}
                  {ag.sign_day ? ` · ${ag.sign_day}` : ''}
                </p>
              </div>
              <div className="text-xs text-[#9091A8] shrink-0">
                {new Date(ag.created_at).toLocaleDateString('he-IL')}
              </div>
              {ag.signature_data && (
                <button
                  onClick={() => setPreview(ag)}
                  className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E5E8] px-3 text-xs font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors shrink-0"
                >
                  צפה בחתימה
                </button>
              )}
              <a
                href={`/agreements/print/${ag.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 h-8 rounded-lg border border-[#E5E5E8] px-3 text-xs font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors shrink-0"
              >
                <Printer className="h-3 w-3" />
                הדפס
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Signature preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-black text-[#333654]">{TYPE_LABELS[preview.agreement_type]}</p>
                <p className="text-xs text-[#9091A8]">{[preview.emissary, preview.city].filter(Boolean).join(' — ')}</p>
              </div>
              <button onClick={() => setPreview(null)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F5F5F3] text-[#9091A8] hover:text-[#333654]">
                <X className="h-4 w-4" />
              </button>
            </div>
            {preview.signature_data && (
              <div className="rounded-xl border-2 border-dashed border-[#C9A84C] bg-[#FDFCF8] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview.signature_data} alt="חתימה" className="w-full object-contain" style={{ maxHeight: 120 }} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-[#6B6D8A]">
              {preview.sign_day && <div><span className="font-bold">תאריך:</span> {preview.sign_day}</div>}
              {preview.sign_place && <div><span className="font-bold">מקום:</span> {preview.sign_place}</div>}
              {preview.camp_year && <div><span className="font-bold">שנה:</span> {preview.camp_year}</div>}
              <div><span className="font-bold">נקלט:</span> {new Date(preview.created_at).toLocaleDateString('he-IL')}</div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
