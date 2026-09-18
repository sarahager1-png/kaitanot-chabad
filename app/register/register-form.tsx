'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, Users, CreditCard, User, HeartPulse } from 'lucide-react'
import { SHIRT_SIZES, KIPPAH_SIZES } from '@/lib/constants'

interface Camp { id: string; name: string; school_year: string; address: string | null; camp_open_at: string | null; camp_close_at: string | null }
interface Track { id: string; camp_id: string; name: string; description: string | null; price: number }

interface Props {
  camps: Camp[]
  allTracks: Track[]
  preselectedCampId?: string
}

const STEPS = ['בחירת קייטנה', 'פרטי הילד', 'פרטי הורים', 'בריאות', 'תשלום']

const emptyForm = {
  camp_id: '',
  track_id: '',
  first_name: '',
  last_name: '',
  birth_date: '',
  group_name: '',
  gender: '',
  shirt_size: '',
  kippah_size: '',
  parent1_name: '',
  parent1_phone: '',
  parent2_name: '',
  parent2_phone: '',
  primary_phone: '',
  email: '',
  photo_consent: false,
  // health
  is_healthy: true,
  health_issues: '',
  allergies: '',
  medications: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
  notes: '',
  pay_now: false,
}

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('he-IL')
}

export function RegisterForm({ camps, allTracks, preselectedCampId }: Props) {
  const [step, setStep] = useState(preselectedCampId ? 1 : 0)
  const [form, setForm] = useState({ ...emptyForm, camp_id: preselectedCampId ?? '' })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [error, setError] = useState('')

  const tracks = allTracks.filter(t => t.camp_id === form.camp_id)
  const selectedCamp = camps.find(c => c.id === form.camp_id)
  const selectedTrack = tracks.find(t => t.id === form.track_id)

  function set(k: keyof typeof form, v: string | boolean) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function canNext() {
    if (step === 0) return !!form.camp_id
    if (step === 1) return !!form.first_name && !!form.last_name
    if (step === 2) return !!form.parent1_name && !!form.parent1_phone
    if (step === 3) return form.is_healthy || !!form.health_issues
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          gender: form.gender || null,
          shirt_size: form.shirt_size || null,
          kippah_size: form.gender === 'זכר' ? (form.kippah_size || null) : null,
          photo_consent: form.photo_consent,
          notes: [
            form.allergies ? `אלרגיות: ${form.allergies}` : '',
            form.medications ? `תרופות: ${form.medications}` : '',
            !form.is_healthy && form.health_issues ? `בריאות: ${form.health_issues}` : '',
            form.emergency_contact_name ? `חירום: ${form.emergency_contact_name} ${form.emergency_contact_phone}` : '',
            form.notes,
          ].filter(Boolean).join(' | ') || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'שגיאה בשמירה')

      if (form.pay_now && data.registrantId) {
        const payRes = await fetch('/api/payments/cardcom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            registrantId: data.registrantId,
            amount: selectedTrack?.price ?? 0,
            description: `רישום קייטנה — ${form.first_name} ${form.last_name}`,
          }),
        })
        const payData = await payRes.json()
        if (payData.url) {
          setPaymentUrl(payData.url)
          window.location.href = payData.url
          return
        }
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'שגיאה')
    } finally {
      setLoading(false)
    }
  }

  if (done && !paymentUrl) return (
    <div className="min-h-screen bg-[#F5F5F3] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-xl border border-[#E5E5E8] p-8 max-w-sm w-full text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black text-[#333654] mb-2">הרישום התקבל!</h2>
        <p className="text-[#6B6D8A] text-sm mb-1">
          <span className="font-bold text-[#333654]">{form.first_name} {form.last_name}</span> נרשם/ה בהצלחה
        </p>
        {selectedCamp && <p className="text-[#6B6D8A] text-sm">לקייטנת <span className="font-bold">{selectedCamp.name}</span></p>}
        <p className="text-xs text-[#9F8EC4] mt-4">אנו ניצור קשר בקרוב לאישור הרישום</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F5F5F3] flex flex-col" dir="rtl">
      {/* Header */}
      <div className="text-white py-6 px-4 text-center" style={{background: 'linear-gradient(135deg, #252740 0%, #333654 100%)', borderBottom: '2px solid rgba(248,173,29,0.4)'}}>
        <div className="flex justify-center mb-3 bg-white rounded-2xl py-3 px-4 mx-auto w-fit">
          <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={140} height={70} className="object-contain" />
        </div>
        <h1 className="text-xl font-black">טופס רישום לקייטנה</h1>
      </div>

      {/* Steps */}
      <div className="bg-white border-b border-[#E5E5E8] px-4 py-3">
        <div className="flex justify-center gap-1 max-w-md mx-auto">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className={[
                'flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-black transition-all',
                i < step ? 'text-[#333654]' : i === step ? 'text-[#333654]' : 'bg-[#F5F5F3] text-[#9F8EC4]'
              ].join(' ')}
              style={i <= step ? {background: i < step ? 'linear-gradient(90deg,#F8AD1D,#FDE68A)' : 'linear-gradient(90deg,#F8AD1D,#FDE68A)'} : {}}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className={['text-xs font-semibold hidden sm:block', i === step ? 'text-[#333654]' : 'text-[#9F8EC4]'].join(' ')}>{s}</span>
              {i < STEPS.length - 1 && <div className={['w-6 h-px mx-1', i < step ? 'bg-[#F8AD1D]' : 'bg-[#E5E5E8]'].join(' ')} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 flex items-start justify-center p-4 pt-6">
        <div className="bg-white rounded-2xl border border-[#E5E5E8] shadow-sm w-full max-w-lg p-6">

          {/* STEP 0 — camp selection */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#F8AD1D,#FDE68A)'}}>
                  <Users className="h-4 w-4 text-[#333654]" />
                </div>
                <h2 className="text-lg font-black text-[#333654]">בחרו קייטנה</h2>
              </div>

              <div className="flex flex-col gap-3">
                {camps.map(camp => (
                  <button key={camp.id} type="button" onClick={() => { set('camp_id', camp.id); set('track_id', '') }}
                    className={['w-full text-right rounded-xl border-2 p-4 transition-all', form.camp_id === camp.id ? 'border-[#F8AD1D] bg-[#FEF9EC]' : 'border-[#E5E5E8] hover:border-[#F8AD1D]/50 hover:bg-[#FBF7EC]'].join(' ')}>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-[#333654]">{camp.name}</div>
                        {camp.address && <div className="text-xs text-[#9F8EC4] mt-0.5">{camp.address}</div>}
                        {(camp.camp_open_at || camp.camp_close_at) && (
                          <div className="text-xs text-[#6B6D8A] mt-1">
                            {formatDate(camp.camp_open_at)} – {formatDate(camp.camp_close_at)}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full bg-[#F5F5F3] text-[#333654]">{camp.school_year}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Track selection */}
              {form.camp_id && tracks.length > 0 && (
                <div className="mt-2">
                  <label className="text-sm font-bold text-[#333654] block mb-2">בחרו מסלול</label>
                  <div className="flex flex-col gap-2">
                    {tracks.map(t => (
                      <button key={t.id} type="button" onClick={() => set('track_id', t.id)}
                        className={['w-full text-right rounded-xl border-2 p-3 transition-all', form.track_id === t.id ? 'border-[#333654] bg-[#F5F5F3]' : 'border-[#E5E5E8] hover:border-[#333654]/40'].join(' ')}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-sm text-[#333654]">{t.name}</span>
                            {t.description && <p className="text-xs text-[#9F8EC4] mt-0.5">{t.description}</p>}
                          </div>
                          {t.price > 0 && (
                            <span className="text-sm font-black text-[#333654]">
                              ₪{t.price.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 1 — child details */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#F8AD1D,#FDE68A)'}}>
                  <User className="h-4 w-4 text-[#333654]" />
                </div>
                <h2 className="text-lg font-black text-[#333654]">פרטי הילד/ה</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="שם פרטי *" value={form.first_name} onChange={v => set('first_name', v)} />
                <Field label="שם משפחה *" value={form.last_name} onChange={v => set('last_name', v)} />
                <Field label="תאריך לידה" type="date" value={form.birth_date} onChange={v => set('birth_date', v)} />
                <Field label="כיתה / קבוצה" value={form.group_name} onChange={v => set('group_name', v)} placeholder="כיתה ג׳" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="מגדר" value={form.gender} onChange={v => set('gender', v)}
                  options={[{value:'זכר',label:'זכר'},{value:'נקבה',label:'נקבה'}]} placeholder="בחר" />
                <SelectField label="מידת חולצה" value={form.shirt_size} onChange={v => set('shirt_size', v)}
                  options={SHIRT_SIZES.map(s => ({value:s,label:s}))} placeholder="בחר מידה" />
                {form.gender === 'זכר' && (
                  <SelectField label='מידת כיפה (ס"מ)' value={form.kippah_size} onChange={v => set('kippah_size', v)}
                    options={KIPPAH_SIZES.map(s => ({value:s,label:s}))} placeholder="בחר מידה" />
                )}
              </div>
            </div>
          )}

          {/* STEP 2 — parents */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#F8AD1D,#FDE68A)'}}>
                  <Users className="h-4 w-4 text-[#333654]" />
                </div>
                <h2 className="text-lg font-black text-[#333654]">פרטי הורים</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="שם הורה 1 *" value={form.parent1_name} onChange={v => set('parent1_name', v)} />
                <Field label="טלפון *" type="tel" dir="ltr" value={form.parent1_phone} onChange={v => {
                  set('parent1_phone', v)
                  if (!form.parent2_phone) set('primary_phone', v)
                }} />
                <Field label="שם הורה 2" value={form.parent2_name} onChange={v => set('parent2_name', v)} />
                <Field label="טלפון" type="tel" dir="ltr" value={form.parent2_phone} onChange={v => set('parent2_phone', v)} />
              </div>

              {/* Primary phone for messages */}
              {(form.parent1_phone || form.parent2_phone) && (
                <div className="flex flex-col gap-1.5 rounded-xl border border-[#E5E5E8] bg-[#F8F7FF] p-3">
                  <label className="text-sm font-bold text-[#333654]">לאיזה מספר לשלוח הודעות ואישורים?</label>
                  <div className="flex flex-col gap-2">
                    {form.parent1_phone && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="primary_phone" value={form.parent1_phone}
                          checked={form.primary_phone === form.parent1_phone}
                          onChange={() => set('primary_phone', form.parent1_phone)}
                          className="accent-[#333654]" />
                        <span className="text-sm text-[#333654]">{form.parent1_name || 'הורה 1'} — <span dir="ltr">{form.parent1_phone}</span></span>
                      </label>
                    )}
                    {form.parent2_phone && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="primary_phone" value={form.parent2_phone}
                          checked={form.primary_phone === form.parent2_phone}
                          onChange={() => set('primary_phone', form.parent2_phone)}
                          className="accent-[#333654]" />
                        <span className="text-sm text-[#333654]">{form.parent2_name || 'הורה 2'} — <span dir="ltr">{form.parent2_phone}</span></span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              <Field label="אימייל" type="email" dir="ltr" value={form.email} onChange={v => set('email', v)} placeholder="your@email.com" />
              <div className="flex flex-col gap-1">
                <label className="text-sm font-bold text-[#333654]">הערות</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2} placeholder="אלרגיות, הערות רפואיות..."
                  className="rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm text-[#333654] focus:border-[#333654] focus:outline-none resize-none" />
              </div>
            </div>
          )}

          {/* STEP 3 — health */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#F8AD1D,#FDE68A)'}}>
                  <HeartPulse className="h-4 w-4 text-[#333654]" />
                </div>
                <h2 className="text-lg font-black text-[#333654]">הצהרת בריאות</h2>
              </div>

              {/* healthy toggle */}
              <div className="rounded-xl border-2 border-[#E5E5E8] p-4">
                <p className="text-sm font-bold text-[#333654] mb-3">הילד/ה בריא/ה ואין מניעה רפואית להשתתפותו/ה בפעילות הקייטנה?</p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => set('is_healthy', true)}
                    className={['flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all', form.is_healthy ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-[#E5E5E8] text-[#6B6D8A]'].join(' ')}>
                    ✓ כן, בריא/ה לחלוטין
                  </button>
                  <button type="button" onClick={() => set('is_healthy', false)}
                    className={['flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all', !form.is_healthy ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-[#E5E5E8] text-[#6B6D8A]'].join(' ')}>
                    יש הערות רפואיות
                  </button>
                </div>
              </div>

              {!form.is_healthy && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#333654]">פירוט מצב רפואי / מגבלות</label>
                  <textarea value={form.health_issues} onChange={e => set('health_issues', e.target.value)} rows={2}
                    placeholder="תאר את המצב הרפואי הרלוונטי..."
                    className="rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm text-[#333654] focus:border-[#333654] focus:outline-none resize-none" />
                </div>
              )}

              {/* allergies */}
              <div className="rounded-xl border border-[#E5E5E8] bg-[#FFFBF0] p-4 flex flex-col gap-3">
                <p className="text-xs font-black text-[#A07830] uppercase tracking-wide">רגישויות ואלרגיות</p>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#333654]">אלרגיות / רגישויות מזון</label>
                  <input value={form.allergies} onChange={e => set('allergies', e.target.value)}
                    placeholder="לדוגמה: בוטנים, גלוטן, חלב... (ריק = אין)"
                    className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#F8AD1D] focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]/10 transition-all" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#333654]">תרופות קבועות</label>
                  <input value={form.medications} onChange={e => set('medications', e.target.value)}
                    placeholder="שם התרופה, מינון ושעות נטילה... (ריק = אין)"
                    className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#F8AD1D] focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]/10 transition-all" />
                </div>
              </div>

              {/* emergency contact */}
              <div className="rounded-xl border border-[#E5E5E8] p-4 flex flex-col gap-3">
                <p className="text-xs font-black text-[#333654] uppercase tracking-wide">איש קשר לחירום</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="שם" value={form.emergency_contact_name} onChange={v => set('emergency_contact_name', v)} placeholder="שם מלא" />
                  <Field label="טלפון" type="tel" dir="ltr" value={form.emergency_contact_phone} onChange={v => set('emergency_contact_phone', v)} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#333654]">הערות נוספות למדריכים</label>
                <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={2}
                  placeholder="כל מידע חשוב שהצוות צריך לדעת..."
                  className="rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm text-[#333654] focus:border-[#333654] focus:outline-none resize-none" />
              </div>
            </div>
          )}

          {/* STEP 4 — payment */}
          {step === 4 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{background:'linear-gradient(135deg,#F8AD1D,#FDE68A)'}}>
                  <CreditCard className="h-4 w-4 text-[#333654]" />
                </div>
                <h2 className="text-lg font-black text-[#333654]">אישור ותשלום</h2>
              </div>

              {/* Summary */}
              <div className="rounded-xl border border-[#E5E5E8] bg-[#F8F7FF] p-4 text-sm flex flex-col gap-2">
                <SummaryRow label="קייטנה" value={selectedCamp?.name ?? ''} />
                <SummaryRow label="ילד/ה" value={`${form.first_name} ${form.last_name}`} />
                {selectedTrack && <SummaryRow label="מסלול" value={selectedTrack.name} />}
                {form.gender && <SummaryRow label="מגדר" value={form.gender} />}
                {form.shirt_size && <SummaryRow label="מידת חולצה" value={form.shirt_size} />}
                {form.gender === 'זכר' && form.kippah_size && <SummaryRow label='מידת כיפה' value={`${form.kippah_size} ס"מ`} />}
                <SummaryRow label="הורה" value={`${form.parent1_name} · ${form.parent1_phone}`} />
                <SummaryRow label="בריאות" value={form.is_healthy ? '✓ בריא/ה' : '⚠️ יש הערות'} />
                {form.allergies && <SummaryRow label="אלרגיות" value={form.allergies} />}
                {form.medications && <SummaryRow label="תרופות" value={form.medications} />}
                <SummaryRow label="אשור פרסום תמונה" value={form.photo_consent ? '✓ מאושר' : '—'} />
                {selectedTrack?.price ? (
                  <div className="flex justify-between pt-2 border-t border-[#E5E5E8] font-black text-[#333654]">
                    <span>סכום לתשלום</span>
                    <span style={{color:'#A07830'}}>₪{selectedTrack.price.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>

              {/* Payment choice */}
              {selectedTrack?.price ? (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={() => set('pay_now', true)}
                    className={['rounded-xl border-2 p-4 text-right transition-all', form.pay_now ? 'border-[#F8AD1D] bg-[#FEF9EC]' : 'border-[#E5E5E8] hover:border-[#F8AD1D]/50'].join(' ')}>
                    <div className="font-bold text-[#333654]">💳 תשלום עכשיו</div>
                    <div className="text-xs text-[#6B6D8A] mt-0.5">העברה לדף תשלום מאובטח (Cardcom)</div>
                  </button>
                  <button type="button" onClick={() => set('pay_now', false)}
                    className={['rounded-xl border-2 p-4 text-right transition-all', !form.pay_now ? 'border-[#333654] bg-[#F5F5F3]' : 'border-[#E5E5E8] hover:border-[#333654]/40'].join(' ')}>
                    <div className="font-bold text-[#333654]">📋 רישום ללא תשלום</div>
                    <div className="text-xs text-[#6B6D8A] mt-0.5">נסדר את התשלום בהמשך</div>
                  </button>
                </div>
              ) : (
                <p className="text-sm text-[#6B6D8A] bg-[#F5F5F3] rounded-lg p-3">הרישום ללא עלות — ישלחו פרטים בהמשך</p>
              )}

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-[#E5E5E8] hover:border-[#333654]/40 transition-all">
                <input type="checkbox" checked={form.photo_consent} onChange={e => set('photo_consent', e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#333654] flex-shrink-0" />
                <span className="text-sm text-[#333654]">אני מאשר/ת פרסום תמונות הילד ברשתות החברתיות ובחומרי הפרסום של הקייטנה</span>
              </label>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-6 pt-4 border-t border-[#F5F5F3]">
            <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-bold text-[#6B6D8A] border border-[#E5E5E8] hover:bg-[#F5F5F3] disabled:opacity-30 transition-all">
              <ChevronRight className="h-4 w-4" />
              הקודם
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-sm font-bold text-[#333654] disabled:opacity-40 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                style={{background: 'linear-gradient(90deg,#F8AD1D,#FDE68A)'}}>
                הבא
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={loading || !canNext()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold text-white disabled:opacity-40 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                style={{background: 'linear-gradient(90deg,#333654,#7B5AC8)'}}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {form.pay_now ? 'רשום ועבור לתשלום' : 'שלח רישום'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder = '', dir }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; dir?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-[#333654]">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} dir={dir}
        className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] placeholder:text-[#C4B5D4] focus:border-[#333654] focus:outline-none focus:ring-2 focus:ring-[#333654]/10 transition-all" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, placeholder = 'בחר' }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-[#333654]">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#333654] focus:border-[#333654] focus:outline-none focus:ring-2 focus:ring-[#333654]/10 transition-all cursor-pointer">
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-[#9F8EC4]">{label}</span>
      <span className="font-semibold text-[#333654]">{value}</span>
    </div>
  )
}
