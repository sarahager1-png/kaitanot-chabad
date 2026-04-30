import { CampForm } from '@/components/camps/camp-form'

export default function NewCampPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black">קייטנה חדשה</h1>
        <p className="mt-1 text-sm text-muted-foreground">הגדר פרטי קייטנה חדשה</p>
      </div>
      <CampForm />
    </div>
  )
}
