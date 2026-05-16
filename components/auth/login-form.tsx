'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

export function LoginForm({ campName }: { campName?: string }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleGoogleLogin() {
    setGoogleLoading(true)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) {
      toast.error('שגיאה בכניסה עם Google')
      setGoogleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error(error.message === 'Invalid login credentials' ? 'שם משתמש או סיסמה שגויים' : 'שגיאה בהתחברות')
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[38%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #0F0623 0%, #1E0D42 50%, #160A35 100%)' }}>

        {/* Soft glow blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(91,58,171,0.35) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(201,168,76,0.2) 0%, transparent 70%)', transform: 'translate(-20%, 20%)' }} />

        {/* Logo */}
        <div className="relative z-10 bg-white rounded-2xl px-5 py-3 shadow-lg">
          <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={160} height={80} className="object-contain" />
        </div>

        {/* Center content */}
        <div className="relative z-10" dir="rtl">
          <div className="inline-block rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase mb-6"
            style={{ background: 'rgba(201,168,76,0.12)', color: '#F8AD1D', border: '1px solid rgba(201,168,76,0.2)' }}>
            מערכת ניהול קייטנות
          </div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            כל מה שצריך<br />
            <span style={{ color: '#F8AD1D' }}>לנהל קייטנה</span>
          </h2>
          <p className="text-white/45 text-sm leading-relaxed mb-10 max-w-[260px]">
            מערכת מרכזית לניהול קייטנות — נרשמים, כספים, מסמכים ועוד.
          </p>

          <div className="flex flex-col gap-3.5">
            {[
              { color: '#333654', label: 'ניהול נרשמים ותשלומים' },
              { color: '#00B1AE', label: 'מעקב כספי בזמן אמת' },
              { color: '#F8AD1D', label: 'מסמכים, רישוי ובריאות' },
              { color: '#333654', label: 'הזמנת ציוד ושירותים' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-white/55 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/20 relative z-10">
          פיתוח ובניית אתר: שרה הגר 0503339770
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-8 py-12" dir="rtl">

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={120} height={48} className="object-contain" />
        </div>

        <div className="w-full max-w-[380px]">

          {/* Header */}
          <div className="mb-9">
            {campName && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F5F3] px-3 py-1 mb-4">
                <div className="h-1.5 w-1.5 rounded-full bg-[#333654]" />
                <span className="text-[11px] font-bold text-[#333654]">{campName}</span>
              </div>
            )}
            <h1 className="text-3xl font-black text-[#0A0A0A] tracking-tight mb-2">
              ברוכים הבאים
            </h1>
            <p className="text-[#737373] text-sm">
              {campName
                ? <>כניסה לניהול <span className="font-semibold text-[#333654]">{campName}</span></>
                : 'התחברו כדי לנהל את הקייטנה שלכם'
              }
            </p>
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full h-12 rounded-xl border flex items-center justify-center gap-2 text-sm font-semibold text-[#3c4043] mb-4 transition-all hover:shadow-md disabled:opacity-60"
            style={{ border: '1.5px solid #dadce0', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            כניסה עם Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-[#F0F0F0]" />
            <span className="text-xs text-[#C4C4C4]">או עם מייל וסיסמה</span>
            <div className="flex-1 h-px bg-[#F0F0F0]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-semibold text-[#0A0A0A]">
                כתובת מייל
              </label>
              <input
                id="email" type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required dir="ltr"
                className="h-12 rounded-xl border bg-white px-4 text-sm text-[#0A0A0A] placeholder:text-[#C4C4C4] outline-none transition-all"
                style={{ border: '1.5px solid #E5E5E5' }}
                onFocus={e => e.currentTarget.style.border = '1.5px solid #333654'}
                onBlur={e => e.currentTarget.style.border = '1.5px solid #E5E5E5'}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm font-semibold text-[#0A0A0A]">
                סיסמה
              </label>
              <input
                id="password" type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required dir="ltr"
                className="h-12 rounded-xl border bg-white px-4 text-sm text-[#0A0A0A] placeholder:text-[#C4C4C4] outline-none transition-all"
                style={{ border: '1.5px solid #E5E5E5' }}
                onFocus={e => e.currentTarget.style.border = '1.5px solid #333654'}
                onBlur={e => e.currentTarget.style.border = '1.5px solid #E5E5E5'}
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="mt-1 h-12 w-full rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #252740 0%, #333654 100%)',
                boxShadow: '0 4px 20px rgba(91,58,171,0.4)',
              }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'התחבר למערכת'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#A3A3A3]">
            שכחת סיסמה?{' '}
            <a href="mailto:admin@reshetch.org.il" className="text-[#333654] font-semibold hover:underline">
              פנה למנהל המערכת
            </a>
          </p>

          {/* Divider with value props — mobile only */}
          <div className="mt-10 pt-8 border-t border-[#F0F0F0] lg:hidden">
            <p className="text-xs text-[#C4C4C4] text-center mb-3">מה תמצאו במערכת</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['ניהול נרשמים', 'מעקב כספי', 'מסמכים', 'תכנון'].map(f => (
                <span key={f} className="rounded-full bg-[#FEF0EC] px-3 py-1 text-xs font-medium text-[#333654]">{f}</span>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-[#DADADA]">
          פיתוח ובניית אתר: שרה הגר 0503339770
        </p>
      </div>
    </div>
  )
}
