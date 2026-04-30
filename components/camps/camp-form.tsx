'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrackManager } from './track-manager'
import { Loader2, Phone, CreditCard, Info } from 'lucide-react'
import { toast } from 'sonner'
import { SCHOOL_YEARS, getCurrentSchoolYear } from '@/lib/constants'
import type { Camp, Track } from '@/lib/types'

type TrackInput = Omit<Track, 'id' | 'camp_id' | 'created_at'>

interface CampFormProps {
  initialData?: Partial<Camp>
  campId?: string
}

export function CampForm({ initialData, campId }: CampFormProps) {
  const router = useRouter()
  const isEdit = !!campId

  const [name, setName] = useState(initialData?.name ?? '')
  const [schoolYear, setSchoolYear] = useState(initialData?.school_year ?? getCurrentSchoolYear())
  const [address, setAddress] = useState(initialData?.address ?? '')
  const [phone, setPhone] = useState(initialData?.phone ?? '')
  const [registrationOpenAt, setRegistrationOpenAt] = useState(initialData?.registration_open_at ?? '')
  const [registrationCloseAt, setRegistrationCloseAt] = useState(initialData?.registration_close_at ?? '')
  const [campOpenAt, setCampOpenAt] = useState(initialData?.camp_open_at ?? '')
  const [campCloseAt, setCampCloseAt] = useState(initialData?.camp_close_at ?? '')
  const [registrationGoal, setRegistrationGoal] = useState(String(initialData?.registration_goal ?? ''))
  const [cardcomTerminal, setCardcomTerminal] = useState(initialData?.cardcom_terminal ?? '')
  const [cardcomApiName, setCardcomApiName] = useState(initialData?.cardcom_api_name ?? '')
  const [cardcomApiPassword, setCardcomApiPassword] = useState(initialData?.cardcom_api_password ?? '')
  const [tracks, setTracks] = useState<TrackInput[]>([])
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('יש להזין שם קייטנה'); return }

    setLoading(true)
    try {
      const body = {
        name: name.trim(),
        school_year: schoolYear,
        address: address.trim() || null,
        phone: phone.trim() || null,
        registration_open_at: registrationOpenAt || null,
        registration_close_at: registrationCloseAt || null,
        camp_open_at: campOpenAt || null,
        camp_close_at: campCloseAt || null,
        registration_goal: Number(registrationGoal) || 0,
        cardcom_terminal: cardcomTerminal.trim() || null,
        cardcom_api_name: cardcomApiName.trim() || null,
        cardcom_api_password: cardcomApiPassword.trim() || null,
        tracks,
      }

      const res = await fetch(isEdit ? `/api/camps/${campId}` : '/api/camps', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(await res.text())

      toast.success(isEdit ? 'הקייטנה עודכנה בהצלחה' : 'הקייטנה נוצרה בהצלחה')
      router.push('/camps')
      router.refresh()
    } catch (err) {
      toast.error('שגיאה: ' + (err instanceof Error ? err.message : 'בעיה לא ידועה'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>פרטי הקייטנה</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">שם הקייטנה *</Label>
            <Input
              id="name"
              placeholder="קייטנת נשמה - ירושלים"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="year">שנת לימודים</Label>
            <select
              id="year"
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {SCHOOL_YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="goal">יעד נרשמים</Label>
            <Input
              id="goal"
              type="number"
              placeholder="100"
              value={registrationGoal}
              onChange={(e) => setRegistrationGoal(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              placeholder="רחוב הרצל 1, ירושלים"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="phone" className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />טלפון הקייטנה
            </Label>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              placeholder="050-0000000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>תאריכים</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-open">פתיחת רישום</Label>
            <Input id="reg-open" type="date" value={registrationOpenAt} onChange={(e) => setRegistrationOpenAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reg-close">סגירת רישום</Label>
            <Input id="reg-close" type="date" value={registrationCloseAt} onChange={(e) => setRegistrationCloseAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="camp-open">פתיחת קייטנה</Label>
            <Input id="camp-open" type="date" value={campOpenAt} onChange={(e) => setCampOpenAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="camp-close">סגירת קייטנה</Label>
            <Input id="camp-close" type="date" value={campCloseAt} onChange={(e) => setCampCloseAt(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {/* סליקה */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            סליקת אשראי (Cardcom)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-lg bg-[#E0F7F7] border border-[#00B1AE]/20 px-3 py-2.5 text-xs text-[#00B1AE]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>אם לא ימולא — יופעל הטרמינל הכללי. מלאי כדי לנתב תשלומים ישירות לחשבון הקייטנה.</span>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="cardcom-terminal">מספר טרמינל</Label>
              <Input
                id="cardcom-terminal"
                dir="ltr"
                placeholder="1000"
                value={cardcomTerminal}
                onChange={(e) => setCardcomTerminal(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="cardcom-api-name">שם משתמש API</Label>
              <Input
                id="cardcom-api-name"
                dir="ltr"
                placeholder="user@example.com"
                value={cardcomApiName}
                onChange={(e) => setCardcomApiName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-2">
              <Label htmlFor="cardcom-api-password">סיסמת API</Label>
              <Input
                id="cardcom-api-password"
                type="password"
                dir="ltr"
                placeholder="••••••••"
                value={cardcomApiPassword}
                onChange={(e) => setCardcomApiPassword(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>מסלולים</CardTitle>
        </CardHeader>
        <CardContent>
          <TrackManager tracks={tracks} onChange={setTracks} />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1 sm:flex-none sm:min-w-32">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> שומר...</> : isEdit ? 'עדכן קייטנה' : 'צור קייטנה'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>ביטול</Button>
      </div>
    </form>
  )
}
