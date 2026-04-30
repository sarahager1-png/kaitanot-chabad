import { FileText, ExternalLink, FileDown } from 'lucide-react'

export const metadata = { title: 'טפסים להורדה' }

const forms = [
  {
    id: 'rental',
    title: 'הסכם השכרת מבנה להפעלת קייטנה',
    desc: 'חוזה שכירות בין בעל הנכס לשליח — ממלאים בדפדפן ומדפיסים',
    url: 'https://kaitanot-rental.surge.sh',
    icon: '🏫',
    color: '#333654',
    bg: '#EEEEF5',
  },
]

export default function FormsPage() {
  return (
    <div className="flex flex-col gap-5" dir="rtl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg, #333654, #444668)' }}>
          <FileDown className="h-5 w-5 text-[#F8AD1D]" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#333654]">טפסים להורדה ומילוי</h1>
          <p className="text-sm text-[#9091A8]">מסמכים רשמיים — ממלאים בדפדפן ומדפיסים</p>
        </div>
      </div>

      {/* Forms */}
      {forms.map((form) => (
        <div key={form.id} className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden">
          {/* Form header */}
          <div className="flex items-center justify-between bg-[#333654] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg text-lg" style={{ background: 'rgba(248,173,29,0.15)' }}>
                {form.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-white">{form.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{form.desc}</p>
              </div>
            </div>
            <a
              href={form.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              פתח בלשונית חדשה
            </a>
          </div>

          {/* Embedded form */}
          <iframe
            src={form.url}
            title={form.title}
            className="w-full block"
            style={{ height: '82vh', border: 'none' }}
          />
        </div>
      ))}
    </div>
  )
}
