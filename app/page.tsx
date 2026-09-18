import Image from 'next/image'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#features', label: 'מודולים' },
  { href: '#roles',    label: 'תפקידים' },
  { href: '#flow',     label: 'תהליך' },
]

const MODULES = [
  { emoji: '👥', title: 'ניהול נרשמים',   desc: 'טופס הרשמה מובנה, מעקב תשלומים, רשימת המתנה ומידע רפואי.', bar: 'bar-teal'   },
  { emoji: '💳', title: 'מעקב כספי',      desc: 'הכנסות, הוצאות, גרפים חודשיים וחישוב ממוצע לילד.',           bar: 'bar-yellow' },
  { emoji: '📋', title: 'מסמכים ורישוי',  desc: 'אחסון מסמכי בריאות, רישיונות ואישורים עם חתימות דיגיטליות.', bar: 'bar-salmon' },
  { emoji: '👩‍💼', title: 'ניהול צוות',    desc: 'רשומות מדריכים, תפקידים, הסכמי עבודה ותיאום.',               bar: 'bar-teal'   },
  { emoji: '🗓️', title: 'תכנון יומי',     desc: 'לוח זמנים, פעילויות לפי קבוצות ותוכנית מסודרת.',              bar: 'bar-yellow' },
  { emoji: '🚌', title: 'הזמנת שירותים',  desc: 'הזמנת אוטובוסים, ציוד ופעילויות עם מעקב סטטוס.',             bar: 'bar-salmon' },
  { emoji: '✅', title: 'נוכחות ומעקב',   desc: 'רישום נוכחות יומי, מעקב הגעה ודוחות סיכום.',                  bar: 'bar-teal'   },
  { emoji: '📊', title: 'דוחות וייצוא',   desc: 'ייצוא לאקסל בלחיצה אחת, הדפסת כרטיסי ילד ודוחות מותאמים.',  bar: 'bar-yellow' },
  { emoji: '🔔', title: 'התראות חכמות',   desc: 'עדכונים על בקשות, מסמכים שפגו ואירועים הדורשים תשומת לב.',   bar: 'bar-salmon' },
]

const ROLES = [
  {
    badge: 'שליח / מנהל קייטנה',
    headline: 'כל כלי הניהול לקייטנה שלך',
    cardClass: 'role-card-teal',
    dividerClass: 'role-divider-teal',
    badgeClass: 'badge-teal',
    dotClass: 'dot-teal',
    items: [
      'ניהול נרשמים, תשלומים וכרטיסי ילד',
      'מעקב כספי ודוחות תקציב',
      'תכנון יומי וניהול צוות',
      'הזמנת שירותים ואוטובוסים',
    ],
  },
  {
    badge: 'מנהל רשת',
    headline: 'תמונה רשתית מלאה',
    cardClass: 'role-card-yellow',
    dividerClass: 'role-divider-yellow',
    badgeClass: 'badge-yellow',
    dotClass: 'dot-yellow',
    items: [
      'צפייה מרוכזת בכל הקייטנות',
      'דוחות השוואה ומגמות',
      'אישור טיולים ובקשות מיוחדות',
      'ניהול הגדרות ברמת הרשת',
    ],
  },
  {
    badge: 'אדמין מערכת',
    headline: 'שליטה מלאה',
    cardClass: 'role-card-salmon',
    dividerClass: 'role-divider-salmon',
    badgeClass: 'badge-salmon',
    dotClass: 'dot-salmon',
    items: [
      'ניהול משתמשים והרשאות',
      'הגדרות מערכת מתקדמות',
      'ניהול ספקים ושירותים',
      'גישה לכלל הנתונים',
    ],
  },
]

