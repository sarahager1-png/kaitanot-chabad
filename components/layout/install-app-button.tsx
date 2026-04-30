'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform() {
  if (typeof navigator === 'undefined') return 'other'
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

export function InstallAppButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const platform = detectPlatform()

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }
    function handler(e: Event) {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setIsInstalled(true))
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (isInstalled) return null

  async function handleClick() {
    if (prompt) {
      await prompt.prompt()
      const { outcome } = await prompt.userChoice
      if (outcome === 'accepted') setIsInstalled(true)
      setPrompt(null)
    } else {
      setShowTooltip(v => !v)
    }
  }

  const instructions = platform === 'ios'
    ? 'לחצו על כפתור השיתוף ↑ ואז "הוסף למסך הבית"'
    : platform === 'android'
    ? 'לחצו על תפריט ⋮ בדפדפן ← "הוסף למסך הבית"'
    : 'לחצו על אייקון ⊕ בשורת הכתובת של Chrome/Edge'

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        title="התקן כאפליקציה"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#F5F5F3] hover:text-[#333654] transition-colors"
      >
        <Download className="h-4 w-4" />
        <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#F8AD1D]" />
      </button>

      {showTooltip && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowTooltip(false)} />
          <div className="absolute left-0 top-11 z-50 w-64 rounded-2xl border border-[#E5E5E8] bg-white shadow-xl p-4" dir="rtl">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#F5F5F3]">
                  <Smartphone className="h-4 w-4 text-[#333654]" />
                </div>
                <p className="text-sm font-black text-[#333654]">התקנה כאפליקציה</p>
              </div>
              <button onClick={() => setShowTooltip(false)} className="text-[#A3A3A3] hover:text-[#6B6D8A]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-[#6B6D8A] leading-relaxed">{instructions}</p>
            {platform === 'ios' && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#F5F5F3] px-3 py-2">
                <Share className="h-4 w-4 text-[#333654] flex-shrink-0" />
                <p className="text-xs text-[#333654] font-medium">כפתור השיתוף נמצא בתחתית המסך ב-Safari</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
