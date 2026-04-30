'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, Send, Trash2, MapPin, CalendarDays, CheckCircle2, Clock, Paperclip, FileText, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Trip, TripApproval } from '@/lib/types'

const TRIP_DOC_TYPES = [
  'תיאום טיולים',
  'מינוי רכז טיולים',
  'ביטוח נסיעות',
  'רשימת ציוד',
  'אחר',
]

interface TripFile {
  id: string
  trip_id: string
  camp_id: string
  file_name: string
  file_url: string
  file_size: number | null
  doc_label: string | null
}

interface Props {
  initialTrips: Trip[]
  initialApprovals: TripApproval[]
  initialTripFiles: TripFile[]
  campId: string
  camps: { id: string; name: string }[]
  userRole: string
}

export function TripsClient({ initialTrips, initialApprovals, initialTripFiles, campId, camps, userRole }: Props) {
  const [trips, setTrips] = useState<Trip[]>(initialTrips)
  const [approvals, setApprovals] = useState<TripApproval[]>(initialApprovals)
  const [tripFiles, setTripFiles] = useState<TripFile[]>(initialTripFiles)
  const [selectedCampId, setSelectedCampId] = useState(campId)
  const [showCreate, setShowCreate] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState<string | null>(null)

  const [form, setForm] = useState({ title: '', description: '', trip_date: '' })
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingLabelRef = useRef<string | null>(null)
  const [uploadingForTrip, setUploadingForTrip] = useState<string | null>(null)

  // Doc label dialog
  const [showLabelDialog, setShowLabelDialog] = useState(false)
  const [pendingTripId, setPendingTripId] = useState<string | null>(null)
  const [docLabel, setDocLabel] = useState('תיאום טיולים')
  const [docLabelCustom, setDocLabelCustom] = useState('')

  function approvalStats(tripId: string) {
    const ta = approvals.filter(a => a.trip_id === tripId)
    return { total: ta.length, signed: ta.filter(a => a.signed).length }
  }

  function filesForTrip(tripId: string) {
    return tripFiles.filter(f => f.trip_id === tripId)
  }

  function formatSize(bytes: number | null) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  async function loadTrips(cId: string) {
    const [tr, ap, tf] = await Promise.all([
      fetch(`/api/trips?camp_id=${cId}`).then(r => r.json()),
      fetch(`/api/trip-approvals?camp_id=${cId}`).then(r => r.json()).catch(() => []),
      fetch(`/api/trips/files?camp_id=${cId}`).then(r => r.json()).catch(() => []),
    ])
    setTrips(Array.isArray(tr) ? tr : [])
    setApprovals(Array.isArray(ap) ? ap : [])
    setTripFiles(Array.isArray(tf) ? tf : [])
  }

  async function handleCampChange(cId: string) {
    setSelectedCampId(cId)
    await loadTrips(cId)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title) { toast.error('שם הטיול חובה'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ camp_id: selectedCampId, ...form, trip_date: form.trip_date || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      const newTrip = await res.json()
      setTrips(prev => [...prev, newTrip])
      setShowCreate(false)
      setForm({ title: '', description: '', trip_date: '' })
      toast.success('טיול נוצר בהצלחה')
    } catch (err) {
      console.error('Create trip error:', err)
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(tripId: string) {
    setDeleting(tripId)
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setTrips(prev => prev.filter(t => t.id !== tripId))
      setApprovals(prev => prev.filter(a => a.trip_id !== tripId))
      setTripFiles(prev => prev.filter(f => f.trip_id !== tripId))
      toast.success('טיול נמחק')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setDeleting(null)
    }
  }

  async function handleSend(tripId: string) {
    setSending(tripId)
    try {
      const res = await fetch(`/api/trips/${tripId}/send`, { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      toast.success(`נשלחו ${result.sent} הודעות${result.failed ? `, ${result.failed} נכשלו` : ''}${result.already_signed ? `, ${result.already_signed} כבר חתמו` : ''}`)
      await loadTrips(selectedCampId)
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setSending(null)
    }
  }

  function triggerUpload(tripId: string) {
    setPendingTripId(tripId)
    setDocLabel('תיאום טיולים')
    setDocLabelCustom('')
    setShowLabelDialog(true)
  }

  function confirmLabel() {
    const label = docLabel === 'אחר' ? docLabelCustom.trim() : docLabel
    if (!label) return
    setShowLabelDialog(false)
    setUploadingForTrip(pendingTripId)
    // store chosen label for the file input callback
    pendingLabelRef.current = label
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadingForTrip) return
    e.target.value = ''

    const label = pendingLabelRef.current ?? ''
    setUploading(uploadingForTrip)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('camp_id', selectedCampId)
      if (label) fd.append('doc_label', label)
      const res = await fetch(`/api/trips/${uploadingForTrip}/files`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(await res.text())
      const newFile: TripFile = await res.json()
      setTripFiles(prev => [...prev, newFile])
      toast.success('קובץ הועלה')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setUploading(null)
      setUploadingForTrip(null)
      pendingLabelRef.current = null
    }
  }

  async function handleDeleteFile(tripId: string, fileId: string, fileUrl: string) {
    try {
      const res = await fetch(`/api/trips/${tripId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, fileUrl }),
      })
      if (!res.ok) throw new Error(await res.text())
      setTripFiles(prev => prev.filter(f => f.id !== fileId))
      toast.success('קובץ נמחק')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    }
  }

  const isManager = ['מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'].includes(userRole)

  return (
    <div className="flex flex-col gap-4">
      <input ref={fileInputRef} type="file" className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.zip,.txt"
        onChange={handleFileChange} />

      {/* Camp selector for managers */}
      {isManager && camps.length > 1 && (
        <div className="flex items-center gap-3">
          <Label>קייטנה:</Label>
          <select
            value={selectedCampId}
            onChange={e => handleCampChange(e.target.value)}
            className="h-9 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
          >
            {camps.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      )}

      {/* Header actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{trips.length} טיולים</p>
        <Button onClick={() => setShowCreate(true)} size="sm" className="bg-[#333654] hover:bg-[#2a2c48]">
          <Plus className="h-4 w-4 ml-1" />
          טיול חדש
        </Button>
      </div>

      {/* Trips list */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[#9091A8]">
          <MapPin className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">אין טיולים עדיין</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trips.map(trip => {
            const stats = approvalStats(trip.id)
            const pct = stats.total > 0 ? Math.round((stats.signed / stats.total) * 100) : 0
            const files = filesForTrip(trip.id)
            const isUploading = uploading === trip.id
            return (
              <div key={trip.id} className="rounded-2xl border border-[#E5E5E8] bg-white p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-0.5">
                    <h3 className="font-bold text-[#333654]">{trip.title}</h3>
                    {trip.trip_date && (
                      <span className="text-xs text-[#9091A8] flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(trip.trip_date).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    disabled={deleting === trip.id}
                    className="text-[#9091A8] hover:text-red-500 transition-colors p-1"
                  >
                    {deleting === trip.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                {trip.description && (
                  <p className="text-sm text-[#6B6D8A] leading-relaxed">{trip.description}</p>
                )}

                {/* Approval progress */}
                {stats.total > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-[#6B6D8A]">
                      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" />{stats.signed} אישרו</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" />{stats.total - stats.signed} ממתינים</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#EEE8FF] overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Trip files */}
                {files.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-[#F5F5F3] pt-2">
                    <p className="text-xs font-bold text-[#9091A8] flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />טפסים ומסמכים
                    </p>
                    {files.map(f => (
                      <div key={f.id} className="flex items-center gap-2 rounded-lg bg-[#F8F7FF] border border-[#E5E5E8] px-2.5 py-1.5 group">
                        <FileText className="h-3 w-3 text-[#333654] flex-shrink-0" />
                        <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                          className="flex-1 min-w-0 hover:text-[#333654]">
                          <p className="text-xs font-semibold text-[#333654] truncate">{f.doc_label ?? f.file_name}</p>
                          {f.doc_label && <p className="text-[10px] text-[#9091A8] truncate">{f.file_name}</p>}
                        </a>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {f.file_size && <span className="text-[10px] text-[#9091A8]">{formatSize(f.file_size)}</span>}
                          <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-[#9091A8] hover:text-[#333654]">
                            <Download className="h-3 w-3" />
                          </a>
                          <button onClick={() => handleDeleteFile(trip.id, f.id, f.file_url)}
                            className="text-[#9091A8] hover:text-red-500">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload form button */}
                <button
                  onClick={() => triggerUpload(trip.id)}
                  disabled={isUploading}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#E5E5E8] py-2 text-xs font-semibold text-[#9091A8] hover:border-[#333654] hover:text-[#333654] transition-colors disabled:opacity-50"
                >
                  {isUploading
                    ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />מעלה...</>
                    : <><Upload className="h-3.5 w-3.5" />העלה טופס / מסמך</>}
                </button>

                <Button
                  size="sm"
                  onClick={() => handleSend(trip.id)}
                  disabled={sending === trip.id}
                  className="w-full bg-[#25D366] hover:bg-[#1fb054] text-white"
                >
                  {sending === trip.id
                    ? <><Loader2 className="h-4 w-4 animate-spin ml-1" />שולח...</>
                    : <><Send className="h-4 w-4 ml-1" />שלח אישורים בוואטסאפ</>}
                </Button>
              </div>
            )
          })}
        </div>
      )}

      {/* Doc label dialog */}
      <Dialog open={showLabelDialog} onOpenChange={o => !o && setShowLabelDialog(false)}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle>סוג המסמך</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {TRIP_DOC_TYPES.map(t => (
                <button key={t} type="button" onClick={() => setDocLabel(t)}
                  className={['px-3 py-1.5 rounded-full text-sm font-semibold border transition-all',
                    docLabel === t
                      ? 'border-[#333654] bg-[#EEE8FF] text-[#333654]'
                      : 'border-[#E5E5E8] text-[#6B6D8A] hover:border-[#333654]'
                  ].join(' ')}>
                  {t}
                </button>
              ))}
            </div>
            {docLabel === 'אחר' && (
              <Input
                value={docLabelCustom}
                onChange={e => setDocLabelCustom(e.target.value)}
                placeholder="שם המסמך..."
                autoFocus
              />
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowLabelDialog(false)}>ביטול</Button>
            <Button
              type="button"
              onClick={confirmLabel}
              disabled={docLabel === 'אחר' && !docLabelCustom.trim()}
              className="bg-[#333654] hover:bg-[#2a2c48]"
            >
              בחר קובץ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={o => !o && setShowCreate(false)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>יצירת טיול חדש</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>שם הטיול *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="למשל: טיול לצפון" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תאריך</Label>
              <Input type="date" value={form.trip_date} onChange={e => setForm(f => ({ ...f, trip_date: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תיאור</Label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="פרטים נוספים..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
              <Button type="submit" disabled={saving} className="bg-[#333654] hover:bg-[#2a2c48]">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" />יוצר...</> : 'צור טיול'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
