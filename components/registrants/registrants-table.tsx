'use client'

import { useState, useRef, Fragment, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RegistrantForm } from './registrant-form'
import { Edit, Trash2, Search, UserPlus, Users, FileSpreadsheet, Loader2, X, CheckCircle2, Download, MessageCircle, Send, Printer, CreditCard, Link2, ShieldAlert, Bell, ChevronDown, Phone, Mail, AlertTriangle, Heart, CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import type { Registrant, Track, Trip, TripApproval } from '@/lib/types'
import { PAYMENT_STATUSES } from '@/lib/constants'
import * as XLSX from 'xlsx'
import { exportToExcel, exportToPrint, printDataCard } from '@/lib/export'

const paymentStyle: Record<string, string> = {
  'שולם מלא':   'bg-[#E5F4EC] text-[#1A7A4A]',
  'שולם חלקי':  'bg-[#FEF3E2] text-[#B45309]',
  'טרם שולם':   'bg-[#FDE8E7] text-[#C8251D]',
}

type Tab = 'כל הרשומים' | 'רשימת המתנה' | 'קבוצות'

interface RegistrantsTableProps {
  registrants: Registrant[]
  tracks: Track[]
  campId: string
  trips?: Trip[]
  tripApprovals?: TripApproval[]
}

function hasHealthFlag(r: Registrant) {
  return r.is_healthy === false || !!r.allergies?.trim() || !!r.medications?.trim() || !!r.health_issues?.trim()
}

function healthTooltip(r: Registrant) {
  const parts: string[] = []
  if (r.is_healthy === false) parts.push('אינו/ה בריא/ה')
  if (r.health_issues?.trim()) parts.push(`בעיות: ${r.health_issues}`)
  if (r.allergies?.trim()) parts.push(`אלרגיות: ${r.allergies}`)
  if (r.medications?.trim()) parts.push(`תרופות: ${r.medications}`)
  return parts.join(' | ')
}

export function RegistrantsTable({ registrants, tracks, campId, trips = [], tripApprovals = [] }: RegistrantsTableProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('כל הרשומים')
  const [search, setSearch] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('הכל')
  const [healthFilter, setHealthFilter] = useState(false)
  const [groupFilter, setGroupFilter] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Partial<Registrant> | undefined>()
  const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [payRegistrant, setPayRegistrant] = useState<Registrant | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payLoading, setPayLoading] = useState(false)
  const [payLink, setPayLink] = useState<string | null>(null)
  const [waOpen, setWaOpen] = useState(false)
  const [waMessage, setWaMessage] = useState('')
  const [waSending, setWaSending] = useState(false)
  const [waResult, setWaResult] = useState<{ sent: number; failed: number } | null>(null)
  const [waSinglePhone, setWaSinglePhone] = useState<string | null>(null)
  const [waUnpaidMode, setWaUnpaidMode] = useState(false)
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [reminderOpen, setReminderOpen] = useState(false)
  const [reminderDay, setReminderDay] = useState(0)
  const [reminderMsg, setReminderMsg] = useState('שלום {שם הורה}, תשלום עבור {שם הילד} טרם התקבל. אנא סדר/י זאת בהקדם.')
  const [reminderBanner, setReminderBanner] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem(`kaitanot_reminder_${campId}`)
    if (!stored) return
    try {
      const config = JSON.parse(stored) as { day: number; message: string }
      setReminderDay(config.day)
      setReminderMsg(config.message)
      if (config.day === new Date().getDay()) setReminderBanner(true)
    } catch { /* ignore */ }
  }, [campId])

  const uniqueGroups = [...new Set(registrants.map(r => r.group_name).filter(Boolean))] as string[]
  const waitingCount = registrants.filter(r => r.is_waiting).length
  const healthCount = registrants.filter(hasHealthFlag).length
  const unpaidCount = registrants.filter(r => r.payment_status !== 'שולם מלא' && !r.is_waiting).length

  function approvalForRegistrant(registrantId: string): TripApproval | undefined {
    if (!selectedTripId) return undefined
    return tripApprovals.find(a => a.trip_id === selectedTripId && a.registrant_id === registrantId)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })
      setImportPreview(rows)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function confirmImport() {
    if (!importPreview?.length) return
    setImporting(true)
    try {
      const res = await fetch('/api/registrants/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: importPreview, camp_id: campId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast.success(`יובאו ${json.count} ילדים בהצלחה`)
      setImportPreview(null)
      router.refresh()
    } catch (err) {
      toast.error('שגיאה בייבוא: ' + String(err))
    } finally {
      setImporting(false)
    }
  }

  function baseList() {
    if (activeTab === 'רשימת המתנה') return registrants.filter(r => r.is_waiting)
    return registrants
  }

  const filtered = baseList().filter((r) => {
    const name = `${r.first_name} ${r.last_name}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) ||
      (r.parent1_phone ?? '').includes(search)
    const matchPayment = paymentFilter === 'הכל' || r.payment_status === paymentFilter
    const matchHealth = !healthFilter || hasHealthFlag(r)
    const matchGroup = !groupFilter || r.group_name === groupFilter
    return matchSearch && matchPayment && matchHealth && matchGroup
  })

  const byGroup = uniqueGroups.reduce<Record<string, Registrant[]>>((acc, g) => {
    acc[g] = filtered.filter(r => r.group_name === g)
    return acc
  }, {})
  const noGroup = filtered.filter(r => !r.group_name)

  async function handleDelete(id: string) {
    const res = await fetch(`/api/registrants/${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('שגיאה במחיקה'); return }
    toast.success('הרשום נמחק')
    router.refresh()
  }

  function openEdit(r: Registrant) { setEditTarget(r); setFormOpen(true) }
  function openNew() { setEditTarget(undefined); setFormOpen(true) }

  function printCard(r: Registrant) {
    const age = r.birth_date
      ? Math.floor((Date.now() - new Date(r.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null
    const rows: Record<string, string> = {
      'שם מלא': `${r.first_name} ${r.last_name}`,
      'מגדר': r.gender ?? '—',
      'תאריך לידה': r.birth_date ?? '—',
      'גיל': age != null ? String(age) : '—',
      'קבוצה': r.group_name ?? '—',
      'שם הורה 1': r.parent1_name ?? '—',
      'טלפון הורה 1': r.parent1_phone ?? '—',
      'שם הורה 2': r.parent2_name ?? '—',
      'טלפון הורה 2': r.parent2_phone ?? '—',
      'איש קשר חירום': r.emergency_contact_name ?? '—',
      'טלפון חירום': r.emergency_contact_phone ?? '—',
      'אימייל': r.email ?? '—',
      'מידת חולצה': r.shirt_size ?? '—',
      'מידת כיפה': r.kippah_size ?? '—',
      'אשור פרסום תמונה': r.photo_consent ? 'מאושר' : 'לא מאושר',
      'בריאות': r.is_healthy === false ? 'יש הערות' : 'תקין',
      'בעיות בריאות': r.health_issues ?? '—',
      'אלרגיות': r.allergies ?? '—',
      'תרופות': r.medications ?? '—',
      'סטטוס תשלום': r.payment_status,
      'שולם': `₪${r.amount_paid}`,
      'לתשלום': `₪${r.amount_due}`,
      'הערות': r.notes ?? '',
    }
    printDataCard(`כרטיס ילד — ${r.first_name} ${r.last_name}`, rows)
  }

  function openPayment(r: Registrant) {
    setPayRegistrant(r)
    setPayAmount(String(r.amount_due > 0 ? r.amount_due : r.amount_due))
    setPayLink(null)
    setPayOpen(true)
  }

  async function createPaymentLink() {
    if (!payRegistrant || !payAmount) return
    setPayLoading(true)
    try {
      const res = await fetch('/api/payments/cardcom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrant_id: payRegistrant.id, amount: Number(payAmount) }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPayLink(json.payment_url)
    } catch (err) {
      toast.error('שגיאה ביצירת קישור: ' + String(err))
    } finally {
      setPayLoading(false)
    }
  }

  async function sendPaymentViaWA() {
    if (!payRegistrant?.parent1_phone || !payLink) return
    const msg = `שלום ${payRegistrant.parent1_name ?? ''},\nלתשלום דמי קייטנה עבור ${payRegistrant.first_name} ${payRegistrant.last_name} לחצ/י על הקישור:\n${payLink}`
    const res = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: payRegistrant.parent1_phone, message: msg }),
    })
    if (res.ok) { toast.success('הקישור נשלח בוואטסאפ'); setPayOpen(false) }
    else toast.error('שגיאה בשליחה')
  }

  function saveReminder() {
    localStorage.setItem(`kaitanot_reminder_${campId}`, JSON.stringify({ day: reminderDay, message: reminderMsg }))
    setReminderOpen(false)
    toast.success('תזכורת נשמרה — תופיע בכל ' + ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'][reminderDay])
  }

  function clearReminder() {
    localStorage.removeItem(`kaitanot_reminder_${campId}`)
    setReminderBanner(false)
    setReminderOpen(false)
    toast.success('התזכורת האוטומטית בוטלה')
  }

  function printHealthCards() {
    const withFlags = registrants.filter(hasHealthFlag)
    if (withFlags.length === 0) { toast.error('אין ילדים עם הערות בריאות'); return }
    const rows = withFlags.map(r => `
      <div class="card">
        <div class="card-header">
          <span class="name">${r.first_name} ${r.last_name}</span>
          ${r.group_name ? `<span class="group">${r.group_name}</span>` : ''}
        </div>
        ${r.allergies?.trim() ? `<div class="field allergy"><b>⚠ אלרגיות:</b> ${r.allergies}</div>` : ''}
        ${r.medications?.trim() ? `<div class="field"><b>💊 תרופות:</b> ${r.medications}</div>` : ''}
        ${r.health_issues?.trim() ? `<div class="field"><b>📋 הערות:</b> ${r.health_issues}</div>` : ''}
        ${r.emergency_contact_name ? `<div class="field emerg"><b>🆘 חירום:</b> ${r.emergency_contact_name}${r.emergency_contact_phone ? ' · ' + r.emergency_contact_phone : ''}</div>` : ''}
      </div>`).join('')
    const html = `<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>כרטיסי בריאות</title>
<style>
  body{font-family:Arial,sans-serif;padding:16px;background:#fff;color:#000}
  h1{text-align:center;color:#333654;margin-bottom:4px;font-size:18px}
  .subtitle{text-align:center;color:#888;font-size:12px;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
  .card{border:2px solid #e5e5e5;border-radius:8px;padding:10px;page-break-inside:avoid}
  .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;border-bottom:1px solid #f0f0f0;padding-bottom:6px}
  .name{font-weight:bold;font-size:14px;color:#333654}
  .group{font-size:11px;background:#f5f5f3;color:#6b6d8a;padding:2px 6px;border-radius:4px}
  .field{font-size:12px;margin:4px 0;line-height:1.4}
  .allergy{background:#fde8e7;border-right:3px solid #c8251d;padding:4px 6px;border-radius:0 4px 4px 0}
  .emerg{background:#fff8e1;border-right:3px solid #f8ad1d;padding:4px 6px;border-radius:0 4px 4px 0}
  @media print{body{padding:0}h1{font-size:14px}}
</style></head><body>
<h1>כרטיסי בריאות — לצוות בלבד</h1>
<div class="subtitle">${withFlags.length} ילדים · ${new Date().toLocaleDateString('he-IL')}</div>
<div class="grid">${rows}</div>
</body></html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) { toast.error('נחסמה פתיחת חלון — אפשר popups בדפדפן'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 500)
  }

  function openWaBulk() { setWaSinglePhone(null); setWaUnpaidMode(false); setWaMessage(''); setWaResult(null); setWaOpen(true) }
  function openWaUnpaid() { setWaSinglePhone(null); setWaUnpaidMode(true); setWaMessage(''); setWaResult(null); setWaOpen(true) }
  function openWaSingle(phone: string) { setWaSinglePhone(phone); setWaUnpaidMode(false); setWaMessage(''); setWaResult(null); setWaOpen(true) }

  async function sendWhatsApp() {
    if (!waMessage.trim()) return
    setWaSending(true)
    setWaResult(null)
    try {
      if (waSinglePhone) {
        const res = await fetch('/api/whatsapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: waSinglePhone, message: waMessage }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setWaResult({ sent: 1, failed: 0 })
      } else {
        const body: Record<string, unknown> = { camp_id: campId, message: waMessage }
        if (waUnpaidMode) body.filter = 'unpaid'
        const res = await fetch('/api/whatsapp', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        setWaResult(json)
      }
    } catch (err) {
      toast.error('שגיאה בשליחה: ' + String(err))
    } finally {
      setWaSending(false)
    }
  }

  function renderRow(r: Registrant) {
    const age = r.birth_date
      ? Math.floor((Date.now() - new Date(r.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
      : null
    const flag = hasHealthFlag(r)
    const phone = r.primary_phone || r.parent1_phone
    const isExpanded = expandedId === r.id
    const colCount = selectedTripId ? 7 : 6

    return (
      <Fragment key={r.id}>
        <tr
          className={`cursor-pointer hover:bg-[#F8AD1D]/5 border-r-2 transition-all duration-150 ${isExpanded ? 'bg-[#FFFBF0] border-r-[#F8AD1D]' : 'border-r-transparent hover:border-r-[#F8AD1D]'}`}
          onClick={() => setExpandedId(isExpanded ? null : r.id)}
        >
          <td className="py-3.5 pr-4 pl-2">
            <div className="flex items-center gap-2">
              <ChevronDown className={`h-3.5 w-3.5 text-[#9091A8] shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#F8AD1D]' : ''}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {flag && (
                    <span className="inline-block h-2 w-2 rounded-full bg-[#C8251D] shrink-0" title={healthTooltip(r)} />
                  )}
                  <span className="font-semibold text-[#333654]">{r.first_name} {r.last_name}</span>
                  {r.is_waiting && <span className="text-xs font-normal text-[#9091A8]">(המתנה)</span>}
                </div>
              </div>
              {/* עפרון + וואצאפ ליד כל תלמיד */}
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => openEdit(r)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#E0F7F7] hover:text-[#00B1AE] transition-colors"
                  title="עדכן פרטים"
                >
                  <Edit className="h-3.5 w-3.5" />
                </button>
                {phone && (
                  <button
                    onClick={() => openWaSingle(phone)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#E6F9ED] hover:text-[#25D366] transition-colors"
                    title="שלח WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          </td>
          <td className="py-3.5 px-3 text-[#6B6D8A]">{age ?? '—'}</td>
          <td className="py-3.5 px-3 text-[#6B6D8A] hidden sm:table-cell">{r.group_name ?? '—'}</td>
          <td className="py-3.5 px-3 text-[#6B6D8A] hidden md:table-cell" dir="ltr">{phone ?? '—'}</td>
          <td className="py-3.5 px-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${paymentStyle[r.payment_status] ?? 'bg-[#F5F5F3] text-[#6B6D8A]'}`}>
              {r.payment_status}
            </span>
          </td>
          {selectedTripId && (() => {
            const approval = approvalForRegistrant(r.id)
            return (
              <td className="py-3.5 px-3">
                {approval
                  ? approval.signed
                    ? <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#E5F4EC] text-[#1A7A4A]"><CheckCircle2 className="h-3 w-3" />חתם</span>
                    : <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-[#FEF3E2] text-[#B45309]">⏳ ממתין</span>
                  : <span className="text-xs text-[#9091A8]">—</span>
                }
              </td>
            )
          })()}
          <td className="py-3.5 px-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex gap-1">
              {r.payment_status !== 'שולם מלא' && (
                <button
                  onClick={(e) => { e.stopPropagation(); openPayment(r) }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#FEF0EC] hover:text-[#333654] transition-colors"
                  title="שלח קישור תשלום"
                >
                  <CreditCard className="h-3.5 w-3.5" />
                </button>
              )}
              {phone && (
                <button
                  onClick={(e) => { e.stopPropagation(); openWaSingle(phone) }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#E6F9ED] hover:text-[#25D366] transition-colors"
                  title="שלח WhatsApp"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); printCard(r) }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#F5F5F3] hover:text-[#333654] transition-colors"
                title="הדפס כרטיס"
              >
                <Printer className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); openEdit(r) }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#F5F5F3] hover:text-[#00B1AE] transition-colors"
              >
                <Edit className="h-3.5 w-3.5" />
              </button>
              <div onClick={(e) => e.stopPropagation()}>
                <AlertDialog>
                  <AlertDialogTrigger className="flex h-7 w-7 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#FDE8E7] hover:text-[#C8251D] transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </AlertDialogTrigger>
                  <AlertDialogContent dir="rtl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת רשום</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם למחוק את {r.first_name} {r.last_name}? פעולה זו אינה ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(r.id)} className="bg-[#C8251D] hover:bg-[#a01e17] text-white">
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </td>
        </tr>

        {/* ── Expanded details row ── */}
        {isExpanded && (
          <tr>
            <td colSpan={colCount} className="px-4 pb-4 pt-1 bg-[#FFFBF0]">
              <div className="rounded-xl border border-[#F8AD1D]/30 bg-white shadow-sm p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-4">

                  {/* הורה 1 */}
                  {(r.parent1_name || r.parent1_phone) && (
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">
                        <Phone className="h-3 w-3" />הורה 1
                      </p>
                      {r.parent1_name && <p className="text-sm font-semibold text-[#333654]">{r.parent1_name}</p>}
                      {r.parent1_phone && <p className="text-xs text-[#6B6D8A] mt-0.5" dir="ltr">{r.parent1_phone}</p>}
                    </div>
                  )}

                  {/* הורה 2 */}
                  {(r.parent2_name || r.parent2_phone) && (
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">
                        <Phone className="h-3 w-3" />הורה 2
                      </p>
                      {r.parent2_name && <p className="text-sm font-semibold text-[#333654]">{r.parent2_name}</p>}
                      {r.parent2_phone && <p className="text-xs text-[#6B6D8A] mt-0.5" dir="ltr">{r.parent2_phone}</p>}
                    </div>
                  )}

                  {/* חירום */}
                  {(r.emergency_contact_name || r.emergency_contact_phone) && (
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#C8251D] uppercase tracking-wider mb-1">
                        <AlertTriangle className="h-3 w-3" />חירום
                      </p>
                      {r.emergency_contact_name && <p className="text-sm font-semibold text-[#333654]">{r.emergency_contact_name}</p>}
                      {r.emergency_contact_phone && <p className="text-xs text-[#6B6D8A] mt-0.5" dir="ltr">{r.emergency_contact_phone}</p>}
                    </div>
                  )}

                  {/* אימייל */}
                  {r.email && (
                    <div>
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">
                        <Mail className="h-3 w-3" />אימייל
                      </p>
                      <p className="text-xs text-[#333654]" dir="ltr">{r.email}</p>
                    </div>
                  )}

                  {/* תאריך לידה */}
                  {r.birth_date && (
                    <div>
                      <p className="text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">תאריך לידה</p>
                      <p className="text-sm text-[#333654]">{r.birth_date}</p>
                    </div>
                  )}

                  {/* תשלום */}
                  <div>
                    <p className="text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">תשלום</p>
                    <div className="flex flex-col gap-0.5">
                      {r.amount_paid != null && (
                        <span className="text-xs font-semibold text-[#1A7A4A]">שולם ₪{Number(r.amount_paid).toLocaleString()}</span>
                      )}
                      {r.amount_due != null && Number(r.amount_due) > 0 && (
                        <span className="text-xs font-semibold text-[#C8251D]">נותר ₪{Number(r.amount_due).toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* בריאות */}
                  {flag && (
                    <div className="col-span-2">
                      <p className="flex items-center gap-1 text-[10px] font-bold text-[#C8251D] uppercase tracking-wider mb-1">
                        <Heart className="h-3 w-3" />בריאות
                      </p>
                      <div className="rounded-lg bg-[#FDE8E7] px-3 py-2 text-xs text-[#333654] space-y-0.5">
                        {r.allergies?.trim() && <p><span className="font-semibold">אלרגיות:</span> {r.allergies}</p>}
                        {r.medications?.trim() && <p><span className="font-semibold">תרופות:</span> {r.medications}</p>}
                        {r.health_issues?.trim() && <p><span className="font-semibold">הערות:</span> {r.health_issues}</p>}
                        {r.is_healthy === false && !r.allergies && !r.medications && !r.health_issues && <p>מצוין כבעל בעיות בריאות</p>}
                      </div>
                    </div>
                  )}

                  {/* הערות */}
                  {r.notes?.trim() && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-[#9091A8] uppercase tracking-wider mb-1">הערות</p>
                      <p className="text-xs text-[#6B6D8A] bg-[#F5F5F3] rounded-lg px-3 py-2">{r.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    )
  }

  const tableHead = (
    <thead>
      <tr className="bg-[#333654] text-right text-xs text-white/80">
        <th className="py-3 pr-4 pl-2 font-semibold tracking-wide">שם</th>
        <th className="py-3 px-3 font-semibold tracking-wide">גיל</th>
        <th className="py-3 px-3 font-semibold tracking-wide hidden sm:table-cell">קבוצה</th>
        <th className="py-3 px-3 font-semibold tracking-wide hidden md:table-cell">טלפון הורה</th>
        <th className="py-3 px-3 font-semibold tracking-wide">תשלום</th>
        {selectedTripId && <th className="py-3 px-3 font-semibold tracking-wide">אישור טיול</th>}
        <th className="py-3 px-3 font-semibold tracking-wide">פעולות</th>
      </tr>
    </thead>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* Auto-reminder banner */}
      {reminderBanner && unpaidCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#F8AD1D] bg-[#FEF9EC] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <CalendarClock className="h-5 w-5 text-[#A07830] shrink-0" />
            <p className="text-sm font-semibold text-[#7A5C00]">
              היום יום התזכורות האוטומטיות — {unpaidCount} הורים עם יתרת חוב
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { setReminderBanner(false); openWaUnpaid() }}
              className="rounded-lg bg-[#F8AD1D] px-3 py-1.5 text-xs font-bold text-[#333654] hover:bg-[#e09c12] transition-colors"
            >
              שלח עכשיו
            </button>
            <button onClick={() => setReminderBanner(false)} className="text-[#9091A8] hover:text-[#6B6D8A]">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#E5E5E8]">
        {(['כל הרשומים', 'רשימת המתנה', 'קבוצות'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-[#333654] text-[#333654]'
                : 'border-transparent text-[#6B6D8A] hover:text-[#333654]'
            }`}
          >
            {tab}
            {tab === 'רשימת המתנה' && waitingCount > 0 && (
              <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C8251D] px-1 text-[10px] font-bold text-white">
                {waitingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9091A8]" />
          <input
            type="text"
            placeholder="חיפוש לפי שם או טלפון..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-lg border border-[#E5E5E8] bg-white pr-9 pl-3 text-sm text-[#333654] placeholder:text-[#9091A8] focus:border-[#00B1AE] focus:outline-none focus:ring-2 focus:ring-[#00B1AE]/20 transition-all"
          />
        </div>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#6B6D8A] focus:border-[#00B1AE] focus:outline-none cursor-pointer"
        >
          <option value="הכל">כל הסטטוסים</option>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {uniqueGroups.length > 0 && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#6B6D8A] focus:border-[#00B1AE] focus:outline-none cursor-pointer"
          >
            <option value="">כל הקבוצות</option>
            {uniqueGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
        <button
          onClick={() => setHealthFilter(v => !v)}
          className={`flex items-center gap-1.5 h-9 rounded-lg border px-3 text-sm font-semibold transition-colors ${
            healthFilter
              ? 'border-[#C8251D] bg-[#FDE8E7] text-[#C8251D]'
              : 'border-[#E5E5E8] bg-white text-[#6B6D8A] hover:border-[#C8251D] hover:text-[#C8251D]'
          }`}
          title={`${healthCount} ילדים עם הערות בריאות`}
        >
          <ShieldAlert className="h-4 w-4" />הערות בריאות{healthCount > 0 && ` (${healthCount})`}
        </button>
        <button
          onClick={() => exportToPrint('registrants-table', `רשומים — ${filtered.length} ילדים`)}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#333654] hover:text-[#333654] transition-colors"
        >
          <Printer className="h-4 w-4" />הדפס
        </button>
        <button
          onClick={() => exportToExcel(filtered.map(r => ({
            'שם פרטי': r.first_name, 'שם משפחה': r.last_name,
            'תאריך לידה': r.birth_date ?? '',
            'קבוצה': r.group_name ?? '',
            'שם הורה 1': r.parent1_name ?? '', 'טלפון הורה 1': r.parent1_phone ?? '',
            'שם הורה 2': r.parent2_name ?? '', 'טלפון הורה 2': r.parent2_phone ?? '',
            'איש קשר חירום': r.emergency_contact_name ?? '', 'טלפון חירום': r.emergency_contact_phone ?? '',
            'בריאות': r.is_healthy === false ? 'יש הערות' : 'תקין',
            'בעיות בריאות': r.health_issues ?? '', 'אלרגיות': r.allergies ?? '', 'תרופות': r.medications ?? '',
            'אימייל': r.email ?? '',
            'סטטוס תשלום': r.payment_status,
            'שולם': r.amount_paid, 'לתשלום': r.amount_due,
            'הערות': r.notes ?? '',
          })), 'רשומים')}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#1A7A4A] hover:text-[#1A7A4A] transition-colors"
        >
          <Download className="h-4 w-4" />ייצוא Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#00B1AE] hover:text-[#00B1AE] transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />ייבוא אקסל
        </button>
        <button
          onClick={openWaBulk}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#25D366] hover:text-[#25D366] transition-colors"
        >
          <MessageCircle className="h-4 w-4" />WhatsApp
        </button>
        {unpaidCount > 0 && (
          <button
            onClick={openWaUnpaid}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#B45309] hover:text-[#B45309] transition-colors"
            title={`שלח תזכורת תשלום ל-${unpaidCount} ילדים שלא שילמו`}
          >
            <Bell className="h-4 w-4" />תזכורות תשלום ({unpaidCount})
          </button>
        )}
        {trips.length > 0 && (
          <select
            value={selectedTripId}
            onChange={e => setSelectedTripId(e.target.value)}
            className="h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm text-[#6B6D8A] focus:border-[#00B1AE] focus:outline-none cursor-pointer"
          >
            <option value="">אישורי טיול: בחר</option>
            {trips.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
          </select>
        )}
        {healthCount > 0 && (
          <button
            onClick={printHealthCards}
            className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#C8251D] hover:text-[#C8251D] transition-colors"
            title={`הדפס כרטיסי בריאות ל-${healthCount} ילדים`}
          >
            <Heart className="h-4 w-4" />כרטיסי בריאות
          </button>
        )}
        <button
          onClick={() => setReminderOpen(true)}
          className="flex items-center gap-1.5 h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm font-semibold text-[#6B6D8A] hover:border-[#F8AD1D] hover:text-[#A07830] transition-colors"
          title="הגדר תזכורת תשלום אוטומטית שבועית"
        >
          <CalendarClock className="h-4 w-4" />תזכורת אוטומטית
        </button>
        <Button onClick={openNew} size="sm" className="gap-1.5 bg-[#333654] hover:bg-[#444668] text-white">
          <UserPlus className="h-4 w-4" />
          הוסף ילד
        </Button>
      </div>

      {/* Import preview modal */}
      {importPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setImportPreview(null)} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
              <div>
                <h2 className="font-black text-[#333654]">תצוגה מקדימה — ייבוא</h2>
                <p className="text-xs text-[#9091A8] mt-0.5">{importPreview.length} שורות נמצאו</p>
              </div>
              <button onClick={() => setImportPreview(null)} className="text-[#9091A8] hover:text-[#6B6D8A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-auto flex-1 p-4">
              <div className="mb-3 rounded-lg bg-[#E0F7F7] px-3 py-2 text-xs text-[#00B1AE]">
                <strong>עמודות נדרשות:</strong> שם פרטי, שם משפחה | אופציונלי: קבוצה, תאריך לידה, שם הורה 1, טלפון הורה 1, אימייל, סטטוס תשלום, שולם, לתשלום
              </div>
              <div className="overflow-x-auto rounded-lg border border-[#E5E5E8]">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-[#F5F5F3] text-right text-[#6B6D8A]">
                      {Object.keys(importPreview[0] ?? {}).slice(0, 7).map(k => (
                        <th key={k} className="px-3 py-2 font-semibold whitespace-nowrap">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#FEF0EC]">
                    {importPreview.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).slice(0, 7).map((v, j) => (
                          <td key={j} className="px-3 py-2 text-[#333654] whitespace-nowrap">{String(v)}</td>
                        ))}
                      </tr>
                    ))}
                    {importPreview.length > 5 && (
                      <tr>
                        <td colSpan={7} className="px-3 py-2 text-center text-[#9091A8]">
                          ועוד {importPreview.length - 5} שורות...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4 border-t border-[#FEF0EC]">
              <button onClick={() => setImportPreview(null)}
                className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">
                ביטול
              </button>
              <button onClick={confirmImport} disabled={importing}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60">
                {importing
                  ? <><Loader2 className="h-4 w-4 animate-spin" />מייבא...</>
                  : <><CheckCircle2 className="h-4 w-4" />ייבא {importPreview.length} רשומים</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table card — groups view */}
      {activeTab === 'קבוצות' ? (
        <div className="flex flex-col gap-4">
          {uniqueGroups.map(g => {
            const rows = byGroup[g] ?? []
            if (rows.length === 0) return null
            return (
              <div key={g} className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#FEF0EC] bg-[#F5F5F3]">
                  <span className="font-bold text-[#333654]">{g}</span>
                  <span className="text-xs font-semibold text-[#9091A8]">{rows.length} ילדים</span>
                </div>
                <ScrollArea className="w-full">
                  <table className="min-w-full text-sm">
                    {tableHead}
                    <tbody className="divide-y divide-[#FEF0EC]">
                      {rows.map(renderRow)}
                    </tbody>
                  </table>
                </ScrollArea>
              </div>
            )
          })}
          {noGroup.length > 0 && (
            <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#FEF0EC] bg-[#F5F5F3]">
                <span className="font-bold text-[#9091A8]">ללא קבוצה</span>
                <span className="text-xs font-semibold text-[#9091A8]">{noGroup.length} ילדים</span>
              </div>
              <ScrollArea className="w-full">
                <table className="min-w-full text-sm">
                  {tableHead}
                  <tbody className="divide-y divide-[#FEF0EC]">
                    {noGroup.map(renderRow)}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
          {filtered.length === 0 && (
            <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm py-16 text-center">
              <p className="text-sm font-medium text-[#6B6D8A]">אין רשומים עם קבוצות</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#FEF0EC]">
            <span className="text-xs font-bold text-[#9091A8] uppercase tracking-wider">
              {activeTab === 'רשימת המתנה' ? 'ממתינים לרישום' : 'רשומים'}
            </span>
            <span className="text-sm font-semibold text-[#333654]">{filtered.length}</span>
          </div>

          <ScrollArea className="w-full">
            <table id="registrants-table" className="min-w-full text-sm">
              {tableHead}
              <tbody className="divide-y divide-[#FEF0EC]">
                {filtered.map(renderRow)}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F3]">
                          <Users className="h-7 w-7 text-[#9091A8]" />
                        </div>
                        <p className="text-sm font-medium text-[#6B6D8A]">אין רשומים עדיין</p>
                        <button
                          onClick={openNew}
                          className="text-sm font-semibold text-[#00B1AE] hover:underline"
                        >
                          הוסף ילד ראשון
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </ScrollArea>
        </div>
      )}

      {/* Payment modal */}
      {payOpen && payRegistrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !payLoading && setPayOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#FEF0EC]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF0EC]">
                <CreditCard className="h-5 w-5 text-[#333654]" />
              </div>
              <div>
                <h2 className="font-black text-[#333654]">קישור תשלום — Cardcom</h2>
                <p className="text-xs text-[#9091A8] mt-0.5">{payRegistrant.first_name} {payRegistrant.last_name}</p>
              </div>
              <button onClick={() => setPayOpen(false)} disabled={payLoading} className="mr-auto text-[#9091A8] hover:text-[#6B6D8A] disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B6D8A] mb-1.5 uppercase tracking-wider">סכום לתשלום (₪)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  disabled={!!payLink}
                  className="w-full h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm text-[#333654] focus:border-[#333654] focus:outline-none focus:ring-2 focus:ring-[#333654]/20 disabled:bg-[#F5F5F3] transition-all"
                  placeholder="0"
                />
                {payRegistrant.amount_due > 0 && (
                  <p className="text-xs text-[#9091A8] mt-1">יתרת חוב: ₪{payRegistrant.amount_due.toLocaleString()}</p>
                )}
              </div>

              {payLink ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg bg-[#F0FDF4] border border-[#BBF7D0] p-3">
                    <p className="text-xs font-bold text-[#16A34A] mb-1">קישור תשלום נוצר בהצלחה:</p>
                    <a href={payLink} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#333654] hover:underline break-all">
                      <Link2 className="h-3.5 w-3.5 shrink-0" />{payLink}
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { navigator.clipboard.writeText(payLink); toast.success('הועתק!') }}
                      className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3] transition-colors"
                    >
                      העתק קישור
                    </button>
                    {payRegistrant.parent1_phone && (
                      <button
                        onClick={sendPaymentViaWA}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-[#25D366] py-2.5 text-sm font-bold text-white hover:bg-[#1ebe59] transition-colors"
                      >
                        <MessageCircle className="h-4 w-4" />שלח בוואטסאפ
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={createPaymentLink}
                  disabled={payLoading || !payAmount || Number(payAmount) <= 0}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#4f3a8e] disabled:opacity-50 transition-colors"
                >
                  {payLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />יוצר קישור...</>
                    : <><CreditCard className="h-4 w-4" />צור קישור תשלום</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp modal */}
      {waOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !waSending && setWaOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#FEF0EC]">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${waUnpaidMode ? 'bg-[#FEF3E2]' : 'bg-[#E6F9ED]'}`}>
                {waUnpaidMode
                  ? <Bell className="h-5 w-5 text-[#B45309]" />
                  : <MessageCircle className="h-5 w-5 text-[#25D366]" />
                }
              </div>
              <div className="flex-1">
                <h2 className="font-black text-[#333654]">
                  {waSinglePhone
                    ? 'שלח הודעת WhatsApp'
                    : waUnpaidMode
                      ? `תזכורת תשלום (${unpaidCount} הורים)`
                      : `שלח לכל ההורים (${registrants.filter(r => r.primary_phone || r.parent1_phone).length} ‏מספרים)`
                  }
                </h2>
                {waSinglePhone && (
                  <p className="text-xs text-[#9091A8] mt-0.5" dir="ltr">{waSinglePhone}</p>
                )}
                {waUnpaidMode && (
                  <p className="text-xs text-[#9091A8] mt-0.5">ישלח רק להורים שטרם שילמו מלא</p>
                )}
              </div>
              <button onClick={() => setWaOpen(false)} disabled={waSending} className="text-[#9091A8] hover:text-[#6B6D8A] disabled:opacity-40">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {!waSinglePhone && (
                <div className="rounded-lg bg-[#E0F7F7] px-3 py-2 text-xs text-[#00B1AE]">
                  <strong>תבנית אישית:</strong> השתמשי ב-<code className="bg-white/60 px-1 rounded">{'{שם הילד}'}</code> ו-<code className="bg-white/60 px-1 rounded">{'{שם הורה}'}</code> לפרסונליזציה
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#6B6D8A] mb-1.5 uppercase tracking-wider">הודעה</label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  placeholder={
                    waSinglePhone
                      ? 'כתבי הודעה...'
                      : waUnpaidMode
                        ? 'שלום {שם הורה}, תשלום עבור {שם הילד} טרם התקבל. ניתן לשלם בקישור...'
                        : 'שלום {שם הורה}, ילדך {שם הילד} רשום לקייטנה...'
                  }
                  rows={5}
                  disabled={waSending || !!waResult}
                  className="w-full rounded-lg border border-[#E5E5E8] p-3 text-sm text-[#333654] placeholder:text-[#9091A8] focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20 resize-none disabled:bg-[#F5F5F3] transition-all"
                />
                <p className="text-xs text-[#9091A8] mt-1 text-left">{waMessage.length} תווים</p>
              </div>

              {waResult && (
                <div className={`rounded-lg px-4 py-3 text-sm font-semibold flex items-center gap-2 ${waResult.failed === 0 ? 'bg-[#E5F4EC] text-[#1A7A4A]' : 'bg-[#FEF3E2] text-[#B45309]'}`}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {waSinglePhone
                    ? 'ההודעה נשלחה בהצלחה!'
                    : `נשלחו ${waResult.sent} הודעות${waResult.failed > 0 ? ` · ${waResult.failed} נכשלו` : ''}`
                  }
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 pb-5">
              <button onClick={() => setWaOpen(false)} disabled={waSending}
                className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3] disabled:opacity-40">
                {waResult ? 'סגור' : 'ביטול'}
              </button>
              {!waResult && (
                <button onClick={sendWhatsApp} disabled={waSending || !waMessage.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-colors ${
                    waUnpaidMode ? 'bg-[#B45309] hover:bg-[#92400e]' : 'bg-[#25D366] hover:bg-[#1ebe59]'
                  }`}>
                  {waSending
                    ? <><Loader2 className="h-4 w-4 animate-spin" />שולח...</>
                    : <><Send className="h-4 w-4" />שלח</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auto-reminder config modal */}
      {reminderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setReminderOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#FEF0EC]">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FEF9EC]">
                <CalendarClock className="h-5 w-5 text-[#A07830]" />
              </div>
              <div className="flex-1">
                <h2 className="font-black text-[#333654]">תזכורת תשלום אוטומטית</h2>
                <p className="text-xs text-[#9091A8] mt-0.5">תופיע כבאנר בכל פתיחת האפליקציה ביום שנבחר</p>
              </div>
              <button onClick={() => setReminderOpen(false)} className="text-[#9091A8] hover:text-[#6B6D8A]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-[#6B6D8A] mb-1.5 uppercase tracking-wider">יום בשבוע לתזכורת</label>
                <select
                  value={reminderDay}
                  onChange={e => setReminderDay(Number(e.target.value))}
                  className="w-full h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm text-[#333654] focus:border-[#F8AD1D] focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]/20"
                >
                  {['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'].map((d, i) => (
                    <option key={i} value={i}>יום {d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#6B6D8A] mb-1.5 uppercase tracking-wider">הודעת תזכורת</label>
                <div className="rounded-lg bg-[#E0F7F7] px-3 py-2 text-xs text-[#00B1AE] mb-2">
                  השתמש/י ב-<code className="bg-white/60 px-1 rounded">{'{שם הילד}'}</code> ו-<code className="bg-white/60 px-1 rounded">{'{שם הורה}'}</code>
                </div>
                <textarea
                  value={reminderMsg}
                  onChange={e => setReminderMsg(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#E5E5E8] p-3 text-sm text-[#333654] focus:border-[#F8AD1D] focus:outline-none focus:ring-2 focus:ring-[#F8AD1D]/20 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button onClick={clearReminder}
                className="rounded-lg border border-[#E5E5E8] px-4 py-2.5 text-sm font-semibold text-[#9091A8] hover:text-[#C8251D] hover:border-[#C8251D] transition-colors">
                בטל תזכורת
              </button>
              <button onClick={saveReminder}
                className="flex-1 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] transition-colors">
                שמור תזכורת
              </button>
            </div>
          </div>
        </div>
      )}

      <RegistrantForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => router.refresh()}
        campId={campId}
        tracks={tracks}
        initial={editTarget}
      />
    </div>
  )
}