const STEPS = [
  { n: '01', title: 'הורה נרשם',      desc: 'טופס הרשמה מקוון זמין מכל מכשיר',        iconClass: 'step-teal'   },
  { n: '02', title: 'תשלום ואישור',   desc: 'מעקב תשלום ואישור הרשמה אוטומטי',        iconClass: 'step-yellow' },
  { n: '03', title: 'ניהול שוטף',     desc: 'נוכחות, תכנון ומסמכים ביום יום',          iconClass: 'step-salmon' },
  { n: '04', title: 'דוחות וסיכום',   desc: 'ייצוא נתונים ותובנות לסיום העונה',        iconClass: 'step-teal'   },
]

export default function LandingPage() {
  return (
    <div dir="rtl" className="min-h-screen font-sans">

      {/* ══ NAV ══ */}
      <nav className="lp-nav sticky top-0 z-50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="lp-logo-box rounded-xl px-2.5 py-1.5">
              <Image
                src="/logo-kaitanot.jpg"
                alt='קייטנות חב"ד'
                width={72}
                height={32}
                className="object-contain block"
              />
            </div>
            <span className="hidden sm:block text-sm font-bold text-white/60 tracking-wide">
              קייטנות חב&quot;ד
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="lp-nav-link px-3 py-1.5 text-sm font-medium rounded-lg">
                {l.label}
              </a>
            ))}
          </div>

          <Link href="/login" className="lp-btn-teal-sm px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200">
            כניסה למערכת
          </Link>
        </div>
      </nav>

      {/* ══ HERO ══ */}
      <section className="lp-hero relative flex items-center justify-center overflow-hidden">
        <div className="lp-grid absolute inset-0 pointer-events-none" />
        <div className="lp-glow-teal absolute pointer-events-none" />
        <div className="lp-glow-salmon absolute pointer-events-none" />

        <div className="relative z-10 text-center px-6 py-24 max-w-3xl mx-auto">
          <div className="lp-eyebrow-teal inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-bold tracking-widest uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B1AE] animate-pulse" />
            מערכת ניהול · קייטנות חב&quot;ד
          </div>

          <h1 className="font-black text-white mb-6 leading-[1.08] text-[clamp(40px,7vw,72px)] tracking-tight">
            הכלי המרכזי לניהול<br />
            <span className="lp-headline-gradient">קייטנות חב&quot;ד</span>
          </h1>

          <p className="text-white/45 leading-relaxed mb-10 mx-auto max-w-lg text-[clamp(15px,2.5vw,18px)]">
            מנרשם הראשון ועד סיכום העונה — ניהול נרשמים, כספים, מסמכים, צוות ותכנון,
            הכל בממשק אחד מרוכז.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="lp-btn-teal px-8 py-3.5 text-base font-bold rounded-xl transition-all duration-200 min-w-[180px]">
              כניסה למערכת
            </Link>
            <a href="#features" className="lp-btn-outline px-8 py-3.5 text-base font-semibold rounded-xl transition-all duration-200 min-w-[180px]">
              גלה את הפיצ&apos;רים ↓
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
            {['ניהול מרכזי', 'בזמן אמת', '3 רמות הרשאה', 'ייצוא לאקסל'].map(chip => (
              <span key={chip} className="lp-trust-chip text-xs font-semibold rounded-full px-3 py-1">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section id="features" className="bg-white">
        <div className="max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="lp-modules-eyebrow inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold tracking-widest uppercase">
            מודולים במערכת
          </div>
          <h2 className="font-black text-[#0D0F1A] mb-4 text-[clamp(28px,4vw,42px)] tracking-tight">
            כלים לכל היבט של הקייטנה
          </h2>
          <p className="text-neutral-500 mx-auto max-w-[420px] text-base leading-relaxed">
            מהרשמה הראשונה ועד סיכום הקייטנה — הכל נמצא בממשק אחד
          </p>
        </div>

        <div className="max-w-6xl mx-auto px-6 pb-24">
          <div className="grid gap-px bg-neutral-100 rounded-2xl overflow-hidden [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
            {MODULES.map(m => (
              <div key={m.title} className="group bg-white p-7 hover:bg-neutral-50 transition-colors duration-200 cursor-default">
                <div className="text-3xl mb-4">{m.emoji}</div>
                <h3 className="font-bold text-[#0D0F1A] mb-2 text-[15px] tracking-tight">{m.title}</h3>
                <p className="text-neutral-500 leading-relaxed text-[13px]">{m.desc}</p>
                <div className={`${m.bar} mt-4 h-0.5 w-8 rounded-full transition-all duration-300 group-hover:w-16`} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ ROLES ══ */}
      <section id="roles" className="py-24 px-6 bg-[#F7F7F5]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="lp-eyebrow-yellow inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold tracking-widest uppercase">
              הרשאות ותפקידים
            </div>
            <h2 className="font-black text-[#0D0F1A] mb-4 text-[clamp(28px,4vw,42px)] tracking-tight">
              מותאם לכל תפקיד
            </h2>
            <p className="text-neutral-500 mx-auto max-w-[380px] text-base leading-relaxed">
              כל משתמש רואה בדיוק מה שרלוונטי לתפקידו
            </p>
          </div>

          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {ROLES.map(r => (
              <div key={r.badge} className={`${r.cardClass} rounded-2xl border overflow-hidden`}>
                <div className="px-6 pt-6 pb-5">
                  <span className={`${r.badgeClass} inline-block text-xs font-bold rounded-full px-3 py-1 mb-4`}>
                    {r.badge}
                  </span>
                  <h3 className="font-bold text-[#0D0F1A] text-[18px] tracking-tight">{r.headline}</h3>
                </div>
                <div className={`${r.dividerClass} mx-6 h-px`} />
                <ul className="px-6 py-5 space-y-3">
                  {r.items.map(item => (
                    <li key={item} className="flex items-center gap-3 text-sm text-neutral-700">
                      <span className={`${r.dotClass} h-1.5 w-1.5 rounded-full flex-shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FLOW ══ */}
      <section id="flow" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="lp-eyebrow-salmon inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5 text-xs font-bold tracking-widest uppercase">
              איך זה עובד
            </div>
            <h2 className="font-black text-[#0D0F1A] text-[clamp(28px,4vw,42px)] tracking-tight">
              מהרשמה לסיכום עונה
            </h2>
          </div>

          <div className="relative">
            <div className="lp-flow-connector absolute top-7 inset-x-0 h-px hidden md:block" />
            <div className="grid gap-8 relative z-10 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {STEPS.map(step => (
                <div key={step.n} className="flex flex-col items-center text-center">
                  <div className={`${step.iconClass} w-14 h-14 rounded-2xl flex items-center justify-center mb-5 font-black text-white text-lg`}>
                    {step.n}
                  </div>
                  <h4 className="font-bold text-[#0D0F1A] mb-2 text-[15px] tracking-tight">{step.title}</h4>
                  <p className="text-neutral-500 leading-relaxed text-[13px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section className="lp-cta-section relative overflow-hidden py-28 px-6 text-center">
        <div className="lp-grid absolute inset-0 pointer-events-none opacity-30" />
        <div className="lp-cta-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[800px] h-[400px]" />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="font-black text-white mb-4 text-[clamp(32px,5vw,52px)] tracking-tight leading-[1.1]">
            מוכנים להתחיל?
          </h2>
          <p className="text-white/40 mb-10 text-[17px] leading-relaxed">
            התחברו עכשיו וגשו לניהול הקייטנה שלכם
          </p>
          <Link href="/login" className="lp-btn-teal-lg inline-block px-10 py-4 font-bold rounded-xl text-base transition-all duration-200">
            כניסה למערכת
          </Link>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer className="py-6 px-6 border-t border-white/[0.06] bg-[#0A0C15] text-center">
        <p className="text-[12px] text-white/25">
          מערכת קייטנות חב&quot;ד
        </p>
      </footer>
    </div>
  )
}
