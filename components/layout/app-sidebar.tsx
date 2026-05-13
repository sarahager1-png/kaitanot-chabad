'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard,
  Tent,
  Users,
  ShoppingCart,
  FileCheck,
  UserCheck,
  CalendarDays,
  CalendarCheck2,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  HelpCircle,
  MapPin,
  Library,
  FileDown,
  Settings,
  ClipboardSignature,
  FileText,
  Ticket,
  BarChart2,
  CreditCard,
  Banknote,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type UserRole } from '@/lib/types'
import { ShekelIcon } from '@/components/icons/shekel-icon'

const navItems = [
  { href: '/dashboard', label: 'לוח בקרה', icon: LayoutDashboard, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/camps', label: 'קייטנות', icon: Tent, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/registrants', label: 'רשומים', icon: Users, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/finance', label: 'כספים', icon: ShekelIcon, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/services', label: 'שירותים ואספקה', icon: ShoppingCart, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/documents', label: 'מסמכים', icon: FileCheck, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/agreements', label: 'הסכמים', icon: FileText, roles: ['מנהל רשת', 'אדמין מערכת'] },
  { href: '/contract', label: 'חוזה מנהלת', icon: ClipboardSignature, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/forms', label: 'טפסים', icon: FileDown, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/vouchers', label: 'שוברים', icon: Ticket, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/simulations', label: 'סימולציית תקציב', icon: BarChart2, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/salaries', label: 'משכורות', icon: Banknote, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/requests', label: 'בקשות תשלום', icon: CreditCard, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/staff', label: 'צוות', icon: UserCheck, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/planning', label: 'תכנון', icon: CalendarDays, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/trips', label: 'טיולים', icon: MapPin, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/attendance', label: 'נוכחות', icon: CalendarCheck2, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/shared', label: 'ספרייה משותפת', icon: Library, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/alerts', label: 'התראות', icon: Bell, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/admin', label: 'ניהול מערכת', icon: Shield, roles: ['אדמין מערכת', 'מנהל רשת'] },
  { href: '/help', label: 'עזרה', icon: HelpCircle, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
  { href: '/settings', label: 'הגדרות חשבון', icon: Settings, roles: ['שליח', 'מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת'] },
] as const

interface AppSidebarProps {
  userRole?: UserRole
  alertCount?: number
}

export function AppSidebar({ userRole = 'שליח', alertCount = 0 }: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)

  const filteredNav = navItems.filter((item) =>
    (item.roles as readonly string[]).includes(userRole)
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('התנתקת בהצלחה')
    router.push('/login')
    router.refresh()
  }

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#333654] to-[#252740]">
      {/* Logo */}
      <div className="flex flex-col items-center px-5 py-5 gap-2" style={{background: 'linear-gradient(135deg, #2a2c48 0%, #333654 100%)', borderBottom: '1px solid rgba(248,173,29,0.25)'}}>
        <Image src="/logo-kaitanot.jpg" alt='קייטנות חב"ד' width={160} height={80} className="object-contain" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold transition-all duration-150 group relative',
                isActive
                  ? 'text-[#333654] shadow-md'
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
              ].join(' ')}
              style={isActive ? {background: 'linear-gradient(90deg, #F8AD1D, #FDE68A)', boxShadow: '0 2px 12px rgba(201,168,76,0.4)'} : {}}
            >
              <div className="relative flex-shrink-0">
                <Icon className={['h-4 w-4 transition-all', isActive ? 'text-[#333654]' : 'text-white/60 group-hover:text-white'].join(' ')} />
                {item.href === '/alerts' && alertCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {alertCount > 9 ? '9+' : alertCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3" style={{borderTop: '1px solid rgba(201,168,76,0.2)'}}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-full text-sm font-semibold text-white/50 hover:bg-red-500/20 hover:text-red-300 transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          <span>התנתקות</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 right-4 z-50 flex md:hidden h-9 w-9 items-center justify-center rounded-xl bg-[#333654] text-white shadow-lg"
        aria-label="פתח תפריט"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={[
          'fixed top-0 right-0 z-50 h-full w-64 bg-[#333654] shadow-2xl transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:text-white hover:bg-white/10"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-full w-60 flex-shrink-0 flex-col bg-[#333654] overflow-y-auto" style={{boxShadow: '4px 0 24px rgba(201,168,76,0.25), 2px 0 8px rgba(201,168,76,0.15)'}}>
        <SidebarContent />
      </aside>
    </>
  )
}
