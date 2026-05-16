import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { isManager } from '@/lib/roles'
import Link from 'next/link'
import { MapPin, Edit, ArrowRight, Calendar, Users, UserCheck, CalendarDays, Share2, CreditCard, Palette, ExternalLink } from 'lucide-react'
import { ShekelIcon } from '@/components/icons/shekel-icon'
import { GoalEditor } from '@/components/camps/goal-editor'
import { format, parseISO } from 'date-fns'
import { DuplicateCampButton } from '@/components/camps/duplicate-camp-button'
import { ShareRegisterButton } from '@/components/camps/share-register-button'
import { DeleteCampButton } from '@/components/camps/delete-camp-button'

function formatDate(d: string | null) {
  if (!d) return '—'
  try { return format(parseISO(d), 'dd/MM/yyyy') } catch { return d }
}

export default async function CampDetailPage({ params }: { params: Promise<{ campId: string }> }) {
  const { campId } = await params
  const supabase = await createClient()

  const { data: camp } = await supabase.from('camps').select('*').eq('id', campId).single()
  if (!camp) notFound()

  const [{ data: tracks }, { count: registrantCount }, { count: staffCount }] = await Promise.all([
    supabase.from('tracks').select('*').eq('camp_id', campId),
    supabase.from('registrants').select('*', { count: 'exact', head: true }).eq('camp_id', campId),
    supabase.from('staff').select('*', { count: 'exact', head: true }).eq('camp_id', campId),
  ])

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user?.id ?? '').single()
  const canEdit = isManager(profile?.role ?? '')

  const quickLinks = [
    { href: `/registrants?camp=${campId}`, icon: Users, label: 'רשומים', value: registrantCount ?? 0, color: 'text-[#333654]', bg: 'bg-[#F5F5F3]' },
    { href: `/register?camp=${campId}`, icon: Share2, label: 'טופס רישום', value: null, color: 'text-[#25D366]', bg: 'bg-[#E7FFDB]' },
    { href: `/finance?camp=${campId}`, icon: ShekelIcon, label: 'כספים', value: null, color: 'text-[#00B1AE]', bg: 'bg-[#E0F7F7]' },
    { href: `/staff?camp=${campId}`, icon: UserCheck, label: 'צוות', value: staffCount ?? 0, color: 'text-[#333654]', bg: 'bg-[#FEF0EC]' },
    { href: `/planning?camp=${campId}`, icon: CalendarDays, label: 'תכנון', value: null, color: 'text-[#1A7A4A]', bg: 'bg-[#E5F4EC]' },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/camps" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6D8A] hover:bg-[#F5F5F3] transition-colors">
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-[#333654]">{camp.name}</h1>
          <p className="text-sm text-[#9091A8]">{camp.school_year}</p>
        </div>
        {canEdit && (
          <div className="flex flex-wrap gap-2 justify-end">
            <ShareRegisterButton campId={campId} campName={camp.name} />
            <Link href={`/camps/${campId}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-[#E5E5E8] bg-white px-3 py-1.5 text-sm font-semibold text-[#6B6D8A] hover:border-[#00B1AE] hover:text-[#00B1AE] transition-colors">
              <Edit className="h-3.5 w-3.5" />עריכה
            </Link>
            <DuplicateCampButton campId={campId} schoolYear={camp.school_year} />
            <DeleteCampButton campId={campId} campName={camp.name} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Stats card */}
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          <div className="absolute-top bg-gradient-to-l from-[#333654] to-[#444668] h-1 rounded-t-xl" />
          <div className="p-4 flex flex-col gap-3">
            {camp.address && (
              <div className="flex items-center gap-2 text-sm text-[#6B6D8A]">
                <MapPin className="h-4 w-4 text-[#9091A8]" />
                <span>{camp.address}</span>
              </div>
            )}
            <GoalEditor
              campId={campId}
              goal={camp.registration_goal ?? 0}
              registrantCount={registrantCount ?? 0}
              canEdit={canEdit}
            />
          </div>
        </div>

        {/* Dates */}
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-[#9091A8]" />
            <span className="text-sm font-bold text-[#333654]">תאריכים</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'פתיחת רישום', value: formatDate(camp.registration_open_at) },
              { label: 'סגירת רישום', value: formatDate(camp.registration_close_at) },
              { label: 'פתיחת קייטנה', value: formatDate(camp.camp_open_at) },
              { label: 'סגירת קייטנה', value: formatDate(camp.camp_close_at) },
            ].map((d) => (
              <div key={d.label} className="rounded-lg bg-[#F5F5F3] px-3 py-2">
                <p className="text-[10px] text-[#9091A8] font-medium mb-0.5">{d.label}</p>
                <p className="text-sm font-bold text-[#333654]">{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tracks */}
        {(tracks ?? []).length > 0 && (
          <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm p-4">
            <p className="text-sm font-bold text-[#333654] mb-3">מסלולים</p>
            <div className="flex flex-wrap gap-2">
              {tracks!.map((track) => (
                <span key={track.id} className="flex items-center gap-1.5 rounded-lg bg-[#F5F5F3] px-3 py-1.5 text-sm font-semibold text-[#333654]">
                  {track.name}
                  {track.price > 0 && <span className="text-[#9091A8] text-xs">₪{track.price}</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cardcom */}
        {canEdit && (
          <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-[#9091A8]" />
                <span className="text-sm font-bold text-[#333654]">פרטי סליקה</span>
              </div>
              <Link href={`/camps/${campId}/edit`}
                className="text-xs text-[#00B1AE] hover:underline font-semibold">
                עריכה
              </Link>
            </div>
            {camp.cardcom_terminal ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-[#F5F5F3] px-3 py-2">
                  <p className="text-[10px] text-[#9091A8] font-medium mb-0.5">מספר טרמינל</p>
                  <p className="text-sm font-bold text-[#333654]" dir="ltr">{camp.cardcom_terminal}</p>
                </div>
                <div className="rounded-lg bg-[#F5F5F3] px-3 py-2">
                  <p className="text-[10px] text-[#9091A8] font-medium mb-0.5">שם משתמש API</p>
                  <p className="text-sm font-bold text-[#333654]" dir="ltr">{camp.cardcom_api_name ?? '—'}</p>
                </div>
                <div className="col-span-2 rounded-lg bg-[#F5F5F3] px-3 py-2">
                  <p className="text-[10px] text-[#9091A8] font-medium mb-0.5">סיסמת API</p>
                  <p className="text-sm font-bold text-[#333654]" dir="ltr">
                    {camp.cardcom_api_password ? '••••••••' : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg bg-[#FEF9EC] border border-[#F8AD1D]/30 px-3 py-2.5">
                <p className="text-xs text-[#A07830]">פרטי סליקה לא הוגדרו — תשלום מקוון לא יהיה זמין</p>
                <Link href={`/camps/${campId}/edit`}
                  className="text-xs font-bold text-[#F8AD1D] hover:underline shrink-0 mr-2">
                  הגדר עכשיו
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-3 rounded-xl border border-[#E5E5E8] bg-white p-4 shadow-sm hover:border-[#00B1AE]/40 hover:shadow-md transition-all group">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.bg} flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${link.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#333654]">{link.label}</p>
                  {link.value !== null && (
                    <p className="text-xs text-[#9091A8]">{link.value} רשומים</p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Designs & Publications */}
        <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="h-4 w-4 text-[#9091A8]" />
            <span className="text-sm font-bold text-[#333654]">עיצובים ופרסומים</span>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'מודעות סט 1 — קייטנה רגילה', href: 'https://canva.link/7gli9x011qumgay' },
              { label: 'מודעות סט 2 — קייטנה רגילה', href: 'https://canva.link/1ue7zpeuxyfjxd5' },
              { label: 'מודעות קייטנה על גלגלים', href: 'https://canva.link/c5kfn48l9vyc8ci' },
            ].map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-between rounded-lg bg-[#F5F5F3] px-3 py-2.5 hover:bg-[#EEEEED] transition-colors group">
                <span className="text-sm font-semibold text-[#333654]">{item.label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#9091A8] group-hover:text-[#00B1AE] transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
