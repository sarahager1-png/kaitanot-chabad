'use client'

import { useRef, useState, useEffect } from 'react'
import { SignatureCanvas, SignatureCanvasRef } from '@/components/agreements/signature-canvas'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function CampContractPage() {
  const sigRef = useRef<SignatureCanvasRef>(null)
  const [form, setForm] = useState({ emissary: '', city: '', camp_year: new Date().getFullYear().toString(), sign_day: '', sign_place: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rabbiSig, setRabbiSig] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/settings?key=rabbi_signature_data')
      .then(r => r.json())
      .then(d => { if (d.value) setRabbiSig(d.value) })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.emissary.trim()) { setError('נא למלא שם השליח'); return }
    if (!form.city.trim()) { setError('נא למלא עיר/ישוב'); return }
    if (sigRef.current?.isEmpty()) { setError('נא לחתום בחלון החתימה'); return }
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch('/api/signed-agreements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agreement_type: 'camp-contract', ...form, signature_data: sigRef.current?.toDataURL() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setDone(true)
    } catch (err) {
      setError('שגיאה בשמירה: ' + String(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9F9F7] p-6" dir="rtl">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E5F4EC]">
            <CheckCircle className="h-8 w-8 text-[#1A7A4A]" />
          </div>
          <h1 className="text-2xl font-black text-[#333654]">ההסכם נחתם בהצלחה</h1>
          <p className="text-sm text-[#6B6D8A]">תודה! ההסכם התקבל ויישמר במערכת.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9F7] py-10 px-4 print:bg-white print:py-0" dir="rtl">
      <div className="max-w-3xl mx-auto">

        {/* Agreement document */}
        <div className="bg-white rounded-2xl border border-[#E5E5E8] shadow-sm mb-6 overflow-hidden print:shadow-none print:border-none print:rounded-none">
          <div className="p-8 text-sm text-[#333654] leading-7 space-y-4">

            {/* Logo */}
            <div className="flex justify-center mb-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-kaitanot.jpg" alt="רשת קייטנות חב&quot;ד" className="h-20 object-contain" />
            </div>

            <p className="text-center font-bold text-base">ב&quot;ה</p>
            <h1 className="text-center text-xl font-black text-[#333654]">הסכם התקשרות</h1>
            <p className="text-center text-[#6B6D8A] text-sm">לניהול קייטנה במסגרת &quot;רשת קייטנות חב&quot;ד&quot;, שע&quot;י אגף מבצע חינוך של צעירי אגודת חב&quot;ד בארץ הקודש</p>

            <hr className="border-[#E5E5E8] my-2" />

            <p>
              בין הנהלת בית חב&quot;ד בעיר/שכונה/יישוב:{' '}
              <span className="inline-block border-b border-[#333654] min-w-[160px] font-semibold">
                {form.city || '                    '}
              </span>
              {' '}בניהול הרב/השליח:{' '}
              <span className="inline-block border-b border-[#333654] min-w-[180px] font-semibold">
                {form.emissary || '                        '}
              </span>
            </p>
            <p>לבין אגף מבצע חינוך שע&quot;י צעירי אגודת חב&quot;ד בארץ הקודש, המיוצג על ידי מנהל אגף מבצע חינוך הרב אליהו קריצ&apos;בסקי.</p>

            <div className="space-y-3">
              <p>הואיל והנהלת אגף מבצע חינוך פועלת להרחיב את פעילות הקייטנות והמסגרות החינוכיות לילדים בקיץ ברחבי ארץ הקודש, ובפרט עבור אוכלוסייה מסורתית ושאינה דתית ולצורך כך משקיע אגף מבצע חינוך משאבים רבים בהקמת, פיתוח וליווי &quot;רשת קייטנות חב&quot;ד&quot;, במטרה לאפשר הפעלת קייטנות איכותיות, ערכיות ומקצועיות ברוח חב&quot;ד.</p>
              <p>והואיל והנהלת אגף מבצע חינוך מחויבת לשמור על צביון אחיד, התנהלות מסודרת ושפה מקצועית אחידה בכלל סניפי רשת קייטנות חב&quot;ד בארץ, לטובת כלל הסניפים והמותג הארצי.</p>
              <p>והואיל והשליח מעוניין ליישם את הוראת הרבי בהפעלת פעילויות קיץ לילדי ישראל במקום שליחותו, באופן הטוב ביותר, ולצורך כך מבקש להצטרף כסניף פעיל במסגרת &quot;רשת קייטנות חב&quot;ד&quot;, ולקבל ליווי מקצועי, מערכתי ותפעולי מלא לצורך הקמת והפעלת הקייטנה.</p>
              <p>והואיל והשליח משקיע רבות בפיתוח הפעילות המקומית ומעוניין לשמור על מעמדו והובלתו המקומית מול ההורים, הקהילה והגורמים השונים;</p>
            </div>

            <p className="font-bold">אי לכך מצהירים הצדדים כדלהלן:</p>

            <div className="space-y-2">
              <p className="font-bold">1. הנהלת הסניף/השליח מצהירה כי:</p>
              <ol className="list-none space-y-1.5 pr-4">
                {[
                  'תפעל בהתאם למדיניות והנהלים של אגף מבצע חינוך ורשת קייטנות חב"ד, בכל הקשור להפעלת הקייטנה, התנהלות הצוותים, פרסום, מיתוג, בטיחות, רישום ותכנים.',
                  'כלל הפרסומים, המודעות, החומרים השיווקיים והפרסומים הדיגיטליים הקשורים לקייטנה, יכללו באופן ברור את לוגו בית חב"ד המקומי, בהתאם להנחיות המיתוג של רשת קייטנות חב"ד.',
                  'תעדכן באופן רציף את הנהלת אגף מבצע חינוך על הנעשה במסגרת הקייטנה ותוודא שכלל צוותי הקייטנה יפעלו בצורה מתואמת, עם הצוות הרלוונטי ברשת קייטנות חב"ד.',
                  'תתאם מראש עם הנהלת אגף מבצע חינוך כל פעילות חריגה, שיווקית או ציבורית הקשורה לפעילות הסניף.',
                  'תפעל בהתאם להנחיות המקצועיות והבטיחותיות הנדרשות לצורך הפעלת קייטנה תקינה ומסודרת.',
                  'תשתף פעולה באופן מלא עם תהליכי הרישום, הדיווח, ניהול הצוותים והמעקב הניהולי של הרשת.',
                  'תפעל לשמירה על שמה הטוב של רשת קייטנות חב"ד ועל התנהלות מכבדת, מקצועית ואחראית מול הורים, עובדים, ספקים וגורמי חוץ.',
                  'תשמור על הזכויות והבעלות של רשת קייטנות חב"ד על המיתוג והמשאבים הייחודיים, ולא תעשה בהם שימוש מעבר לשימוש הישיר להפעלת הסניף המקומי.',
                ].map((t, i) => <li key={i}><span className="font-semibold">1.{i + 1}. </span>{t}</li>)}
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">2. הנהלת אגף מבצע חינוך מצהירה כי:</p>
              <ol className="list-none space-y-1.5 pr-4">
                {[
                  'תלווה את השליח בתהליך הקמת והפעלת הקייטנה, לרבות איתור מבנה, תהליך רישוי, בניית תכנית עבודה ותכנון הפעילות.',
                  'תספק מעטפת מקצועית וליווי בתחומי גיוס ורישום תלמידים, קמפיינים שיווקיים ארציים ומקומיים, פרסום ודיגיטל.',
                  'תסייע בבחירת והכשרת צוותי עובדים, מדריכים ומנהלים בהתאם לצורכי הקייטנה.',
                  'תספק תוכניות פעילות, ערכות תלמיד, חומרי הדרכה, עזרים ותכנים חינוכיים בהתאם למתווה הרשת.',
                  'תקיים ליווי שוטף לאורך תקופת ההיערכות וההפעלה, כולל מענה מקצועי, ניהולי ותפעולי.',
                  'תפעל לחיזוק תחושת השליחות, השייכות והמקצועיות של צוותי הקייטנות במסגרת רשת קייטנות חב"ד.',
                  'תלווה את השליח בהתנהלות מול גורמים מקצועיים, ספקים, רשויות וגורמים רלוונטיים נוספים ככל הנדרש.',
                  'תפעל לקידום ופיתוח הרשת ברמה הארצית, לטובת כלל סניפי רשת קייטנות חב"ד.',
                ].map((t, i) => <li key={i}><span className="font-semibold">2.{i + 1}. </span>{t}</li>)}
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">3. דמי תיאום ותקורה:</p>
              <ol className="list-none space-y-1.5 pr-4">
                <li><span className="font-semibold">3.1. </span>כחלק מהשותפות המלאה במסגרת רשת קייטנות חב&quot;ד, ולצורך מימון המעטפת המקצועית, הליווי השוטף והפיתוח המערכתי הרציף של הרשת, יגבה אגף מבצע חינוך דמי תיאום ותקורה בשיעור של 5% (חמישה אחוזים) מסך ההכנסות שיתקבלו בגין פעילות הקייטנה בסניף, לרבות דמי רישום, תשלומי ההורים, השתתפויות ותמיכות מכל גורם מממן, לרבות משרד החינוך, רשויות מקומיות או כל גוף ציבורי אחר.</li>
                <li><span className="font-semibold">3.2. </span>סליקת התשלומים תתבצע ע&quot;י הרשת ו/או מערכת סליקה עצמאית לסניף בממשק עם מערכת ניהול הקייטנות, וכל ההכנסות (בקיזוז התקורה הנ&quot;ל) יועברו בצורה מסודרת לעמותה המפעילה הישירה של הקייטנה, עד 7 ימים מתאריך קליטת הכספים בפועל ובהתאם לעמידה של העמותה בתנאים המאפשרים את העברת הכספים - אישור ניהול תקין, סעיף 46 וכו&apos;.</li>
                <li><span className="font-semibold">3.3. </span>הסניף מתחייב לנהל רישום כספי מסודר ושקוף של מלוא הכנסותיו, ולהעמידו לעיון הנהלת האגף על פי דרישה.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">4. כללי</p>
              <ol className="list-none space-y-1.5 pr-4">
                <li><span className="font-semibold">4.1. </span>הסכם זה מבטא שותפות מלאה בין השליח לבין אגף מבצע חינוך, מתוך מטרה להקים ולהפעיל קייטנות מקצועיות, ערכיות ומצליחות ברוח חב&quot;ד.</li>
                <li><span className="font-semibold">4.2. </span>הסכם זה הינו לליווי פעילות הקייטנות בלבד, כלל האחריות להפעלת הקייטנה על כל המשתמע מכך, מול הורי הילדים, הצוותים, ספקים וכו&apos;, הינם באחריות העמותה של הסניף המפעיל בלבד.</li>
                <li><span className="font-semibold">4.3. </span>מובהר כי ההחלטה הסופית בדבר אישור פתיחת קייטנה במסגרת רשת קייטנות חב&quot;ד תתקבל על ידי הנהלת רשת קייטנות חב&quot;ד ואגף מבצע חינוך, בהתאם לקריטריונים מקצועיים, ארגוניים וחינוכיים של הרשת, ובתיאום עם השליח.</li>
                <li><span className="font-semibold">4.4. </span>הצדדים יפעלו מתוך שיתוף פעולה, תקשורת מכבדת ואחריות משותפת לקידום מטרות הרשת והצלחת הקייטנות.</li>
              </ol>
            </div>

          </div>
        </div>

        {/* Signing form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E5E5E8] p-6 shadow-sm flex flex-col gap-4 print:hidden">
          <h2 className="font-bold text-[#333654] text-base">על החתום</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">שם הרב/השליח *</label>
              <input value={form.emissary} onChange={e => setForm(p => ({ ...p, emissary: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">עיר / ישוב *</label>
              <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">ביום</label>
              <input value={form.sign_day} onChange={e => setForm(p => ({ ...p, sign_day: e.target.value }))}
                placeholder="לדוגמה: כ״ה סיון תשפ״ה"
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">במקום</label>
              <input value={form.sign_place} onChange={e => setForm(p => ({ ...p, sign_place: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
          </div>

          {/* Signatures row */}
          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#6B6D8A]">חתימת נציג הסניף / השליח *</label>
              <SignatureCanvas ref={sigRef} />
              <p className="text-xs text-center text-[#9091A8] mt-1">{form.emissary || 'נציג הסניף / השליח'}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold text-[#6B6D8A]">חתימת מנהל אגף מבצע חינוך</p>
              <div className="rounded-xl border-2 border-dashed border-[#E5E5E8] bg-[#F9F9F7] flex items-center justify-center overflow-hidden" style={{ height: 100 }}>
                {rabbiSig
                  ? /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={rabbiSig} alt="חתימת הרב" className="w-full h-full object-contain p-2" />
                  : <span className="text-xs text-[#C9A84C]/60">טוען חתימה...</span>
                }
              </div>
              <p className="text-xs text-center text-[#9091A8] mt-1">הרב אליהו קריצ&apos;בסקי</p>
            </div>
          </div>

          {error && <p className="text-sm text-[#C8251D] bg-[#FDE8E7] rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={submitting}
            className="flex items-center justify-center gap-2 h-12 rounded-xl bg-[#333654] text-white font-bold text-sm hover:bg-[#444668] disabled:opacity-60 transition-colors">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            {submitting ? 'שומר...' : 'חתום ושלח הסכם'}
          </button>
        </form>
      </div>
    </div>
  )
}
