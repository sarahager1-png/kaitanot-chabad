'use client'

import { useState, useEffect, useCallback } from 'react'
import { Printer, Save, RotateCcw, FileText } from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'

const LS_KEY = 'kaitanot_director_contract_v2'

type Gender = 'female' | 'male'

interface ContractFields {
  gender: Gender
  employerName: string
  employerPhone: string
  directorName: string
  directorId: string
  directorPhone: string
  startDate: string
  endDate: string
  workHoursFrom: string
  workHoursTo: string
  salaryType: 'total' | 'daily'
  salaryAmount: string
  paymentTerms: string
  noticeDays: string
}

const EMPTY: ContractFields = {
  gender: 'female',
  employerName: '',
  employerPhone: '',
  directorName: '',
  directorId: '',
  directorPhone: '',
  startDate: '',
  endDate: '',
  workHoursFrom: '08:00',
  workHoursTo: '14:00',
  salaryType: 'total',
  salaryAmount: '',
  paymentTerms: 'העברה בנקאית',
  noticeDays: '3',
}

const PAYMENT_OPTIONS = ['מזומן', 'העברה בנקאית', 'לפי אבני דרך']

/* helpers */
function f(v: string, fallback: string) { return v.trim() || fallback }

function fDate(v: string) {
  if (!v) return '_____ / _____ / _____'
  return new Date(v).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fDateParts(v: string) {
  if (!v) return { day: '______', month: '______', year: '______' }
  const d = new Date(v)
  return {
    day: d.toLocaleDateString('he-IL', { day: 'numeric' }),
    month: d.toLocaleDateString('he-IL', { month: 'long' }),
    year: d.getFullYear().toString(),
  }
}

/* gender-sensitive labels */
function g(gender: Gender, female: string, male: string) {
  return gender === 'female' ? female : male
}

/* ─────────────────────────────────────────── */
export function DirectorContractClient() {
  const [fields, setFields] = useState<ContractFields>(EMPTY)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) setFields({ ...EMPTY, ...JSON.parse(raw) })
    } catch { /* ignore */ }
  }, [])

  const set = useCallback(<K extends keyof ContractFields>(key: K, val: ContractFields[K]) => {
    setFields(prev => ({ ...prev, [key]: val }))
    setSaved(false)
  }, [])

  function handleSave() {
    localStorage.setItem(LS_KEY, JSON.stringify(fields))
    setSaved(true)
    toast.success('הטיוטה נשמרה')
  }

  function handleReset() {
    if (!confirm('למחוק את כל הנתונים ולהתחיל מחדש?')) return
    setFields(EMPTY)
    localStorage.removeItem(LS_KEY)
    setSaved(false)
  }

  const { gender } = fields
  const signDate = fDateParts(fields.startDate)

  const directorLabel = g(gender, 'המנהלת', 'המנהל')
  const directorTitle = g(gender, 'מנהלת קייטנה', 'מנהל קייטנה')
  const directorPronoun = g(gender, 'המועסקת', 'המועסק')
  const directorVerb = g(gender, 'מתחייבת', 'מתחייב')
  const directorVerb2 = g(gender, 'אחראית', 'אחראי')

  const salary =
    fields.salaryType === 'total'
      ? `שכר כולל לתקופה: ${f(fields.salaryAmount, '__________')} ₪`
      : `שכר יומי: ${f(fields.salaryAmount, '__________')} ₪`

  const inputCls = 'h-9 w-full rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#F8AD1D] focus:outline-none focus:ring-1 focus:ring-[#F8AD1D]/30'
  const labelCls = 'flex flex-col gap-1'
  const smallLabelCls = 'text-xs font-semibold text-[#6B6D8A]'

  return (
    <div className="flex flex-col gap-6" dir="rtl">

      {/* Action bar */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <button type="button" onClick={handleSave}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#333654] text-sm font-bold text-white hover:bg-[#444668] transition-colors">
          <Save className="h-4 w-4" />שמור טיוטה
        </button>
        <button type="button" onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#E5E5E8] text-sm font-semibold text-[#6B6D8A] hover:bg-[#F8F8FA] transition-colors">
          <Printer className="h-4 w-4" />הדפסה / PDF
        </button>
        <button type="button" onClick={handleReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#9091A8] hover:text-red-400 transition-colors">
          <RotateCcw className="h-3.5 w-3.5" />נקה הכל
        </button>
        {saved && <span className="text-xs text-[#00B1AE] font-medium">✓ נשמר</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── Form ── */}
        <div className="print:hidden flex flex-col gap-5 rounded-2xl border border-[#E5E5E8] bg-white p-5">
          <p className="font-black text-[#1A1B2E] flex items-center gap-2">
            <FileText className="h-4 w-4 text-[#F8AD1D]" />
            מילוי פרטים
          </p>

          {/* Gender toggle */}
          <section className="flex flex-col gap-2">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">סוג חוזה</p>
            <div className="flex gap-2 rounded-xl bg-[#F5F5F3] p-1 w-fit">
              {(['female', 'male'] as Gender[]).map(g => (
                <button key={g} type="button"
                  onClick={() => set('gender', g)}
                  className={[
                    'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                    fields.gender === g ? 'bg-[#333654] text-white shadow-sm' : 'text-[#9091A8]',
                  ].join(' ')}>
                  {g === 'female' ? '👩 מנהלת קייטנה' : '👨 מנהל קייטנה'}
                </button>
              ))}
            </div>
          </section>

          {/* Employer */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">פרטי המעסיק</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span className={smallLabelCls}>שם המעסיק</span>
                <input className={inputCls} value={fields.employerName} onChange={e => set('employerName', e.target.value)} placeholder="שם מלא" />
              </label>
              <label className={labelCls}>
                <span className={smallLabelCls}>טלפון</span>
                <input className={inputCls} type="tel" dir="ltr" value={fields.employerPhone} onChange={e => set('employerPhone', e.target.value)} placeholder="05x-xxx-xxxx" />
              </label>
            </div>
          </section>

          {/* Director */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">
              פרטי {directorLabel}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span className={smallLabelCls}>שם מלא</span>
                <input className={inputCls} value={fields.directorName} onChange={e => set('directorName', e.target.value)} placeholder="שם מלא" />
              </label>
              <label className={labelCls}>
                <span className={smallLabelCls}>תעודת זהות</span>
                <input className={inputCls} dir="ltr" value={fields.directorId} onChange={e => set('directorId', e.target.value)} placeholder="9 ספרות" />
              </label>
              <label className={`${labelCls} col-span-2`}>
                <span className={smallLabelCls}>טלפון</span>
                <input className={inputCls} type="tel" dir="ltr" value={fields.directorPhone} onChange={e => set('directorPhone', e.target.value)} placeholder="05x-xxx-xxxx" />
              </label>
            </div>
          </section>

          {/* Period */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">תקופת העסקה</p>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelCls}>
                <span className={smallLabelCls}>תאריך התחלה</span>
                <input className={inputCls} type="date" value={fields.startDate} onChange={e => set('startDate', e.target.value)} />
              </label>
              <label className={labelCls}>
                <span className={smallLabelCls}>תאריך סיום</span>
                <input className={inputCls} type="date" value={fields.endDate} onChange={e => set('endDate', e.target.value)} />
              </label>
              <label className={labelCls}>
                <span className={smallLabelCls}>שעת פתיחה</span>
                <input className={inputCls} type="time" dir="ltr" value={fields.workHoursFrom} onChange={e => set('workHoursFrom', e.target.value)} />
              </label>
              <label className={labelCls}>
                <span className={smallLabelCls}>שעת סגירה</span>
                <input className={inputCls} type="time" dir="ltr" value={fields.workHoursTo} onChange={e => set('workHoursTo', e.target.value)} />
              </label>
            </div>
          </section>

          {/* Salary */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">שכר ותנאים</p>
            <div className="flex gap-2 rounded-xl bg-[#F5F5F3] p-1 w-fit">
              {(['total', 'daily'] as const).map(t => (
                <button key={t} type="button"
                  onClick={() => set('salaryType', t)}
                  className={[
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    fields.salaryType === t ? 'bg-white text-[#1A1B2E] shadow-sm' : 'text-[#9091A8]',
                  ].join(' ')}>
                  {t === 'total' ? 'שכר כולל לתקופה' : 'שכר יומי'}
                </button>
              ))}
            </div>
            <label className={labelCls}>
              <span className={smallLabelCls}>סכום (₪)</span>
              <input className={inputCls} type="number" min="0" dir="ltr" value={fields.salaryAmount} onChange={e => set('salaryAmount', e.target.value)} placeholder="0" />
            </label>
            <label className={labelCls}>
              <span className={smallLabelCls}>תנאי תשלום</span>
              <select className={inputCls} value={fields.paymentTerms} onChange={e => set('paymentTerms', e.target.value)}>
                {PAYMENT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </section>

          {/* Notice */}
          <section className="flex flex-col gap-3">
            <p className="text-xs font-bold text-[#333654] uppercase tracking-wide border-b border-[#F0F0F0] pb-1">ביטול</p>
            <label className={labelCls}>
              <span className={smallLabelCls}>ימי הודעה מוקדמת</span>
              <input className={inputCls} type="number" min="1" dir="ltr" value={fields.noticeDays} onChange={e => set('noticeDays', e.target.value)} />
            </label>
          </section>
        </div>

        {/* ── Contract Preview ── */}
        <div id="contract-preview"
          className="contract-preview bg-white text-[#1A1B2E] text-[13px] leading-relaxed overflow-hidden shadow-lg"
          dir="rtl"
          style={{ fontFamily: '"Times New Roman","FrankRuehl","David",serif', border: '3px double #222' }}>

          {/* Document Header — paper style */}
          <div className="px-7 pt-7 pb-4 text-center border-b-2 border-[#111]">
            <div className="flex justify-center mb-3">
              <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={130} height={65} className="object-contain" />
            </div>
            <div className="border-t border-b border-[#111] py-2 my-2">
              <h1 className="text-[18px] font-black tracking-wide">חוזה העסקת {directorTitle}</h1>
            </div>
            <p className="text-[11px] text-[#555] mt-1">חוזה זה מהווה מסמך משפטי מחייב — יש לקרוא בעיון לפני החתימה</p>
          </div>

          {/* Body */}
          <div className="px-7 py-5">

            {/* Date */}
            <p className="text-[12px] text-[#444] mb-5 pb-4 border-b border-dashed border-[#DDD]">
              הסכם זה נערך ונחתם ביום{' '}
              <u className="font-bold text-[#111] mx-0.5">{signDate.day}</u>{' '}
              לחודש{' '}
              <u className="font-bold text-[#111] mx-0.5">{signDate.month}</u>{' '}
              שנת{' '}
              <u className="font-bold text-[#111] mx-0.5">{signDate.year}</u>
            </p>

            {/* Parties */}
            <div className="border border-[#CCC] mb-5 overflow-hidden rounded-sm">
              <div className="bg-[#F5F3EE] border-b border-[#CCC] px-4 py-2">
                <span className="text-[11px] font-bold text-[#555] uppercase tracking-wide">הצדדים להסכם</span>
              </div>
              <div className="divide-y divide-[#EBEBEB]">
                <div className="px-4 py-3">
                  <p className="text-[12px] font-bold text-[#444] mb-1">בין (המעסיק):</p>
                  <p className="font-semibold">{f(fields.employerName, '________________________________')}</p>
                  <p className="text-[11px] text-[#666]">טלפון: {f(fields.employerPhone, '________________________')}</p>
                  <p className="text-[11px] text-[#888] italic mt-0.5">(להלן: <strong>&quot;המעסיק&quot;</strong>)</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[12px] font-bold text-[#444] mb-1">לבין ({directorLabel}):</p>
                  <p className="font-semibold">{f(fields.directorName, '________________________________')}</p>
                  <p className="text-[11px] text-[#666]">
                    ת.ז.: {f(fields.directorId, '_______________')} &nbsp;|&nbsp; טלפון: {f(fields.directorPhone, '________________________')}
                  </p>
                  <p className="text-[11px] text-[#888] italic mt-0.5">(להלן: <strong>&quot;{directorLabel}&quot;</strong>)</p>
                </div>
              </div>
            </div>

            <p className="font-bold text-[12px] mb-4 pb-2 border-b border-[#DDD]">
              הוסכם והותנה בין הצדדים כדלקמן:
            </p>

            {/* Sections */}
            <Section num={1} title="מהות התפקיד">
              <p>{directorPronoun} {g(gender, 'תועסק', 'יועסק')} כ{directorTitle} ו{g(gender, 'תהיה', 'יהיה')} אחראי/ת על ניהול, תפעול והובלת הקייטנה באופן מקצועי, בטיחותי וחינוכי, בהתאם להנחיות המעסיק.</p>
            </Section>

            <Section num={2} title="תקופת העסקה">
              <p>
                העסקה תחל בתאריך <u className="font-bold">{fDate(fields.startDate)}</u> ותסתיים בתאריך <u className="font-bold">{fDate(fields.endDate)}</u>
                {' '}(כולל ימי היערכות לפני פתיחת הקייטנה וימי סיכום לאחר סיומה).
              </p>
            </Section>

            <Section num={3} title="תחומי אחריות">
              <p className="mb-1">{directorLabel} {directorVerb} לבצע את התפקידים הבאים:</p>
              <ol className="list-decimal list-inside space-y-0.5 pr-2">
                {[
                  `ניהול כולל של צוות הקייטנה (מדריכות, צוות עזר וכו׳)`,
                  'הכנת תכנית יומית בהתאם לתכני הקייטנה',
                  'אחריות על רישום הילדים ומעקב נוכחות',
                  'ניהול קשר שוטף עם הורים',
                  'שמירה על בטיחות הילדים והקפדה על נהלים',
                  `אחריות על ציוד, חומרים ותקציב הקייטנה`,
                  'השתתפות בפגישות הכנה וליווי מקצועי',
                  'ייצוג הקייטנה מול גורמים חיצוניים (בית ספר / מתנ״ס וכו׳)',
                ].map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            </Section>

            <Section num={4} title="שעות עבודה">
              <p>
                שעות הפעילות של הקייטנה: <u className="font-bold">{fields.workHoursFrom || '___'}–{fields.workHoursTo || '___'}</u>.{' '}
                {directorLabel} {directorVerb} להגיע בזמן ולהישאר עד סיום הפעילות, כולל היערכות מוקדמת וסגירת יום.
              </p>
            </Section>

            <Section num={5} title="שכר ותנאים">
              <ol className="list-[lower-alpha] list-inside space-y-0.5 pr-2">
                <li><strong>{salary}</strong></li>
                <li>השכר כולל את כל שעות העבודה, כולל הכנות וניהול בפועל.</li>
                <li>תנאי התשלום: <u className="font-bold">{f(fields.paymentTerms, '________________')}</u></li>
              </ol>
            </Section>

            <Section num={6} title="התחייבות מקצועית">
              <p className="mb-1">{directorLabel} {directorVerb}:</p>
              <ol className="list-[lower-alpha] list-inside space-y-0.5 pr-2">
                {[
                  'לפעול במסירות, אחריות ויושרה',
                  'לשמור על סטנדרט גבוה של ניהול והתנהלות',
                  'להוות דוגמה אישית לצוות ולילדים',
                  'לפעול בהתאם לערכי חב"ד ורוח הקייטנה',
                ].map((item, i) => <li key={i}>{item}</li>)}
              </ol>
            </Section>

            <Section num={7} title="סודיות">
              <p>{directorLabel} {directorVerb} לשמור על סודיות מלאה בנוגע לפרטי הילדים, ההורים, הצוות וכל מידע הקשור לפעילות הקייטנה, גם לאחר תום ההעסקה.</p>
            </Section>

            <Section num={8} title="ביטול והפסקת התקשרות">
              <ol className="list-[lower-alpha] list-inside space-y-0.5 pr-2">
                <li>כל צד רשאי להפסיק את ההתקשרות בהודעה מוקדמת של <u className="font-bold">{f(fields.noticeDays, '__')}</u> ימים.</li>
                <li>במקרה של הפרת התחייבות מהותית — ניתן להפסיק מיידית.</li>
              </ol>
            </Section>

            <Section num={9} title="אחריות ובטיחות">
              <p>{directorLabel} {directorVerb2} לוודא שמירה על נהלי בטיחות, נוכחות צוות בהתאם לדרישות, וטיפול מיידי בכל אירוע חריג.</p>
            </Section>

            <Section num={10} title="שונות">
              <ol className="list-[lower-alpha] list-inside space-y-0.5 pr-2">
                <li>כל שינוי בחוזה ייעשה בכתב בלבד ובהסכמת שני הצדדים.</li>
                <li>חוזה זה מהווה את ההסכם המלא בין הצדדים ומבטל כל הסכמה קודמת.</li>
                <li>כל מחלוקת תידון על פי דיני מדינת ישראל.</li>
              </ol>
            </Section>

            {/* Signatures */}
            <div className="mt-6 pt-4 border-t-2 border-[#111]">
              <p className="text-[11px] font-bold text-[#444] uppercase tracking-wide mb-3">ולראיה באנו על החתום:</p>
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-[#F5F3EE]">
                    {['הצד', 'שם', 'חתימה', 'תאריך'].map(h => (
                      <th key={h} className="border border-[#CCC] px-3 py-2 text-right font-bold text-[#444]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'המעסיק', name: f(fields.employerName, '') },
                    { label: directorLabel, name: f(fields.directorName, '') },
                  ].map(row => (
                    <tr key={row.label}>
                      <td className="border border-[#CCC] px-3 py-4 font-bold whitespace-nowrap">{row.label}</td>
                      <td className="border border-[#CCC] px-3 py-4">{row.name}</td>
                      <td className="border border-[#CCC] px-3 py-4" />
                      <td className="border border-[#CCC] px-3 py-4" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer stripe */}
          {/* Footer gold stripe */}
          <div className="h-1.5 bg-[#F8AD1D] mt-4" />
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .print\\:hidden { display: none !important; }
          body * { visibility: hidden; }
          #contract-preview, #contract-preview * { visibility: visible; }
          #contract-preview {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function Section({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 pb-3 border-b border-dashed border-[#DDD]">
      <p className="font-bold mb-1 text-[#111] flex items-baseline gap-1.5">
        <span className="text-[12px] font-black bg-[#F5F3EE] border border-[#CCC] px-1.5 py-0.5 rounded-sm flex-shrink-0">{num}</span>
        <span>{title}</span>
      </p>
      <div className="text-[#333] pr-5 text-[12.5px]">{children}</div>
    </div>
  )
}
