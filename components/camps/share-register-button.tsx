'use client'

import { useState } from 'react'
import { Share2, Copy, Check, MessageCircle, LogIn } from 'lucide-react'

interface Props {
  campId: string
  campName: string
}

export function ShareRegisterButton({ campId, campName }: Props) {
  const [copied, setCopied] = useState(false)
  const [copiedLogin, setCopiedLogin] = useState(false)
  const [open, setOpen] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${origin}/register?camp=${campId}`
  const loginUrl = `${origin}/login?camp=${campId}`
  const whatsappText = `שלום! רישום לקייטנת *${campName}* פתוח 🏕️\nלחצו על הקישור למילוי טופס הרישום:\n${url}`

  function copyLoginLink() {
    navigator.clipboard.writeText(loginUrl)
    setCopiedLogin(true)
    setTimeout(() => setCopiedLogin(false), 2000)
  }

  function copyLink() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function sendWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank')
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[#E5E5E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#6B6D8A] hover:border-[#25D366] hover:text-[#25D366] transition-colors">
        <Share2 className="h-3.5 w-3.5" />שתף רישום
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-10 z-20 w-72 rounded-2xl border border-[#E5E5E8] bg-white shadow-xl p-4 flex flex-col gap-3">
            <p className="text-xs font-black text-[#9F8EC4] uppercase tracking-wide">שיתוף טופס רישום</p>

            {/* URL preview */}
            <div className="flex items-center gap-2 bg-[#F8F7FF] rounded-lg px-3 py-2 border border-[#E5E5E8]">
              <span className="text-xs text-[#6B6D8A] truncate flex-1 dir-ltr text-left" dir="ltr">{url}</span>
              <button onClick={copyLink} className="flex-shrink-0 text-[#333654] hover:text-[#252740] transition-colors">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* WhatsApp button */}
            <button onClick={sendWhatsApp}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
              style={{background: 'linear-gradient(90deg, #25D366, #128C7E)'}}>
              <MessageCircle className="h-4 w-4" />
              שלח בוואטסאפ
            </button>

            {/* Message preview */}
            <div className="bg-[#E7FFDB] rounded-xl p-3 text-xs text-[#1A3A1A] leading-relaxed whitespace-pre-line border border-[#B2EFA0]">
              {whatsappText}
            </div>

            {/* Divider */}
            <div className="border-t border-[#FEF0EC]" />

            {/* Login link for shliach */}
            <p className="text-xs font-black text-[#9F8EC4] uppercase tracking-wide">קישור כניסה לשליח</p>
            <div className="flex items-center gap-2 bg-[#F8F7FF] rounded-lg px-3 py-2 border border-[#E5E5E8]">
              <LogIn className="h-3.5 w-3.5 text-[#333654] flex-shrink-0" />
              <span className="text-xs text-[#6B6D8A] truncate flex-1" dir="ltr">{loginUrl}</span>
              <button onClick={copyLoginLink} className="flex-shrink-0 text-[#333654] hover:text-[#252740] transition-colors">
                {copiedLogin ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-[#A3A3A3] -mt-1">קישור זה יציג את שם הקייטנה במסך הכניסה</p>
          </div>
        </>
      )}
    </div>
  )
}
