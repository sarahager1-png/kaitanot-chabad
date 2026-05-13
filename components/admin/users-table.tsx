'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Users, ChevronDown, X, Plus, Shield, User, Crown, Mail, Loader2, Star } from 'lucide-react'
import type { UserRole } from '@/lib/types'

interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
  camp_users: { camp_id: string; camps: { id: string; name: string } | null }[]
}

interface Camp {
  id: string
  name: string
  school_year: string
}

interface UsersTableProps {
  profiles: Profile[]
  camps: Camp[]
}

const ROLES: UserRole[] = ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת']

const roleIcon = {
  'שליח': User,
  'מנהל קייטנה': Star,
  'מנהל רשת': Shield,
  'אדמין מערכת': Crown,
}
const roleColor = {
  'שליח': 'bg-[#F5F5F3] text-[#6B6D8A]',
  'מנהל קייטנה': 'bg-[#FEF9EC] text-[#A07830]',
  'מנהל רשת': 'bg-[#E0F7F7] text-[#00B1AE]',
  'אדמין מערכת': 'bg-[#FEF0EC] text-[#333654]',
}

export function UsersTable({ profiles: initialProfiles, camps }: UsersTableProps) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteForm, setInviteForm] = useState({ email: '', full_name: '', role: 'שליח' as UserRole })
  const [inviteLoading, setInviteLoading] = useState(false)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inviteForm),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`הזמנה נשלחה ל-${inviteForm.email}`)
      setInviteOpen(false)
      setInviteForm({ email: '', full_name: '', role: 'שליח' })
    } catch (err) {
      toast.error('שגיאה: ' + String(err))
    } finally {
      setInviteLoading(false)
    }
  }

  async function changeRole(userId: string, role: UserRole) {
    setLoadingId(userId)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })
    if (res.ok) {
      setProfiles(p => p.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('התפקיד עודכן')
    } else {
      toast.error('שגיאה בעדכון תפקיד')
    }
    setLoadingId(null)
  }

  async function assignCamp(userId: string, campId: string) {
    const profile = profiles.find(p => p.id === userId)
    if (profile?.camp_users.some(cu => cu.camp_id === campId)) return
    setLoadingId(userId + campId)
    const res = await fetch('/api/admin/camp-users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camp_id: campId, user_id: userId }),
    })
    if (res.ok) {
      const camp = camps.find(c => c.id === campId)
      setProfiles(p => p.map(u => u.id === userId
        ? { ...u, camp_users: [...u.camp_users, { camp_id: campId, camps: camp ? { id: camp.id, name: camp.name } : null }] }
        : u
      ))
      toast.success('שויך לקייטנה')
    } else {
      toast.error('שגיאה בשיוך')
    }
    setLoadingId(null)
  }

  async function removeCamp(userId: string, campId: string) {
    setLoadingId(userId + campId)
    const res = await fetch('/api/admin/camp-users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camp_id: campId, user_id: userId }),
    })
    if (res.ok) {
      setProfiles(p => p.map(u => u.id === userId
        ? { ...u, camp_users: u.camp_users.filter(cu => cu.camp_id !== campId) }
        : u
      ))
      toast.success('השיוך הוסר')
    } else {
      toast.error('שגיאה בהסרה')
    }
    setLoadingId(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Invite button */}
      <div className="flex justify-end">
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-2 text-sm font-bold text-white hover:bg-[#444668] transition-colors"
        >
          <Plus className="h-4 w-4" />הזמן משתמש
        </button>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setInviteOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#FEF0EC]">
              <h2 className="font-black text-[#333654]">הזמנת משתמש חדש</h2>
              <button onClick={() => setInviteOpen(false)} className="text-[#9091A8] hover:text-[#6B6D8A]"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleInvite} className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">כתובת מייל *</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9091A8]" />
                  <input
                    type="email" required dir="ltr"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-[#E5E5E8] pr-9 pl-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">שם מלא</label>
                <input
                  value={inviteForm.full_name}
                  onChange={(e) => setInviteForm(f => ({ ...f, full_name: e.target.value }))}
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[#333654]">תפקיד</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="h-10 rounded-lg border border-[#E5E5E8] px-3 text-sm focus:border-[#00B1AE] focus:outline-none"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setInviteOpen(false)}
                  className="flex-1 rounded-lg border border-[#E5E5E8] py-2.5 text-sm font-semibold text-[#6B6D8A] hover:bg-[#F5F5F3]">
                  ביטול
                </button>
                <button type="submit" disabled={inviteLoading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-[#333654] py-2.5 text-sm font-bold text-white hover:bg-[#444668] disabled:opacity-60">
                  {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שלח הזמנה'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {profiles.map((profile) => {
        const Icon = roleIcon[profile.role] ?? User
        const campUsers = profile.camp_users ?? []
        const assignedCampIds = new Set(campUsers.map((cu: { camp_id: string }) => cu.camp_id))
        const unassignedCamps = camps.filter(c => !assignedCampIds.has(c.id))

        return (
          <div key={profile.id} className="rounded-2xl bg-white border border-[#E5E5E8] p-4 shadow-sm">
            <div className="flex flex-wrap items-start gap-3">
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F3] flex-shrink-0">
                <Users className="h-5 w-5 text-[#6B6D8A]" />
              </div>

              {/* Name + phone */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#333654]">{profile.full_name || '(ללא שם)'}</div>
                {profile.phone && <div className="text-xs text-[#9091A8] mt-0.5" dir="ltr">{profile.phone}</div>}
              </div>

              {/* Role selector */}
              <div className="relative">
                <select
                  value={profile.role}
                  disabled={loadingId === profile.id}
                  onChange={(e) => changeRole(profile.id, e.target.value as UserRole)}
                  className={[
                    'appearance-none pl-7 pr-3 py-1.5 rounded-xl text-xs font-bold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#00B1AE]/30',
                    roleColor[profile.role],
                  ].join(' ')}
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Icon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" />
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none opacity-50" />
              </div>
            </div>

            {/* Camp assignments */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#9091A8] font-medium">קייטנות:</span>

              {campUsers.map((cu: { camp_id: string; camps: { id: string; name: string } | null }) => (
                <span
                  key={cu.camp_id}
                  className="flex items-center gap-1 rounded-lg bg-[#E0F7F7] px-2.5 py-1 text-xs font-semibold text-[#00B1AE]"
                >
                  {cu.camps?.name ?? 'קייטנה לא ידועה'}
                  <button
                    onClick={() => removeCamp(profile.id, cu.camp_id)}
                    disabled={!!loadingId}
                    className="hover:text-red-500 transition-colors ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              {unassignedCamps.length > 0 && (
                <select
                  value=""
                  onChange={(e) => { if (e.target.value) assignCamp(profile.id, e.target.value) }}
                  disabled={!!loadingId}
                  className="rounded-lg border border-dashed border-[#E5E5E8] bg-white px-2 py-1 text-xs text-[#6B6D8A] focus:outline-none focus:border-[#00B1AE] cursor-pointer"
                >
                  <option value="">+ שייך קייטנה</option>
                  {unassignedCamps.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.school_year})</option>
                  ))}
                </select>
              )}

              {campUsers.length === 0 && unassignedCamps.length === 0 && (
                <span className="text-xs text-[#9091A8] italic">אין קייטנות במערכת</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
