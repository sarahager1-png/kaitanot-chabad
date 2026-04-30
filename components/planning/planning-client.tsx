'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CalendarDays, Clock, Loader2, X, Link as LinkIcon, Paperclip, FileText, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { DailyPlan, Activity } from '@/lib/types'
import { format, parseISO } from 'date-fns'

interface PlanFile {
  id: string
  plan_id: string
  file_name: string
  file_url: string
  file_size: number | null
}

interface PlanningClientProps {
  plans: DailyPlan[]
  duties: never[]
  campId: string
  campOpenAt: string | null
  campCloseAt: string | null
}

const activityColors = [
  'border-r-[#00B1AE] bg-[#E0F7F7]',
  'border-r-[#333654] bg-[#FEF0EC]',
  'border-r-[#1A7A4A] bg-[#E5F4EC]',
  'border-r-[#B45309] bg-[#FEF3E2]',
  'border-r-[#333654] bg-[#F5F5F3]',
]

function formatDay(d: string) {
  try {
    const date = parseISO(d)
    const days = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת']
    return { day: days[date.getDay()], date: format(date, 'dd/MM') }
  } catch { return { day: '', date: d } }
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function PlanningClient({ plans, campId, campOpenAt, campCloseAt }: PlanningClientProps) {
  const router = useRouter()
  const [planFormOpen, setPlanFormOpen] = useState(false)
  const [actFormOpen, setActFormOpen] = useState(false)
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [planDate, setPlanDate] = useState('')
  const [planTopic, setPlanTopic] = useState('')
  const [actTitle, setActTitle] = useState('')
  const [actStart, setActStart] = useState('')
  const [actEnd, setActEnd] = useState('')
  const [actDesc, setActDesc] = useState('')
  const [actResponsible, setActResponsible] = useState('')
  const [actMaterials, setActMaterials] = useState('')

  // Files state per plan
  const [planFiles, setPlanFiles] = useState<Record<string, PlanFile[]>>({})
  const [uploading, setUploading] = useState<string | null>(null) // plan_id being uploaded
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingForPlan, setUploadingForPlan] = useState<string | null>(null)

  async function addPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!planDate) { toast.error('חובה לבחור תאריך'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: campId, plan_date: planDate, topic: planTopic || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('יום תכנון נוסף')
      router.refresh()
      setPlanFormOpen(false)
      setPlanDate(''); setPlanTopic('')
    } catch (err) { toast.error(String(err)) } finally { setLoading(false) }
  }

  async function addActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!actTitle || !activePlanId) return
    setLoading(true)
    try {
      const res = await fetch('/api/planning/activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan_id: activePlanId, title: actTitle,
          start_time: actStart || null, end_time: actEnd || null,
          description: actDesc || null, responsible: actResponsible || null,
          materials_url: actMaterials || null,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      toast.success('פעילות נוספה')
      router.refresh()
      setActFormOpen(false)
      setActTitle(''); setActStart(''); setActEnd(''); setActDesc(''); setActResponsible(''); setActMaterials('')
    } catch (err) { toast.error(String(err)) } finally { setLoading(false) }
  }

  function triggerFileUpload(planId: string) {
    setUploadingForPlan(planId)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingForPlan) return
    e.target.value = ''

    setUploading(uploadingForPlan)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('plan_id', uploadingForPlan)
      fd.append('camp_id', campId)

      const res = await fetch('/api/planning/files', { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const newFile: PlanFile = await res.json()
      setPlanFiles(prev => ({
        ...prev,
        [uploadingForPlan]: [...(prev[uploadingForPlan] ?? []), newFile],
      }))
      toast.success('קובץ הועלה')
    } catch (err) { toast.error(String(err)) } finally {
      setUploading(null)
      setUploadingForPlan(null)
    }
  }

  async function deletePlan(planId: string) {
    if (!confirm('למחוק יום זה וכל הפעילויות שלו?')) return
    try {
      const res = await fetch(`/api/planning/${planId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('יום נמחק')
      router.refresh()
    } catch (err) { toast.error(String(err)) }
  }

  async function deleteActivity(activityId: string) {
    try {
      const res = await fetch(`/api/planning/activity/${activityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      toast.success('פעילות נמחקה')
      router.refresh()
    } catch (err) { toast.error(String(err)) }
  }

  async function deleteFile(planId: string, fileId: string, fileUrl: string) {
    try {
      const res = await fetch('/api/planning/files', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: fileId, file_url: fileUrl }),
      })
      if (!res.ok) throw new Error(await res.text())
      setPlanFiles(prev => ({
        ...prev,
        [planId]: (prev[planId] ?? []).filter(f => f.id !== fileId),
      }))
      toast.success('קובץ נמחק')
    } catch (err) { toast.error(String(err)) }
  }

  function openAddActivity(planId: string) { setActivePlanId(planId); setActFormOpen(true) }

  return (
    <div className="flex flex-col gap-4">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.txt" />

      <div className="flex items-center justify-between">
        <p className="text-sm text-[#6B6D8A]">{plans.length} ימים מתוכננים</p>
        <button onClick={() => setPlanFormOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-2 text-sm font-bold text-white hover:bg-[#444668] transition-colors">
          <Plus className="h-4 w-4" />הוסף יום
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 rounded-xl border border-dashed border-[#E5E5E8]">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5F5F3]">
            <CalendarDays className="h-8 w-8 text-[#9091A8]" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-[#333654]">אין תכנון עדיין</p>
            <p className="text-sm text-[#9091A8] mt-1">הוסף ימים ובנה את לוח הפעילויות</p>
          </div>
          <button onClick={() => setPlanFormOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-4 py-2 text-sm font-bold text-white hover:bg-[#444668] transition-colors">
            <Plus className="h-4 w-4" />הוסף יום ראשון
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3" style={{ minWidth: `max(100%, ${plans.length * 270}px)` }}>
            {plans.map((plan) => {
              const { day, date } = formatDay(plan.plan_date)
              const files = planFiles[plan.id] ?? []
              const isUploading = uploading === plan.id
              return (
                <div key={plan.id} className="w-[80vw] sm:w-64 flex-shrink-0 flex flex-col rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
                  {/* Day header */}
                  <div className="bg-gradient-to-l from-[#333654] to-[#444668] px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-white/60 font-medium">יום {day}</p>
                        <p className="text-lg font-black text-white">{date}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.topic && (
                          <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white max-w-[100px] truncate">
                            {plan.topic}
                          </span>
                        )}
                        <button onClick={() => deletePlan(plan.id)} className="text-white/50 hover:text-red-300 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="flex flex-1 flex-col gap-2 p-3">
                    {(plan.activities ?? []).length === 0 ? (
                      <p className="py-2 text-center text-xs text-[#9091A8]">אין פעילויות עדיין</p>
                    ) : (
                      (plan.activities as Activity[]).map((act, i) => (
                        <div key={act.id} className={`rounded-lg border-r-4 p-2.5 text-xs group ${activityColors[i % activityColors.length]}`}>
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              {(act.start_time || act.end_time) && (
                                <div className="flex items-center gap-1 text-[#6B6D8A] mb-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{act.start_time ?? ''}{act.end_time ? ` – ${act.end_time}` : ''}</span>
                                </div>
                              )}
                              <p className="font-semibold text-[#333654]">{act.title}</p>
                              {act.description && <p className="text-[#6B6D8A] mt-0.5 line-clamp-2">{act.description}</p>}
                              {act.responsible && <p className="text-[#9091A8] mt-0.5">👤 {act.responsible}</p>}
                              {act.materials_url && (
                                <a href={act.materials_url} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-[#00B1AE] mt-0.5 hover:underline">
                                  <LinkIcon className="h-3 w-3" />חומרים
                                </a>
                              )}
                            </div>
                            <button onClick={() => deleteActivity(act.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9091A8] hover:text-red-500 flex-shrink-0 mt-0.5">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <button onClick={() => openAddActivity(plan.id)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-[#E5E5E8] py-2 text-xs font-semibold text-[#9091A8] hover:border-[#00B1AE] hover:text-[#00B1AE] transition-colors">
                      <Plus className="h-3.5 w-3.5" />הוסף פעילות
                    </button>

                    {/* Files section */}
                    {files.length > 0 && (
                      <div className="mt-1 border-t border-[#F5F5F3] pt-2 flex flex-col gap-1.5">
                        <p className="text-[10px] font-bold text-[#9091A8] uppercase tracking-wider flex items-center gap-1">
                          <Paperclip className="h-2.5 w-2.5" />קבצים
                        </p>
                        {files.map(f => (
                          <div key={f.id} className="flex items-center gap-2 rounded-lg bg-[#F8F7FF] border border-[#E5E5E8] px-2.5 py-1.5 group">
                            <FileText className="h-3 w-3 text-[#333654] flex-shrink-0" />
                            <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 text-[11px] font-medium text-[#333654] truncate hover:text-[#333654]">
                              {f.file_name}
                            </a>
                            {f.file_size && <span className="text-[10px] text-[#9091A8]">{formatSize(f.file_size)}</span>}
                            <button onClick={() => deleteFile(plan.id, f.id, f.file_url)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-[#C4C4C4] hover:text-red-500">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button onClick={() => triggerFileUpload(plan.id)} disabled={isUploading}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-[#E5E5E8] py-1.5 text-xs font-semibold text-[#9091A8] hover:border-[#333654] hover:text-[#333654] transition-colors disabled:opacity-50">
                      {isUploading
                        ? <><Loader2 className="h-3 w-3 animate-spin" />מעלה...</>
                        : <><Upload className="h-3 w-3" />צרף קובץ</>
                      }
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Day Modal */}
      {planFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setPlanFormOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
              <h2 className="font-black text-[#333654]">הוספת יום תכנון</h2>
              <button onClick={() => setPlanFormOpen(false)} className="text-[#9091A8] hover:text-[#6B6D8A]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addPlan} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">תאריך *</label>
                <input type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
                  min={campOpenAt ?? undefined} max={campCloseAt ?? undefined} required
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">נושא היום</label>
                <input value={planTopic} onChange={(e) => setPlanTopic(e.target.value)} placeholder="לדוגמה: יום ים..."
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPlanFormOpen(false)}
                  className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">ביטול</button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הוסף'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {actFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActFormOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
              <h2 className="font-black text-[#333654]">הוספת פעילות</h2>
              <button onClick={() => setActFormOpen(false)} className="text-[#9091A8] hover:text-[#6B6D8A]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={addActivity} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">שם הפעילות *</label>
                <input value={actTitle} onChange={(e) => setActTitle(e.target.value)} required
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">שעת התחלה</label>
                  <input type="time" value={actStart} onChange={(e) => setActStart(e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">שעת סיום</label>
                  <input type="time" value={actEnd} onChange={(e) => setActEnd(e.target.value)}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">אחראי</label>
                <input value={actResponsible} onChange={(e) => setActResponsible(e.target.value)} placeholder="שם המדריך"
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">תיאור</label>
                <textarea rows={2} value={actDesc} onChange={(e) => setActDesc(e.target.value)}
                  className="rounded-lg border border-[#E5E5E8] px-3 py-2 text-sm focus:border-[#00B1AE] focus:outline-none resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">קישור לחומרים</label>
                <input dir="ltr" value={actMaterials} onChange={(e) => setActMaterials(e.target.value)} placeholder="https://..."
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setActFormOpen(false)}
                  className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">ביטול</button>
                <button type="submit" disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הוסף'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
