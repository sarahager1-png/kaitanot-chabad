'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Mail, User, Phone, Lock, Eye, EyeOff } from 'lucide-react'

interface SettingsFormProps {
  currentEmail: string
  currentName: string
  currentPhone: string
  role: string
}

export function SettingsForm({ currentEmail, currentName, currentPhone, role }: SettingsFormProps) {
  const [name, setName] = useState(currentName)
  const [phone, setPhone] = useState(currentPhone)
  const [email, setEmail] = useState(currentEmail)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: name.trim(), phone: phone.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('הפרטים עודכנו')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setProfileLoading(false)
    }
  }

  async function changeEmail(e: React.FormEvent) {
    e.preventDefault()
    if (email === currentEmail) { toast.error('המייל זהה לנוכחי'); return }
    setEmailLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('נשלח אימות למייל החדש — אשרי את הקישור לסיום השינוי')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setEmailLoading(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { toast.error('הסיסמה חייבת להכיל לפחות 6 תווים'); return }
    setPasswordLoading(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('הסיסמה עודכנה')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profile details */}
      <form onSubmit={saveProfile} className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F3]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-[#9091A8]" />
            <h2 className="font-bold text-[#333654]">פרטים אישיים</h2>
          </div>
          {role && (
            <span className="inline-block mt-1 text-xs font-semibold text-[#6B6D8A] bg-[#F5F5F3] px-2 py-0.5 rounded-lg">{role}</span>
          )}
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">שם מלא</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">טלפון</label>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              dir="ltr"
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            />
          </div>
          <button type="submit" disabled={profileLoading}
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-[#333654] text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors">
            {profileLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שמור פרטים'}
          </button>
        </div>
      </form>

      {/* Email */}
      <form onSubmit={changeEmail} className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F3] flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#9091A8]" />
          <h2 className="font-bold text-[#333654]">שינוי כתובת מייל</h2>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">מייל חדש</label>
            <input
              type="email" required dir="ltr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
            />
          </div>
          <p className="text-xs text-[#9091A8]">ישלח קישור אימות לכתובת החדשה — השינוי ייכנס לתוקף רק לאחר אישור.</p>
          <button type="submit" disabled={emailLoading || email === currentEmail}
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-[#00B1AE] text-sm font-bold text-white hover:bg-[#009896] disabled:opacity-60 transition-colors">
            {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'עדכן מייל'}
          </button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={changePassword} className="rounded-2xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F5F5F3] flex items-center gap-2">
          <Lock className="h-4 w-4 text-[#9091A8]" />
          <h2 className="font-bold text-[#333654]">שינוי סיסמה</h2>
        </div>
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">סיסמה נוכחית</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                dir="ltr"
                className="w-full h-10 rounded-lg border border-[#E5E5E8] px-3 pl-10 text-sm focus:border-[#00B1AE] focus:outline-none"
              />
              <button type="button" onClick={() => setShowCurrent(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9091A8] hover:text-[#6B6D8A]">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-[#333654]">סיסמה חדשה</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required minLength={6}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                dir="ltr"
                className="w-full h-10 rounded-lg border border-[#E5E5E8] px-3 pl-10 text-sm focus:border-[#00B1AE] focus:outline-none"
              />
              <button type="button" onClick={() => setShowNew(v => !v)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9091A8] hover:text-[#6B6D8A]">
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={passwordLoading}
            className="flex items-center justify-center gap-2 h-10 rounded-lg bg-[#333654] text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60 transition-colors">
            {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'עדכן סיסמה'}
          </button>
        </div>
      </form>
    </div>
  )
}
