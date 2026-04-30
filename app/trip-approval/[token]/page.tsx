import { createServiceClient } from '@/lib/supabase/server'
import { ApprovalForm } from '@/components/trips/approval-form'

interface Props {
  params: Promise<{ token: string }>
}

export default async function TripApprovalPage({ params }: Props) {
  const { token } = await params
  const service = createServiceClient()

  const { data: approval, error } = await service
    .from('trip_approvals')
    .select('*, trips(*), registrants(first_name, last_name, parent1_name)')
    .eq('token', token)
    .single()

  if (error || !approval) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FEF0EC] to-white p-4">
        <div className="text-center">
          <p className="text-lg font-bold text-[#333654]">קישור לא תקין</p>
          <p className="text-sm text-[#9091A8] mt-2">הקישור פג תוקף או אינו קיים</p>
        </div>
      </div>
    )
  }

  const trip = approval.trips as { title: string; description: string | null; trip_date: string | null }
  const registrant = approval.registrants as { first_name: string; last_name: string; parent1_name: string | null }

  if (approval.signed) {
    return (
      <div dir="rtl" className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#FEF0EC] to-white p-4">
        <div className="text-center flex flex-col items-center gap-4 max-w-sm">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-3xl">✓</div>
          <h1 className="text-xl font-black text-[#333654]">כבר אישרת!</h1>
          <p className="text-sm text-[#6B6D8A]">
            האישור עבור <strong>{registrant.first_name} {registrant.last_name}</strong> לטיול &ldquo;{trip.title}&rdquo; כבר נחתם.
          </p>
          {approval.signed_at && (
            <p className="text-xs text-[#9091A8]">
              נחתם ב-{new Date(approval.signed_at).toLocaleString('he-IL')}
              {approval.signer_name ? ` על ידי ${approval.signer_name}` : ''}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-[#FEF0EC] to-white">
      <ApprovalForm
        token={token}
        tripTitle={trip.title}
        tripDescription={trip.description}
        tripDate={trip.trip_date}
        childName={`${registrant.first_name} ${registrant.last_name}`}
        defaultSignerName={registrant.parent1_name ?? ''}
      />
    </div>
  )
}
