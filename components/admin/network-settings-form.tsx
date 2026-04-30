'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { CreditCard, Loader2, Eye, EyeOff } from 'lucide-react'

export function NetworkSettingsForm() {
  const [terminal, setTerminal] = useState('')
  const [apiName, setApiName] = useState('')
  const [apiPassword, setApiPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    fetch('/api/admin/network-settings')
      .then(r => r.json())
      .then(d => {
        setTerminal(d.cardcom_terminal ?? '')
        setApiName(d.cardcom_api_name ?? '')
        setApiPassword(d.cardcom_api_password ?? '')
      })
      .finally(() => setFetching(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/admin/network-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardcom_terminal: terminal.trim(),
          cardcom_api_name: apiName.trim(),
          cardcom_api_password: apiPassword,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('פרטי הסליקה נשמרו')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-[#F5F5F3]"
        style={{ background: 'linear-gradient(135deg,#252740 0%,#333654 100%)' }}>
        <CreditCard className="h-4 w-4 text-white/70" />
        <h2 className="font-bold text-white">סליקת אשראי — ברירת מחדל</h2>
      </div>

      <div className="p-5">
        <p className="text-xs text-[#9091A8] mb-4 leading-relaxed">
          פרטים אלה ישמשו לכל קייטנה שאין לה טרמינל משלה. ניתן לדרוס ברמת הקייטנה בדף עריכת קייטנה.
        </p>

        {fetching ? (
          <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-[#9091A8]" /></div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">מספר טרמינל</label>
                <input
                  value={terminal}
                  onChange={e => setTerminal(e.target.value)}
                  dir="ltr" placeholder="12345"
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">שם משתמש API</label>
                <input
                  value={apiName}
                  onChange={e => setApiName(e.target.value)}
                  dir="ltr" placeholder="user@example.com"
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-[#333654]">סיסמת API</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={apiPassword}
                  onChange={e => setApiPassword(e.target.value)}
                  dir="ltr"
                  className="w-full h-10 rounded-lg border border-[#E5E5E8] px-3 pl-10 text-sm focus:border-[#00B1AE] focus:outline-none"
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9091A8] hover:text-[#6B6D8A]">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 h-10 rounded-lg bg-[#333654] text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור פרטי סליקה'}
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
