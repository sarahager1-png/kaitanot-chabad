'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Loader2, Plus, Download, Trash2, Star, Phone, Globe, X, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import type { SharedContent, ActivityVendor, VendorReview } from '@/lib/types'

const CONTENT_CATEGORIES = ['פעילות', 'דף עבודה', 'שיר', 'משחק', 'אחר']

interface ReviewWithProfile extends VendorReview {
  profiles?: { full_name: string | null }
}

interface Props {
  initialContent: SharedContent[]
  initialVendors: ActivityVendor[]
  initialReviews: ReviewWithProfile[]
  campId: string
  userId: string
  userRole: string
}

export function SharedClient({ initialContent, initialVendors, initialReviews, campId, userId, userRole }: Props) {
  const [tab, setTab] = useState<'content' | 'vendors'>('content')
  const [content, setContent] = useState<SharedContent[]>(initialContent)
  const [vendors, setVendors] = useState<ActivityVendor[]>(initialVendors)
  const [reviews, setReviews] = useState<ReviewWithProfile[]>(initialReviews)

  // Content state
  const [showAddContent, setShowAddContent] = useState(false)
  const [contentForm, setContentForm] = useState({ title: '', description: '', category: 'אחר' })
  const [contentFile, setContentFile] = useState<File | null>(null)
  const [savingContent, setSavingContent] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [filterCategory, setFilterCategory] = useState('הכל')

  // Vendor state
  const [showAddVendor, setShowAddVendor] = useState(false)
  const [vendorForm, setVendorForm] = useState({ name: '', activity: '', phone: '', website: '', notes: '' })
  const [savingVendor, setSavingVendor] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<ActivityVendor | null>(null)
  const [reviewForm, setReviewForm] = useState({ stars: 0, comment: '' })
  const [savingReview, setSavingReview] = useState(false)

  const isManager = ['מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'].includes(userRole)

  // ---- Content handlers ----
  async function handleAddContent(e: React.FormEvent) {
    e.preventDefault()
    if (!contentForm.title) { toast.error('כותרת חובה'); return }
    setSavingContent(true)
    try {
      const res = await fetch('/api/shared-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...contentForm, camp_id: campId || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      const newItem: SharedContent = await res.json()

      if (contentFile) {
        const form = new FormData()
        form.append('file', contentFile)
        form.append('contentId', newItem.id)
        const uploadRes = await fetch('/api/shared-content/upload', { method: 'POST', body: form })
        if (uploadRes.ok) {
          const { url } = await uploadRes.json()
          newItem.file_url = url
        } else {
          toast.warning('תוכן נשמר אך העלאת הקובץ נכשלה')
        }
      }

      setContent(prev => [newItem, ...prev])
      setShowAddContent(false)
      setContentForm({ title: '', description: '', category: 'אחר' })
      setContentFile(null)
      toast.success('תוכן נוסף')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setSavingContent(false)
    }
  }

  async function handleDeleteContent(id: string) {
    const res = await fetch(`/api/shared-content?id=${id}`, { method: 'DELETE' })
    if (res.ok) setContent(prev => prev.filter(c => c.id !== id))
    else toast.error('שגיאה במחיקה')
  }

  // ---- Vendor handlers ----
  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault()
    if (!vendorForm.name || !vendorForm.activity) { toast.error('שם ופעילות חובה'); return }
    setSavingVendor(true)
    try {
      const res = await fetch('/api/activity-vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm),
      })
      if (!res.ok) throw new Error(await res.text())
      const newV = await res.json()
      setVendors(prev => [...prev, { ...newV, avg_stars: null, review_count: 0 }])
      setShowAddVendor(false)
      setVendorForm({ name: '', activity: '', phone: '', website: '', notes: '' })
      toast.success('ספק נוסף')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setSavingVendor(false)
    }
  }

  async function handleDeleteVendor(id: string) {
    if (!confirm('למחוק ספק זה לצמיתות?')) return
    try {
      const res = await fetch(`/api/activity-vendors/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      setVendors(prev => prev.filter(v => v.id !== id))
      setSelectedVendor(null)
      toast.success('ספק נמחק')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    }
  }

  async function handleAddReview(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVendor || reviewForm.stars === 0) { toast.error('בחר דירוג'); return }
    setSavingReview(true)
    try {
      const res = await fetch(`/api/activity-vendors/${selectedVendor.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars: reviewForm.stars, comment: reviewForm.comment, camp_id: campId || null }),
      })
      if (!res.ok) throw new Error(await res.text())
      const newReview: ReviewWithProfile = await res.json()
      setReviews(prev => [newReview, ...prev.filter(r => !(r.vendor_id === selectedVendor.id && r.reviewer_id === userId))])

      // Recompute avg for vendor
      const vendorReviews = [newReview, ...reviews.filter(r => r.vendor_id === selectedVendor.id && r.reviewer_id !== userId)]
      const avg = vendorReviews.reduce((s, r) => s + r.stars, 0) / vendorReviews.length
      setVendors(prev => prev.map(v => v.id === selectedVendor.id
        ? { ...v, avg_stars: Math.round(avg * 10) / 10, review_count: vendorReviews.length }
        : v))

      setReviewForm({ stars: 0, comment: '' })
      toast.success('חוות דעת נשמרה')
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה'))
    } finally {
      setSavingReview(false)
    }
  }

  function vendorReviews(vendorId: string) {
    return reviews.filter(r => r.vendor_id === vendorId)
  }

  const filteredContent = filterCategory === 'הכל' ? content : content.filter(c => c.category === filterCategory)

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#FEF0EC] p-1 rounded-xl w-fit">
        {(['content', 'vendors'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={['px-4 py-2 rounded-lg text-sm font-semibold transition-all', tab === t ? 'bg-white text-[#333654] shadow' : 'text-[#9091A8] hover:text-[#333654]'].join(' ')}>
            {t === 'content' ? 'תכנים' : 'ספקי פעילויות'}
          </button>
        ))}
      </div>

      {/* CONTENT TAB */}
      {tab === 'content' && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2 flex-wrap">
              {['הכל', ...CONTENT_CATEGORIES].map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={['px-3 py-1.5 rounded-full text-xs font-semibold border transition-all',
                    filterCategory === cat ? 'border-[#333654] bg-[#EEE8FF] text-[#333654]' : 'border-[#E5E5E8] text-[#9091A8] hover:border-[#333654]'
                  ].join(' ')}>
                  {cat}
                </button>
              ))}
            </div>
            <Button size="sm" onClick={() => setShowAddContent(true)} className="bg-[#333654] hover:bg-[#2a2c48]">
              <Plus className="h-4 w-4 ml-1" />העלה תוכן
            </Button>
          </div>

          {filteredContent.length === 0 ? (
            <div className="text-center py-16 text-[#9091A8] text-sm">אין תכנים עדיין</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredContent.map(item => (
                <div key={item.id} className="rounded-2xl border border-[#E5E5E8] bg-white p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#333654] text-sm">{item.title}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#EEE8FF] text-[#333654] mt-1 inline-block">{item.category}</span>
                    </div>
                    {item.uploaded_by === userId && (
                      <button onClick={() => handleDeleteContent(item.id)} className="text-[#9091A8] hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {item.description && <p className="text-xs text-[#6B6D8A]">{item.description}</p>}
                  {item.file_url && (
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-[#00B1AE] hover:underline mt-auto">
                      <Download className="h-3.5 w-3.5" />הורד קובץ
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VENDORS TAB */}
      {tab === 'vendors' && (
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            {isManager && (
              <Button size="sm" onClick={() => setShowAddVendor(true)} className="bg-[#333654] hover:bg-[#2a2c48]">
                <Plus className="h-4 w-4 ml-1" />הוסף ספק
              </Button>
            )}
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-16 text-[#9091A8] text-sm">אין ספקים עדיין</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {vendors.map(v => (
                <button key={v.id} onClick={() => setSelectedVendor(v)}
                  className="rounded-2xl border border-[#E5E5E8] bg-white p-4 shadow-sm text-right hover:border-[#333654] hover:shadow-md transition-all flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#333654]">{v.name}</h3>
                      <p className="text-sm text-[#6B6D8A]">{v.activity}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {v.avg_stars ? (
                        <span className="flex items-center gap-0.5 text-sm font-bold text-amber-500">
                          <Star className="h-4 w-4 fill-amber-400 stroke-amber-500" />{v.avg_stars}
                        </span>
                      ) : <span className="text-xs text-[#9091A8]">ללא דירוג</span>}
                      {(v.review_count ?? 0) > 0 && (
                        <span className="text-xs text-[#9091A8]">{v.review_count} ביקורות</span>
                      )}
                    </div>
                  </div>
                  {v.phone && (
                    <span className="flex items-center gap-1.5 text-xs text-[#9091A8]">
                      <Phone className="h-3.5 w-3.5" />{v.phone}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Content Dialog */}
      <Dialog open={showAddContent} onOpenChange={o => !o && setShowAddContent(false)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>העלאת תוכן משותף</DialogTitle></DialogHeader>
          <form onSubmit={handleAddContent} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>כותרת *</Label>
              <Input value={contentForm.title} onChange={e => setContentForm(f => ({ ...f, title: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>קטגוריה</Label>
              <select value={contentForm.category} onChange={e => setContentForm(f => ({ ...f, category: e.target.value }))}
                className="h-10 rounded-lg border border-[#E5E5E8] bg-white px-3 text-sm focus:border-[#00B1AE] focus:outline-none">
                {CONTENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>תיאור</Label>
              <Input value={contentForm.description} onChange={e => setContentForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>קובץ</Label>
              {contentFile ? (
                <div className="flex items-center gap-2 h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm">
                  <Paperclip className="h-4 w-4 text-[#333654]" />
                  <span className="flex-1 truncate">{contentFile.name}</span>
                  <button type="button" onClick={() => setContentFile(null)}><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-2 h-10 rounded-lg border border-dashed border-[#E5E5E8] px-3 text-sm text-[#9091A8] hover:border-[#333654] hover:text-[#333654] transition-colors">
                  <Paperclip className="h-4 w-4" />צרף קובץ
                </button>
              )}
              <input ref={fileRef} type="file" className="hidden"
                onChange={e => { setContentFile(e.target.files?.[0] ?? null); e.target.value = '' }} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddContent(false)}>ביטול</Button>
              <Button type="submit" disabled={savingContent} className="bg-[#333654] hover:bg-[#2a2c48]">
                {savingContent ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : 'הוסף'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={showAddVendor} onOpenChange={o => !o && setShowAddVendor(false)}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader><DialogTitle>הוספת ספק פעילות</DialogTitle></DialogHeader>
          <form onSubmit={handleAddVendor} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>שם הספק *</Label>
              <Input value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>פעילות *</Label>
              <Input value={vendorForm.activity} onChange={e => setVendorForm(f => ({ ...f, activity: e.target.value }))} placeholder="תיאור הפעילות" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>טלפון</Label>
                <Input value={vendorForm.phone} onChange={e => setVendorForm(f => ({ ...f, phone: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>אתר</Label>
                <Input value={vendorForm.website} onChange={e => setVendorForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>הערות</Label>
              <Input value={vendorForm.notes} onChange={e => setVendorForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddVendor(false)}>ביטול</Button>
              <Button type="submit" disabled={savingVendor} className="bg-[#333654] hover:bg-[#2a2c48]">
                {savingVendor ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : 'הוסף'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Vendor detail panel */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedVendor(null)}>
          <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E8]">
              <h2 className="text-lg font-black text-[#333654]">{selectedVendor.name}</h2>
              <div className="flex items-center gap-2">
                {isManager && (
                  <button onClick={() => handleDeleteVendor(selectedVendor.id)} className="text-[#9091A8] hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => setSelectedVendor(null)} className="text-[#9091A8] hover:text-[#333654]">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <p className="text-[#6B6D8A]">{selectedVendor.activity}</p>
              {selectedVendor.phone && (
                <a href={`tel:${selectedVendor.phone}`} className="flex items-center gap-2 text-sm text-[#00B1AE] hover:underline">
                  <Phone className="h-4 w-4" />{selectedVendor.phone}
                </a>
              )}
              {selectedVendor.website && (
                <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-[#00B1AE] hover:underline">
                  <Globe className="h-4 w-4" />אתר האינטרנט
                </a>
              )}
              {selectedVendor.notes && <p className="text-sm text-[#9091A8] bg-[#FEF0EC] rounded-xl p-3">{selectedVendor.notes}</p>}

              {/* Reviews */}
              <div className="border-t border-[#E5E5E8] pt-4">
                <h3 className="font-bold text-[#333654] mb-3">ביקורות ({vendorReviews(selectedVendor.id).length})</h3>
                {vendorReviews(selectedVendor.id).length === 0
                  ? <p className="text-sm text-[#9091A8]">אין ביקורות עדיין</p>
                  : <div className="flex flex-col gap-3">
                    {vendorReviews(selectedVendor.id).map(r => (
                      <div key={r.id} className="rounded-xl border border-[#E5E5E8] p-3 flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-[#333654]">{r.profiles?.full_name ?? 'משתמש'}</span>
                          <span className="flex items-center gap-0.5 text-amber-500 text-sm font-bold">
                            {'★'.repeat(r.stars)}{'☆'.repeat(5 - r.stars)}
                          </span>
                        </div>
                        {r.comment && <p className="text-sm text-[#6B6D8A]">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                }
              </div>

              {/* Add review form */}
              <div className="border-t border-[#E5E5E8] pt-4">
                <h3 className="font-bold text-[#333654] mb-3">הוסף חוות דעת</h3>
                <form onSubmit={handleAddReview} className="flex flex-col gap-3">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <button key={s} type="button" onClick={() => setReviewForm(f => ({ ...f, stars: s }))}
                        className={['text-2xl transition-transform hover:scale-110', reviewForm.stars >= s ? 'text-amber-400' : 'text-[#E5E5E8]'].join(' ')}>
                        ★
                      </button>
                    ))}
                  </div>
                  <Input value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} placeholder="הערות (אופציונלי)" />
                  <Button type="submit" disabled={savingReview || reviewForm.stars === 0} className="bg-[#333654] hover:bg-[#2a2c48]">
                    {savingReview ? <><Loader2 className="h-4 w-4 animate-spin" />שומר...</> : 'שמור חוות דעת'}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
