'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Crown, Shield, Star, User, Plus, X, Mail, Loader2, Copy, Check, Link } from 'lucide-react'

interface Profile {
  id: string
  full_name: string | null
  role: string
  phone: string | null
}

interface RolesPanelProps {
  profiles: Profile[]
}

const ROLE_DEFS = [
  {
    role: 'שליח',
    icon: User,
    color: '#6B6D8A',
    bg: '#F5F5F3',
    border: '#E5E5E8',
    permissions: [
      'צפייה בקייטנות המשויכות בלבד',
      'ניהול חניכים, נוכחות, ומסמכים',
      'הגשת הערכות',
    ],
  },
  {
    role: 'מנהל קייטנה',
    icon: Star,
    color: '#A07830',
    bg: '#FEF9EC',
    border: '#F8AD1D40',
    permissions: [
      'ניהול מלא של הקייטנות המשויכות',
      'ניהול צוות וסגל',
      'גישה לנתוני כספים',
      'ניהול שירותים ומסמכים',
    ],
  },
  {
    role: 'מנהל רשת',
    icon: Shield,
    color: '#00B1AE',
    bg: '#E0F7F7',
    border: '#00B1AE40',
    permissions: [
      'צפייה בכל הקייטנות',
      'ניהול הגדרות רשת',
      'דוחות ואנליטיקות רשת',
      'ניהול משתמשים',
    ],
  },
  {
    role: 'אדמין מערכת',
    icon: Crown,
    color: '#333654',
    bg: '#FEF0EC',
    border: '#F68E7540',
    permissions: [
      'גישה מלאה לכל המערכת',
      'ניהול הגדרות מתקדמות',
      'ניהול תפקידים והרשאות',
      'גישה לכל הנתונים ללא הגבלה',
    ],
  },
]

export function RolesPanel({ profiles: initialProfiles }: RolesPanelProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [addingRole, setAddingRole] = useState<string | null>(null)
  const [form, setForm] = useState({ email: '', full_name: '' })
  const [loading, setLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addingRole) return
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, full_name: form.full_name, role: addingRole }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      const json = await res.json()
      setProfiles(p => [...p, {
        id: json.id,
        full_name: form.full_name || form.email,
        role: addingRole,
        phone: null,
      }])
      setInviteLink(json.invite_link)
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  function closeModal() {
    setAddingRole(null)
    setInviteLink(null)
    setForm({ email: '', full_name: '' })
    setCopied(false)
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROLE_DEFS.map(def => {
          const Icon = def.icon
          const members = profiles.filter(p => p.role === def.role || (def.role === 'אדמין מערכת' && p.role === 'מנהל מערכת'))
          return (
            <div
              key={def.role}
              className="rounded-xl border bg-white overflow-hidden"
              style={{ borderColor: def.border }}
            >
              {/* Role header */}
              <div
                className="flex items-center gap-2.5 px-4 py-3"
                style={{ background: def.bg, borderBottom: `1px solid ${def.border}` }}
              >
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg"
                  style={{ background: `${def.color}18` }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: def.color }} />
                </div>
                <span className="font-bold text-sm" style={{ color: def.color }}>{def.role}</span>
                <span
                  className="mr-auto text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${def.color}15`, color: def.color }}
                >
                  {members.length}
                </span>
              </div>

              <div className="p-3 flex flex-col gap-3">
                {/* Permissions */}
                <ul className="flex flex-col gap-1">
                  {def.permissions.map(p => (
                    <li key={p} className="flex items-start gap-1.5 text-xs text-[#6B6D8A]">
                      <span className="mt-0.5 text-[10px]" style={{ color: def.color }}>✓</span>
                      {p}
                    </li>
                  ))}
                </ul>

                {/* Members */}
                {members.length > 0 && (
                  <div className="flex flex-col gap-1 border-t border-[#F0F0F3] pt-2">
                    {members.map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-xs text-[#333654]">
                        <div
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold text-white flex-shrink-0"
                          style={{ background: def.color }}
                        >
                          {(m.full_name ?? '?')[0]}
                        </div>
                        {m.full_name || '(ללא שם)'}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add authorized button */}
                <button
                  type="button"
                  onClick={() => { setAddingRole(def.role); setForm({ email: '', full_name: '' }) }}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed py-1.5 text-xs font-semibold transition-colors hover:bg-opacity-50"
                  style={{ borderColor: def.border, color: def.color }}
                >
                  <Plus className="h-3 w-3" />
                  הוסף מורשה
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Add authorized modal */}
      {addingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E5E8]">
              <div>
                <h2 className="font-black text-[#333654] text-sm">הוספת מורשה</h2>
                <p className="text-xs text-[#9091A8] mt-0.5">תפקיד: {addingRole}</p>
              </div>
              <button type="button" title="סגור" onClick={closeModal} className="text-[#9091A8] hover:text-[#6B6D8A]">
                <X className="h-4 w-4" />
              </button>
            </div>

            {inviteLink ? (
              <div className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-2 rounded-xl bg-[#E0F7F7] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#00B1AE]">
                    <Link className="h-4 w-4 flex-shrink-0" />
                    המשתמש נוצר בהצלחה
                  </div>
                  <p className="text-xs text-[#6B6D8A]">
                    שלח את הקישור הבא למשתמש — הוא ישמש להגדרת הסיסמה:
                  </p>
                  <div className="rounded-lg bg-white border border-[#E5E5E8] p-2.5 text-xs text-[#333654] break-all font-mono" dir="ltr">
                    {inviteLink}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] transition-colors"
                >
                  {copied ? <><Check className="h-4 w-4" />הועתק!</> : <><Copy className="h-4 w-4" />העתק קישור</>}
                </button>
                <button type="button" onClick={closeModal}
                  className="rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">
                  סגור
                </button>
              </div>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-4 p-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">כתובת Gmail *</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9091A8]" />
                    <input
                      type="email" required dir="ltr"
                      title="כתובת Gmail"
                      placeholder="name@gmail.com"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full h-10 rounded-lg border border-[#E5E5E8] pr-9 pl-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-[#333654]">שם מלא</label>
                  <input
                    title="שם מלא"
                    placeholder="ישראל ישראלי"
                    value={form.full_name}
                    onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                    className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal}
                    className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">
                    ביטול
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הוסף מורשה'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
