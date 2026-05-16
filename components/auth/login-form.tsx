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
    <div className="flex h-screen">

      {/* ── Branding panel (shown on right in RTL) ── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #252740 0%, #333654 60%, #2a3460 100%)' }}>

        {/* Teal glow top */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(0,177,174,0.18) 0%, transparent 70%)', transform: 'translate(-25%, -25%)' }} />
        {/* Salmon glow bottom */}
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(246,142,117,0.15) 0%, transparent 70%)', transform: 'translate(20%, 20%)' }} />

        {/* Logo */}
        <div className="relative z-10 self-center bg-white rounded-2xl px-5 py-3 shadow-xl">
          <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={160} height={80} className="object-contain" />
        </div>

        {/* Center content */}
        <div className="relative z-10" dir="rtl">
          <div className="inline-block rounded-full px-3 py-1 text-[11px] font-bold mb-6"
            style={{ background: 'rgba(0,177,174,0.15)', color: '#00B1AE', border: '1px solid rgba(0,177,174,0.3)' }}>
            מערכת ניהול קייטנות
          </div>
          <h2 className="text-4xl font-black text-white leading-tight tracking-tight mb-4">
            כל מה שצריך<br />
            <span style={{ color: '#00B1AE' }}>לנהל קייטנה</span>
          </h2>
          <p className="text-white/50 text-sm leading-relaxed mb-10 max-w-[260px]">
            מערכת מרכזית לניהול קייטנות — נרשמים, כספים, מסמכים ועוד.
          </p>

          <div className="flex flex-col gap-3.5">
            {[
              { color: '#00B1AE', label: 'ניהול נרשמים ותשלומים' },
              { color: '#00B1AE', label: 'מעקב כספי בזמן אמת' },
              { color: '#F8AD1D', label: 'מסמכים, רישוי ובריאות' },
              { color: '#F68E75', label: 'הזמנת ציוד ושירותים' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <span className="text-sm text-white/60 font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-white/35 relative z-10">
          פיתוח ובניית אתר: שרה הגר 0503339770
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#F8F8F7] px-8 py-12" dir="rtl">

        {/* Mobile logo */}
        <div className="mb-8 lg:hidden">
          <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={120} height={48} className="object-contain" />
        </div>

        <div className="w-full max-w-[380px]">

          {/* White card */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E8E8E6] p-8">

            {/* Header */}
            <div className="mb-7">
              {campName && (
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F7F7] px-3 py-1 mb-4">
                  <div className="h-1.5 w-1.5 rounded-full bg-[#00B1AE]" />
                  <span className="text-[11px] font-bold text-[#00B1AE]">{campName}</span>
                </div>
              )}
              <h1 className="text-2xl font-black text-[#333654] tracking-tight mb-1.5">
                ברוכים הבאים
              </h1>
              <p className="text-[#9091A8] text-sm">
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
              className="w-full h-11 rounded-xl border border-[#E5E5E8] bg-white flex items-center justify-center gap-2 text-sm font-semibold text-[#333654] mb-4 transition-all hover:border-[#00B1AE] hover:shadow-sm disabled:opacity-60"
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
              <div className="flex-1 h-px bg-[#F0F0EE]" />
              <span className="text-xs text-[#C4C4C4]">או עם מייל וסיסמה</span>
              <div className="flex-1 h-px bg-[#F0F0EE]" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-[#333654]">כתובת מייל</label>
                <input
                  id="email" type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required dir="ltr"
                  className="h-11 rounded-xl border border-[#E5E5E8] bg-white px-4 text-sm text-[#333654] placeholder:text-[#C4C4C4] outline-none transition-all focus:border-[#00B1AE] focus:ring-2 focus:ring-[#00B1AE]/10 [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] [&:-webkit-autofill]:[color:#333654]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-[#333654]">סיסמה</label>
                <input
                  id="password" type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required dir="ltr"
                  className="h-11 rounded-xl border border-[#E5E5E8] bg-white px-4 text-sm text-[#333654] placeholder:text-[#C4C4C4] outline-none transition-all focus:border-[#00B1AE] focus:ring-2 focus:ring-[#00B1AE]/10 [&:-webkit-autofill]:shadow-[0_0_0px_1000px_white_inset] [&:-webkit-autofill]:[color:#333654]"
                />
              </div>

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="mt-1 h-11 w-full rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:opacity-90"
                style={{
                  background: 'linear-gradient(135deg, #00B1AE 0%, #009E9B 100%)',
                  boxShadow: '0 4px 16px rgba(0,177,174,0.35)',
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'התחבר למערכת'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-[#A3A3A3]">
              שכחת סיסמה?{' '}
              <a href="mailto:admin@reshetch.org.il" className="text-[#00B1AE] font-semibold hover:underline">
                פנה למנהל המערכת
              </a>
            </p>
          </div>

          {/* Mobile features */}
          <div className="mt-6 lg:hidden">
            <div className="flex flex-wrap justify-center gap-2">
              {['ניהול נרשמים', 'מעקב כספי', 'מסמכים', 'תכנון'].map(f => (
                <span key={f} className="rounded-full bg-white border border-[#E5E5E8] px-3 py-1 text-xs font-medium text-[#333654]">{f}</span>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-[#ABABAB]">
            פיתוח ובניית אתר: שרה הגר 0503339770
          </p>
        </div>
      </div>
    </div>
  )
}
