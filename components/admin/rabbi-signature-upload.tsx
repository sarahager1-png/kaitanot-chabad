'use client'

import { useEffect, useRef, useState } from 'react'
import { Upload, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function RabbiSignatureUpload() {
  const [current, setCurrent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/settings?key=rabbi_signature_data')
      .then(r => r.json())
      .then(d => setCurrent(d.value ?? null))
      .catch(() => {})
  }, [])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const dataUrl = reader.result as string
      setSaving(true)
      try {
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'rabbi_signature_data', value: dataUrl }),
        })
        setCurrent(dataUrl)
        toast.success('החתימה נשמרה בהצלחה')
      } catch {
        toast.error('שגיאה בשמירה')
      } finally {
        setSaving(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleRemove() {
    setSaving(true)
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'rabbi_signature_data', value: null }),
      })
      setCurrent(null)
      toast.success('החתימה הוסרה')
    } catch {
      toast.error('שגיאה')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      <div className="bg-[#F5F5F3] px-5 py-4 border-b border-[#E5E5E8] flex items-center gap-3">
        <Upload className="h-4 w-4 text-[#9091A8]" />
        <span className="text-sm font-bold text-[#333654]">חתימת מנהל האגף</span>
        <span className="mr-auto text-xs text-[#9091A8]">הרב אליהו קריצ&#39;בסקי</span>
      </div>

      <div className="p-5 flex items-center gap-5">
        {/* Preview */}
        <div
          className="rounded-xl border-2 border-dashed border-[#E5E5E8] bg-[#F9F9F7] flex items-center justify-center shrink-0 overflow-hidden"
          style={{ width: 200, height: 90 }}
        >
          {current ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={current} alt="חתימת הרב" className="w-full h-full object-contain p-2" />
          ) : (
            <span className="text-xs text-[#9091A8]">טרם הועלתה חתימה</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={saving}
            className="flex items-center gap-2 h-9 rounded-xl bg-[#333654] px-4 text-sm font-bold text-white hover:bg-[#444668] transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {current ? 'החלף חתימה' : 'העלה חתימה'}
          </button>
          {current && (
            <button
              onClick={handleRemove}
              disabled={saving}
              className="flex items-center gap-2 h-9 rounded-xl border border-[#E5E5E8] px-4 text-sm font-semibold text-[#C8251D] hover:border-[#C8251D]/30 hover:bg-[#FDE8E7] transition-colors disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              הסר
            </button>
          )}
          {current && (
            <p className="text-xs text-[#1A7A4A] flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> מופיע בכל ההסכמים
            </p>
          )}
          <p className="text-xs text-[#9091A8]">JPG, PNG עד 2MB</p>
        </div>
      </div>
    </div>
  )
}
