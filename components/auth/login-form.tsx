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
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
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
      toast.error(
        error.message === 'Invalid login credentials' ? 'שם משתמש או סיסמה שגויים' : 'שגיאה בהתחברות'
      )
      setLoading(false)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      <style>{`
        @keyframes atd-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes atd-glow-pulse {
          0%, 100% { opacity: 0.65; }
          50%       { opacity: 1; }
        }
        @keyframes atd-shimmer {
          from { left: -80%; }
          to   { left: 160%; }
        }

        .atd-a1 { animation: atd-rise 0.72s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .atd-a2 { animation: atd-rise 0.72s cubic-bezier(0.22,1,0.36,1) 0.16s both; }
        .atd-a3 { animation: atd-rise 0.72s cubic-bezier(0.22,1,0.36,1) 0.27s both; }
        .atd-a4 { animation: atd-rise 0.72s cubic-bezier(0.22,1,0.36,1) 0.38s both; }

        .atd-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
        }
        .atd-btn:not(:disabled):hover  { transform: translateY(-2px); }
        .atd-btn:not(:disabled):active { transform: translateY(0); }
        .atd-btn-sheen {
          position: absolute; top: 0; bottom: 0;
          width: 45%; left: -80%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: skewX(-12deg);
          pointer-events: none;
        }
        .atd-btn:not(:disabled):hover .atd-btn-sheen {
          animation: atd-shimmer 0.52s ease;
        }

        .atd-input {
          width: 100%; box-sizing: border-box;
          transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
          outline: none;
        }

        .atd-forgot { transition: opacity 0.18s ease; }
        .atd-forgot:hover { opacity: 0.65; }
      `}</style>

      <div className="flex min-h-screen">

        {/* ══════════════════════════════════════
            FORM PANEL — left side (~40%)
            ══════════════════════════════════════ */}
        <div
          className="flex flex-1 flex-col items-center justify-center px-8 py-12 relative"
          style={{ background: '#F3F0EC', minHeight: '100vh' }}
        >
          {/* Ambient warm glow */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: [
              'radial-gradient(ellipse 70% 45% at 50% 0%, rgba(212,176,106,0.08) 0%, transparent 100%)',
              'radial-gradient(ellipse 70% 45% at 50% 100%, rgba(67,40,116,0.06) 0%, transparent 100%)',
            ].join(', '),
          }} />

          {/* Mobile: logo */}
          <div className="mb-8 lg:hidden relative z-10 atd-a1 text-center" dir="rtl">
            <div style={{ margin: '0 auto 14px', display: 'flex', justifyContent: 'center' }}>
              <Image
                src="/logo-chabad.png"
                alt="רשת חינוך חב״ד"
                width={180} height={72}
                style={{ objectFit: 'contain', display: 'block' }}
              />
            </div>
            <p style={{ fontWeight: 900, fontSize: '19px', color: '#1A1228', letterSpacing: '-0.02em', fontFamily: 'inherit' }}>
              עתודות לשליחות
            </p>
          </div>

          {/* Form card */}
          <div className="atd-a4 relative z-10 w-full" style={{ maxWidth: '372px' }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '26px',
              padding: '44px 40px',
              boxShadow: [
                '0 2px 4px rgba(0,0,0,0.02)',
                '0 20px 56px rgba(67,40,116,0.1)',
                'inset 0 1px 0 rgba(255,255,255,1)',
              ].join(', '),
              border: '1px solid rgba(67,40,116,0.07)',
            }}>

              {/* Header */}
              <div dir="rtl" style={{ marginBottom: '30px' }}>
                {campName && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    borderRadius: '100px', background: '#EDE8F8',
                    padding: '5px 13px', marginBottom: '16px',
                  }}>
                    <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#5B3FA3', flexShrink: 0 }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#5B3FA3' }}>{campName}</span>
                  </div>
                )}
                <h1 style={{
                  fontSize: '26px', fontWeight: 900, color: '#1A1228',
                  letterSpacing: '-0.025em', lineHeight: 1.18, marginBottom: '7px',
                  fontFamily: 'inherit',
                }}>
                  כניסה למערכת
                </h1>
                <p style={{ color: '#7B6B92', fontSize: '14px', lineHeight: 1.6, fontWeight: 400 }}>
                  {campName
                    ? <><span style={{ fontWeight: 700, color: '#432874' }}>{campName}</span> — הכניסו פרטים להתחברות</>
                    : 'ברוכים הבאים — הכניסו את פרטיכם'
                  }
                </p>
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || loading}
                dir="rtl"
                style={{
                  width: '100%', height: '48px', borderRadius: '14px', marginBottom: '20px',
                  border: '1.5px solid #dadce0', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  fontSize: '14px', fontWeight: 700, color: '#3c4043', cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,.08)', fontFamily: 'inherit',
                  opacity: (googleLoading || loading) ? 0.7 : 1,
                  transition: 'box-shadow .18s',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.14)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)' }}
              >
                {googleLoading ? <Loader2 size={16} className="animate-spin" /> : (
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                כניסה עם Google
              </button>

              <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ flex: 1, height: '1px', background: '#E0D8EE' }} />
                <span style={{ fontSize: '12px', color: '#B0A4C4', whiteSpace: 'nowrap' }}>או עם מייל וסיסמה</span>
                <div style={{ flex: 1, height: '1px', background: '#E0D8EE' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} dir="rtl" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label htmlFor="email" style={{ fontSize: '13px', fontWeight: 700, color: '#1A1228', letterSpacing: '-0.01em' }}>
                    כתובת מייל
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="atd-input"
                    style={{
                      height: '52px', borderRadius: '14px',
                      border: emailFocused ? '1.5px solid #5B3FA3' : '1.5px solid #E0D8EE',
                      boxShadow: emailFocused
                        ? '0 0 0 3.5px rgba(91,63,163,0.11), 0 2px 8px rgba(91,63,163,0.06)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      background: emailFocused ? '#FDFBFF' : '#F9F7FB',
                      padding: '0 16px',
                      fontSize: '14px', color: '#1A1228',
                    }}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  <label htmlFor="password" style={{ fontSize: '13px', fontWeight: 700, color: '#1A1228', letterSpacing: '-0.01em' }}>
                    סיסמה
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    dir="ltr"
                    className="atd-input"
                    style={{
                      height: '52px', borderRadius: '14px',
                      border: passwordFocused ? '1.5px solid #5B3FA3' : '1.5px solid #E0D8EE',
                      boxShadow: passwordFocused
                        ? '0 0 0 3.5px rgba(91,63,163,0.11), 0 2px 8px rgba(91,63,163,0.06)'
                        : '0 1px 3px rgba(0,0,0,0.04)',
                      background: passwordFocused ? '#FDFBFF' : '#F9F7FB',
                      padding: '0 16px',
                      fontSize: '14px', color: '#1A1228',
                    }}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="atd-btn"
                  style={{
                    marginTop: '4px',
                    height: '56px', width: '100%', borderRadius: '16px',
                    background: loading
                      ? 'rgba(67,40,116,0.32)'
                      : 'linear-gradient(135deg, #2D1268 0%, #432874 38%, #5B3FA3 78%, #6B50C8 100%)',
                    boxShadow: loading ? 'none' : '0 6px 22px rgba(67,40,116,0.38), inset 0 1px 0 rgba(255,255,255,0.12)',
                    color: '#FFFFFF', fontSize: '15px', fontWeight: 800,
                    border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    letterSpacing: '-0.01em', fontFamily: 'inherit',
                  }}
                >
                  <span className="atd-btn-sheen" />
                  {loading
                    ? <Loader2 className="animate-spin" style={{ width: '20px', height: '20px' }} />
                    : 'כניסה למערכת'
                  }
                </button>
              </form>
            </div>

            {/* Forgot password */}
            <p dir="rtl" style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#9E91B2' }}>
              שכחת סיסמה?{' '}
              <a
                href="mailto:admin@reshetch.org.il"
                className="atd-forgot"
                style={{ color: '#432874', fontWeight: 700, textDecoration: 'none' }}
              >
                פנה למנהל המערכת
              </a>
            </p>

            {/* Mobile tags */}
            <div className="mt-8 pt-6 lg:hidden" dir="rtl"
              style={{ borderTop: '1px solid rgba(67,40,116,0.08)' }}>
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#C4B8D8', marginBottom: '10px' }}>
                כלים במערכת
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {['ניהול מתמחים', 'מסלולי הכשרה', 'מוסדות', 'מסמכים'].map(f => (
                  <span key={f} style={{
                    borderRadius: '100px', background: '#EDE8F8',
                    padding: '5px 13px', fontSize: '11.5px', fontWeight: 600, color: '#432874',
                  }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            HERO PANEL — right side (60%)
            ══════════════════════════════════════ */}
        <div
          className="hidden lg:flex flex-col justify-between relative overflow-hidden"
          style={{
            width: '60%',
            padding: '56px 54px',
            background: 'linear-gradient(148deg, #0D0621 0%, #1C0B43 26%, #301578 58%, #1E0C48 100%)',
          }}
        >
          {/* ── Glow orbs ── */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{
              position: 'absolute', top: '-10%', left: '-6%',
              width: '520px', height: '520px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,176,106,0.19) 0%, rgba(212,176,106,0.06) 38%, transparent 68%)',
            }} />
            <div style={{
              position: 'absolute', top: '28%', right: '0%',
              width: '400px', height: '400px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 64%)',
              animation: 'atd-glow-pulse 5s ease-in-out infinite',
            }} />
            <div style={{
              position: 'absolute', bottom: '-14%', left: '18%',
              width: '420px', height: '420px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(91,58,171,0.22) 0%, transparent 65%)',
            }} />
            <div style={{
              position: 'absolute', bottom: '18%', right: '6%',
              width: '160px', height: '160px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(212,176,106,0.1) 0%, transparent 70%)',
            }} />
          </div>

          {/* ── Judaica geometric pattern (Magen David tiled) ── */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.9 }}>
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
              <defs>
                {/* Two overlapping triangles forming a Star of David */}
                <pattern id="atd-star" x="0" y="0" width="100" height="115" patternUnits="userSpaceOnUse">
                  {/* Triangle pointing up */}
                  <polygon
                    points="50,17.5 84.6,77.5 15.4,77.5"
                    fill="none"
                    stroke="rgba(212,176,106,0.055)"
                    strokeWidth="0.9"
                  />
                  {/* Triangle pointing down */}
                  <polygon
                    points="50,97.5 15.4,37.5 84.6,37.5"
                    fill="none"
                    stroke="rgba(212,176,106,0.055)"
                    strokeWidth="0.9"
                  />
                  {/* Center point */}
                  <circle cx="50" cy="57.5" r="1.2" fill="rgba(212,176,106,0.06)" />
                </pattern>
                {/* Subtle grid underlay */}
                <pattern id="atd-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.4" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#atd-grid)" />
              <rect width="100%" height="100%" fill="url(#atd-star)" />
            </svg>
          </div>

          {/* ── Diagonal light wash ── */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(118deg, rgba(212,176,106,0.05) 0%, transparent 42%, rgba(139,92,246,0.06) 100%)',
          }} />

          {/* ── TOP: logo + wordmark ── */}
          <div className="atd-a1 relative z-10">
            <div dir="rtl" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div>
                <Image
                  src="/logo-chabad.png"
                  alt="רשת חינוך חב״ד"
                  width={170} height={68}
                  style={{ objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)', opacity: 0.88 }}
                />
                <p style={{ color: 'rgba(212,176,106,0.7)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '8px' }}>
                  עתודות לשליחות
                </p>
              </div>
            </div>
          </div>

          {/* ── MIDDLE: main brand message ── */}
          <div className="atd-a2 relative z-10" dir="rtl">

            {/* Status badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              borderRadius: '100px', padding: '6px 15px', marginBottom: '28px',
              background: 'rgba(212,176,106,0.09)',
              border: '1px solid rgba(212,176,106,0.22)',
              backdropFilter: 'blur(8px)',
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', display: 'inline-block', flexShrink: 0,
                background: '#D4B06A',
                boxShadow: '0 0 8px rgba(212,176,106,0.65)',
                animation: 'atd-glow-pulse 2.5s ease-in-out infinite',
              }} />
              <span style={{ color: '#D4B06A', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                מערכת ליווי והכשרה
              </span>
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: '44px', fontWeight: 900, color: '#FFFFFF',
              lineHeight: 1.12, letterSpacing: '-0.025em', marginBottom: '20px',
              textShadow: '0 2px 28px rgba(0,0,0,0.22)',
              fontFamily: 'inherit',
            }}>
              בונים את דור<br />
              <span style={{
                background: 'linear-gradient(130deg, #D4B06A 0%, #EDD89C 50%, #C49A50 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                שלוחי החינוך הבא
              </span>
            </h1>

            {/* Subtitle */}
            <p style={{
              color: 'rgba(255,255,255,0.46)', fontSize: '15px',
              lineHeight: 1.74, maxWidth: '340px', marginBottom: '44px',
              fontWeight: 400,
            }}>
              פלטפורמת הניהול וההכשרה של עתודות לשליחות — כלים מקצועיים לליווי, תיעוד ופיתוח מנהיגות חינוכית.
            </p>

            {/* Glassmorphism feature card */}
            <div style={{
              borderRadius: '22px', padding: '26px 30px',
              background: 'rgba(255,255,255,0.035)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(18px)',
              boxShadow: '0 8px 48px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>
              {[
                { label: 'ניהול ומעקב אחר מתמחים ושלוחים', gold: true },
                { label: 'תיעוד מסלולי הכשרה והתפתחות', gold: false },
                { label: 'ניהול מוסדות ומסגרות חינוכיות', gold: true },
                { label: 'כלי הערכה, דוחות ומסמכים', gold: false },
              ].map(({ label, gold }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }} dir="rtl">
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: gold ? 'rgba(212,176,106,0.12)' : 'rgba(155,127,232,0.12)',
                    border: `1px solid ${gold ? 'rgba(212,176,106,0.22)' : 'rgba(155,127,232,0.22)'}`,
                  }}>
                    <span style={{ fontSize: '9px', color: gold ? '#D4B06A' : '#9B7FE8', lineHeight: 1 }}>✦</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.62)', fontSize: '13.5px', fontWeight: 500, lineHeight: 1.4 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM: footer divider ── */}
          <div className="atd-a3 relative z-10" dir="rtl">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
              <span style={{ color: 'rgba(255,255,255,0.18)', fontSize: '11px', fontWeight: 500, letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                עתודות לשליחות © 2025
              </span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            </div>
          </div>
        </div>

      </div>
    </>
  )
}
