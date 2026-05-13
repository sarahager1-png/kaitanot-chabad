'use client'

import { useRef, useState } from 'react'
import { SignatureCanvas, SignatureCanvasRef } from '@/components/agreements/signature-canvas'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function DirectOperationPage() {
  const sigRef = useRef<SignatureCanvasRef>(null)
  const [form, setForm] = useState({ emissary: '', city: '', camp_year: new Date().getFullYear().toString(), sign_day: '', sign_place: '' })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        body: JSON.stringify({ agreement_type: 'direct-operation', ...form, signature_data: sigRef.current?.toDataURL() }),
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

            <p className="text-center font-bold text-base">ב&quot;ה</p>
            <h1 className="text-center text-xl font-black text-[#333654]">הסכם הפעלה ישירה</h1>
            <p className="text-center text-[#6B6D8A] text-sm">להפעלת קייטנה במסגרת &quot;רשת קייטנות חב&quot;ד&quot;, שע&quot;י אגף מבצע חינוך של צעירי אגודת חב&quot;ד בארץ הקודש</p>

            <hr className="border-[#E5E5E8] my-2" />

            <p>
              בין הנהלת בית חב&quot;ד בעיר/שכונה/יישוב:{' '}
              <span className="inline-block border-b border-[#333654] min-w-[160px] font-semibold">
                {form.city || '                    '}
              </span>
              {' '}בניהול הרב/השליח:{' '}
              <span className="inline-block border-b border-[#333654] min-w-[180px] font-semibold">
                {form.emissary || '                        '}
              </span>
            </p>
            <p>לבין אגף מבצע חינוך שע&quot;י צעירי אגודת חב&quot;ד בארץ הקודש, המיוצג על ידי מנהל אגף מבצע חינוך הרב אליהו קריצ&apos;בסקי.</p>

            <div className="space-y-3">
              <p>הואיל והנהלת אגף מבצע חינוך פועלת להרחיב את פעילות הקייטנות והמסגרות החינוכיות לילדים בקיץ ברחבי ארץ הקודש, ובפרט עבור אוכלוסייה מסורתית ושאינה דתית, ולצורך כך משקיעה משאבים רבים בהקמת, פיתוח וניהול &quot;רשת קייטנות חב&quot;ד&quot;.</p>
              <p>והואיל והשליח מעוניין ליישם את הוראת הרבי בהפעלת פעילויות קיץ לילדי ישראל במקום שליחותו, אך אינו מעוניין או אינו יכול לנהל את הקייטנה באופן עצמאי, ולפיכך מבקש כי אגף מבצע חינוך יפעיל את הקייטנה באופן ישיר במקומו.</p>
              <p>והואיל והאגף מסכים לפעול כגורם המפעיל הישיר של הקייטנה במקום השליחות, תוך תיאום ושיתוף פעולה עם השליח המקומי.</p>
              <p>והואיל והשליח מעוניין לשמור על מעמדו המקומי וקשריו עם ההורים והקהילה, ויפעל לסייע לרשת במאמצי הרישום והחדירה לקהילה המקומית.</p>
            </div>

            <p className="font-bold">אי לכך מצהירים הצדדים כדלהלן:</p>

            <div className="space-y-2">
              <p className="font-bold">1. הנהלת רשת קייטנות חב&quot;ד מצהירה כי:</p>
              <ol className="list-none space-y-1.5 pr-4">
                {[
                  'תפעיל את הקייטנה באופן ישיר ומלא במקום השליחות, לרבות ניהול שוטף, גיוס צוותים, הפקה, תכנים ותפעול.',
                  'תישא באחריות המלאה להפעלת הקייטנה על כל המשתמע מכך, לרבות מול הורי הילדים, הצוותים, ספקים, רשויות וגורמי חוץ.',
                  'תנהל את כלל ההיבטים הכספיים של הקייטנה, לרבות גביית תשלומים, ניהול תקציב ועמידה בדרישות רגולטוריות.',
                  'תתאם עם השליח המקומי את לוחות הזמנים, מיקום הפעילות ואופן ההתנהלות מול הקהילה המקומית.',
                  'תעדכן את השליח באופן שוטף על מהלך הקייטנה, הרישום, הפעילויות והנעשה במסגרתה.',
                  'כלל הפרסומים, המודעות, החומרים השיווקיים והפרסומים הדיגיטליים הקשורים לקייטנה, יכללו באופן ברור את לוגו בית חב"ד המקומי, בהתאם להנחיות המיתוג של רשת קייטנות חב"ד.',
                  'תפעל לשמור על מעמדו של השליח ועל הזיקה הברורה בין הקייטנה לבין בית חב"ד המקומי בעיני הקהילה.',
                  'פעילות לשמירה על קשר עם משתתפי הקייטנה לאחר סיום הקייטנה בפועל ובמשך השנה, תיעשה בתיאום ואישור מראש של השליח.',
                ].map((t, i) => <li key={i}><span className="font-semibold">1.{i + 1}. </span>{t}</li>)}
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">2. השליח/הנהלת הסניף מצהיר/ת כי:</p>
              <ol className="list-none space-y-1.5 pr-4">
                {[
                  'יסייע באופן פעיל בגיוס ורישום ילדים לקייטנה מתוך הקהילה המקומית, תוך שימוש בקשריו המקומיים.',
                  'יעמיד לרשות האגף את המרחב הפיזי הנדרש להפעלת הקייטנה, ככל שהדבר ביכולתו ובתיאום מראש.',
                  'יתאם עם הנהלת האגף כל פנייה ציבורית או תקשורתית הקשורה לפעילות הקייטנה.',
                  'יפעל לשמירה על שמה הטוב של רשת קייטנות חב"ד ועל מעמדה המקצועי בקהילה המקומית.',
                  'לא יתערב בהחלטות הניהוליות, התפעוליות או הכספיות של הקייטנה, אלא בתיאום מלא עם הנהלת הרשת.',
                  'לא יעביר הנחיות ו/או בקשות לצוות המפעיל של הקייטנה, ללא תיאום מראש עם הנהלת הרשת.',
                  'ישתתף בפעולות הקייטנה באופן ישיר ו/או ע"י באי כוחו, כולל ביקורים, אירועים, טיולים, צילומים וכד\', בתיאום מראש עם מפעילות הקייטנה בשטח.',
                ].map((t, i) => <li key={i}><span className="font-semibold">2.{i + 1}. </span>{t}</li>)}
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">3. כספים ותגמול</p>
              <ol className="list-none space-y-1.5 pr-4">
                <li><span className="font-semibold">3.1. </span>כלל ההכנסות וההוצאות מפעילות הקייטנה יתקבלו ויינוהלו על ידי אגף מבצע חינוך בלבד.</li>
                <li><span className="font-semibold">3.2. </span>השליח לא יישא בכל עלות או הוצאה הקשורה להפעלת הקייטנה, אלא אם כן הוסכם אחרת בכתב ומראש.</li>
              </ol>
            </div>

            <div className="space-y-2">
              <p className="font-bold">4. כללי</p>
              <ol className="list-none space-y-1.5 pr-4">
                <li>
                  <span className="font-semibold">4.1. </span>
                  הסכם זה הינו לקייטנת קיץ בשנת:{' '}
                  <span className="inline-block border-b border-[#333654] min-w-[100px] font-semibold px-1">
                    {form.camp_year}
                  </span>
                  {' '}ויחודש בהסכמת שני הצדדים ככל שידרש לשנים הבאות.
                </li>
                <li><span className="font-semibold">4.2. </span>כל אחד מהצדדים רשאי לסיים את ההסכם בהודעה מוקדמת בכתב של 10 יום, ובלבד שלא יפגע בהמשך פעילות הקייטנה באותה עונה.</li>
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
              <input id="do-emissary" title="שם השליח" value={form.emissary} onChange={e => setForm(p => ({ ...p, emissary: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="do-city" className="text-xs font-bold text-[#6B6D8A]">עיר / ישוב *</label>
              <input id="do-city" title="עיר או ישוב" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="do-year" className="text-xs font-bold text-[#6B6D8A]">שנת הקייטנה</label>
              <input id="do-year" title="שנת הקייטנה" value={form.camp_year} onChange={e => setForm(p => ({ ...p, camp_year: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="do-day" className="text-xs font-bold text-[#6B6D8A]">ביום</label>
              <input id="do-day" title="תאריך החתימה" value={form.sign_day} onChange={e => setForm(p => ({ ...p, sign_day: e.target.value }))}
                placeholder="לדוגמה: כ״ה סיון תשפ״ה"
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="do-place" className="text-xs font-bold text-[#6B6D8A]">במקום</label>
              <input id="do-place" title="מקום החתימה" value={form.sign_place} onChange={e => setForm(p => ({ ...p, sign_place: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#6B6D8A]">חתימת נציג הסניף / השליח *</label>
            <SignatureCanvas ref={sigRef} />
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
