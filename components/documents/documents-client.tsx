'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Upload, CheckCircle, AlertCircle, FileText, Shield, FileCheck, FileSignature, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Document } from '@/lib/types'

interface DocumentsClientProps {
  documents: Document[]
  campId: string
}

const docTypeOrder = ['ביטוח', 'בטיחות', 'חוזה', 'אישור']

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string; bar: string }> = {
  'ביטוח':  { icon: Shield,         color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]', bar: 'bg-[#00B1AE]' },
  'בטיחות': { icon: AlertCircle,    color: 'text-[#C8251D]', bg: 'bg-[#FDE8E7]', bar: 'bg-[#C8251D]' },
  'חוזה':   { icon: FileSignature,  color: 'text-[#333654]', bg: 'bg-[#FEF0EC]', bar: 'bg-[#333654]' },
  'אישור':  { icon: FileCheck,      color: 'text-[#1A7A4A]', bg: 'bg-[#E5F4EC]', bar: 'bg-[#1A7A4A]' },
}

export function DocumentsClient({ documents, campId }: DocumentsClientProps) {
  const router = useRouter()
  const [uploading, setUploading] = useState<string | null>(null)

  const completed = documents.filter((d) => d.is_completed).length
  const total = documents.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  async function triggerAlerts() {
    fetch('/api/alerts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camp_id: campId }),
    }).catch(() => {})
  }

  async function toggleComplete(doc: Document) {
    const res = await fetch(`/api/documents?id=${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !doc.is_completed }),
    })
    if (!res.ok) { toast.error('שגיאה בעדכון'); return }
    triggerAlerts()
    router.refresh()
  }

  async function handleUpload(doc: Document, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(doc.id)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('docId', doc.id)
    formData.append('campId', campId)
    const res = await fetch('/api/documents/upload', { method: 'POST', body: formData })
    if (!res.ok) { toast.error('שגיאה בהעלאה') } else { toast.success('הקובץ הועלה'); triggerAlerts(); router.refresh() }
    setUploading(null)
  }

  const grouped: Record<string, Document[]> = {}
  documents.forEach((d) => {
    if (!grouped[d.doc_type]) grouped[d.doc_type] = []
    grouped[d.doc_type].push(d)
  })
  const types = docTypeOrder.filter((t) => grouped[t])

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      {/* Progress bar */}
      <div className="rounded-xl border border-[#E5E5E8] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-[#1A7A4A]" />
            <span className="text-sm font-semibold text-[#333654]">{completed} מתוך {total} מסמכים הושלמו</span>
          </div>
          <span className="text-lg font-black text-[#333654]">{pct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#F5F5F3] overflow-hidden">
          <div
            className="h-full rounded-full bg-[#1A7A4A] transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Document groups */}
      {types.map((type) => {
        const cfg = typeConfig[type] ?? typeConfig['אישור']
        const TypeIcon = cfg.icon
        const groupCompleted = grouped[type].filter((d) => d.is_completed).length
        return (
          <div key={type} className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
            {/* Group header */}
            <div className="relative flex items-center gap-3 px-4 py-3 border-b border-[#FEF0EC]">
              <div className={`absolute top-0 right-0 left-0 h-1 ${cfg.bar} rounded-t-xl`} />
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg} mt-1`}>
                <TypeIcon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div className="flex-1">
                <span className="font-bold text-[#333654]">{type}</span>
              </div>
              <span className="text-xs font-semibold text-[#9091A8]">{groupCompleted}/{grouped[type].length}</span>
            </div>

            {/* Documents */}
            <div className="divide-y divide-[#FEF0EC]">
              {grouped[type].map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#F5F5F3]/40 transition-colors">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleComplete(doc)}
                    className={[
                      'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all',
                      doc.is_completed
                        ? 'border-[#1A7A4A] bg-[#1A7A4A]'
                        : 'border-[#E5E5E8] hover:border-[#00B1AE]',
                    ].join(' ')}
                  >
                    {doc.is_completed && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                  </button>

                  {/* Label */}
                  <div className="flex flex-1 items-center gap-2 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-[#9091A8] shrink-0" />
                    <span className={`text-sm truncate ${doc.is_completed ? 'line-through text-[#9091A8]' : 'font-medium text-[#333654]'}`}>
                      {doc.label}
                    </span>
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.is_completed ? (
                      <span className="flex items-center gap-1 rounded-full bg-[#E5F4EC] px-2 py-0.5 text-xs font-semibold text-[#1A7A4A]">
                        <CheckCircle className="h-3 w-3" />הושלם
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-[#FEF3E2] px-2 py-0.5 text-xs font-semibold text-[#B45309]">
                        <AlertCircle className="h-3 w-3" />ממתין
                      </span>
                    )}

                    {doc.file_url && (
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#E0F7F7] hover:text-[#00B1AE] transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </a>
                    )}

                    <label className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-[#9091A8] hover:bg-[#F5F5F3] hover:text-[#333654] transition-colors relative overflow-hidden">
                      {uploading === doc.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Upload className="h-3.5 w-3.5" />
                      }
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleUpload(doc, e)}
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        disabled={uploading === doc.id}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
