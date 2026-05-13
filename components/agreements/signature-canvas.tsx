'use client'

import { useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react'
import { RotateCcw } from 'lucide-react'

export interface SignatureCanvasRef {
  toDataURL: () => string | null
  isEmpty: () => boolean
}

export const SignatureCanvas = forwardRef<SignatureCanvasRef, { label?: string }>(
  function SignatureCanvas({ label }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const drawing = useRef(false)
    const lastPos = useRef<{ x: number; y: number } | null>(null)
    const [empty, setEmpty] = useState(true)

    useImperativeHandle(ref, () => ({
      toDataURL: () => canvasRef.current?.toDataURL('image/png') ?? null,
      isEmpty: () => empty,
    }), [empty])

    // ResizeObserver sets physical canvas pixels to match CSS layout size
    useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1

      function resize() {
        const rect = canvas!.getBoundingClientRect()
        if (rect.width === 0 || rect.height === 0) return
        canvas!.width = Math.round(rect.width * dpr)
        canvas!.height = Math.round(rect.height * dpr)
        const ctx = canvas!.getContext('2d')
        if (ctx) ctx.scale(dpr, dpr)
      }

      resize()
      const ro = new ResizeObserver(resize)
      ro.observe(canvas)
      return () => ro.disconnect()
    }, [])

    function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      e.currentTarget.setPointerCapture(e.pointerId)
      const pos = getPos(e)
      if (!pos) return
      drawing.current = true
      lastPos.current = pos
      setEmpty(false)
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.fillStyle = '#1a1a2e'
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!drawing.current || !lastPos.current) return
      const pos = getPos(e)
      if (!pos) return
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx) {
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(lastPos.current.x, lastPos.current.y)
        ctx.lineTo(pos.x, pos.y)
        ctx.stroke()
      }
      lastPos.current = pos
    }

    function onPointerUp() {
      drawing.current = false
      lastPos.current = null
    }

    function clear() {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setEmpty(true)
    }

    return (
      <div className="flex flex-col gap-1.5">
        {label && <p className="text-xs text-[#6B6D8A] text-center">{label}</p>}
        <div
          className="relative rounded-xl border-2 border-dashed border-[#C9A84C] bg-[#FDFCF8] overflow-hidden print:border-solid print:border-[#333654]"
          style={{ height: 100 }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full cursor-crosshair touch-none select-none"
            style={{ display: 'block' }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
          />
          {empty && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xs text-[#C9A84C]/60 select-none">חתמו כאן</span>
            </div>
          )}
          {!empty && (
            <button
              type="button"
              onClick={clear}
              className="print:hidden absolute top-1.5 left-1.5 flex items-center gap-1 rounded-lg bg-white/80 border border-[#E5E5E8] px-2 py-1 text-[10px] text-[#9091A8] hover:text-[#C8251D] hover:border-[#C8251D]/30 transition-colors shadow-sm"
            >
              <RotateCcw className="h-2.5 w-2.5" />
              נקה
            </button>
          )}
        </div>
      </div>
    )
  }
)
