'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import SignaturePad from 'signature_pad'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CalendarDays, CheckCircle2, RotateCcw } from 'lucide-react'

interface Props {
  token: string
  tripTitle: string
  tripDescription: string | null
  tripDate: string | null
  childName: string
  defaultSignerName: string
}

export function ApprovalForm({ token, tripTitle, tripDescription, tripDate, childName, defaultSignerName }: Props) {
  const [signerName, setSignerName] = useState(defaultSignerName)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [isEmpty, setIsEmpty] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const padRef = useRef<SignaturePad | null>(null)

  const initPad = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const pad = new SignaturePad(canvas, {
      penColor: '#333654',
      backgroundColor: 'rgba(0,0,0,0)',
      minWidth: 1,
      maxWidth: 3,
    })
    pad.addEventListener('endStroke', () => setIsEmpty(pad.isEmpty()))
    padRef.current = pad
  }, [])

  // Resize canvas to match display size (prevents blurry signature)
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !padRef.current) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * ratio
    canvas.height = canvas.offsetHeight * ratio
    canvas.getContext('2d')?.scale(ratio, ratio)
    padRef.current.clear()
    setIsEmpty(true)
  }, [])

  useEffect(() => {
    initPad()
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [initPad, resizeCanvas])

  function clearSignature() {
    padRef.current?.clear()
    setIsEmpty(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!signerName.trim()) { setError('יש להזין שם'); return }
    if (!padRef.current || padRef.current.isEmpty()) { setError('יש לחתום בתיבת החתימה'); return }

    setLoading(true)
    setError('')
    try {
      const signatureData = padRef.current.toDataURL('image/png')
      const res = await fetch(`/api/trip-approval/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signer_name: signerName.trim(), signature_data: signatureData }),
      })
      if (!res.ok) throw new Error(await res.text())
      setDone(true)
    } catch {
      setError('שגיאה בשמירת האישור. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-black text-[#333654]">האישור התקבל!</h1>
          <p className="text-[#6B6D8A]">
            אישרת את השתתפות <strong>{childName}</strong> בטיול &ldquo;{tripTitle}&rdquo;.
          </p>
          <p className="text-sm text-[#9091A8]">תודה! תוכל/י לסגור חלון זה.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start justify-center min-h-screen p-4 pt-10">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#EEE8FF] mb-3">
            <span className="text-2xl">✈️</span>
          </div>
          <h1 className="text-2xl font-black text-[#333654]">אישור השתתפות בטיול</h1>
        </div>

        {/* Trip card */}
        <div className="rounded-2xl border border-[#E5E5E8] bg-white p-5 shadow-sm mb-5 flex flex-col gap-2">
          <h2 className="text-lg font-bold text-[#333654]">{tripTitle}</h2>
          {tripDate && (
            <span className="text-sm text-[#9091A8] flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {new Date(tripDate).toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          )}
          {tripDescription && (
            <p className="text-sm text-[#6B6D8A] mt-1">{tripDescription}</p>
          )}
          <div className="mt-2 rounded-xl bg-[#FEF0EC] px-4 py-3">
            <p className="text-sm font-semibold text-[#333654]">
              אישור השתתפות של: <span className="text-[#333654]">{childName}</span>
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <Label>שם ההורה / האפוטרופוס החותם</Label>
            <Input
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="שם מלא"
              required
            />
          </div>

          {/* Signature pad */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label>חתימה</Label>
              {!isEmpty && (
                <button type="button" onClick={clearSignature}
                  className="flex items-center gap-1 text-xs text-[#9091A8] hover:text-red-500 transition-colors">
                  <RotateCcw className="h-3 w-3" />נקה
                </button>
              )}
            </div>
            <div className="relative rounded-xl border-2 border-dashed border-[#E5E5E8] bg-white overflow-hidden"
              style={{ touchAction: 'none' }}>
              <canvas
                ref={canvasRef}
                className="w-full block"
                style={{ height: 140 }}
              />
              {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-sm text-[#C0B8DC]">חתום/י כאן עם האצבע</p>
                </div>
              )}
            </div>
            <p className="text-xs text-[#9091A8]">חתום/י בתיבה למעלה באמצעות האצבע</p>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={loading || isEmpty}
            className="w-full h-12 text-base font-bold bg-[#333654] hover:bg-[#2a2c48] disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="h-5 w-5 animate-spin ml-2" />שומר...</>
              : 'אני מאשר/ת את השתתפות הילד/ה בטיול'}
          </Button>

          <p className="text-xs text-center text-[#9091A8] pb-6">
            החתימה שלך מהווה אישור דיגיטלי לכל דבר.
          </p>
        </form>
      </div>
    </div>
  )
}
