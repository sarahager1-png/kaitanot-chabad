'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export function SplashScreen() {
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    // Show only in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (!isStandalone) return

    // Only show on first load (not on every navigation)
    const key = 'splash_shown_' + new Date().toDateString()
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')

    setVisible(true)
    const fadeTimer = setTimeout(() => setFading(true), 1800)
    const hideTimer = setTimeout(() => setVisible(false), 2300)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{
        background: 'linear-gradient(160deg, #0F0623 0%, #1E0D42 50%, #160A35 100%)',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,177,174,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }} />

      <div className="relative flex flex-col items-center gap-5">
        <Image
          src="/logo-kaitanot.jpg"
          alt='קייטנות חב"ד'
          width={200}
          height={100}
          className="object-contain"
          priority
        />
        <div className="h-px w-24" style={{ background: 'linear-gradient(90deg, transparent, #F8AD1D, transparent)' }} />
        <p className="text-sm font-bold tracking-widest" style={{ color: '#F8AD1D', letterSpacing: '0.2em' }}>
          מערכת ניהול קייטנות
        </p>
      </div>

      {/* Loading ring */}
      <div className="absolute bottom-14">
        <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-[#F8AD1D]"
          style={{ animation: 'spin 1s linear infinite' }} />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
