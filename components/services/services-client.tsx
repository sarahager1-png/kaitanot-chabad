'use client'

import { useState } from 'react'
import { OrderForm } from './order-form'
import { ShoppingCart, CheckCircle, Clock, Package, Image as ImageIcon, Headphones, Layers, Droplets, Gift, Sparkles, Plus } from 'lucide-react'
import { ServiceAdminForm } from './service-admin-form'
import type { NetworkService, Order } from '@/lib/types'
import { SERVICE_CATEGORIES } from '@/lib/constants'
import { format, parseISO } from 'date-fns'

const statusStyle: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  'ממתין לאישור': { label: 'ממתין לאישור', style: 'bg-[#FEF3E2] text-[#B45309]', icon: Clock },
  'מאושר':        { label: 'מאושר',        style: 'bg-[#E5F4EC] text-[#1A7A4A]', icon: CheckCircle },
  'בוצע':         { label: 'בוצע',         style: 'bg-[#F5F5F3] text-[#6B6D8A]', icon: Package },
}

const categoryIcon: Record<string, React.ElementType> = {
  'אוזניות':      Headphones,
  'סובלימציה':    Layers,
  'קצף':          Droplets,
  'ערכות לילדים': Gift,
  'אביזרים':      Sparkles,
}

const categoryColor: Record<string, string> = {
  'אוזניות':      'from-[#333654] to-[#444668]',
  'סובלימציה':    'from-[#00B1AE] to-[#006A82]',
  'קצף':          'from-[#333654] to-[#4B3580]',
  'ערכות לילדים': 'from-[#1A7A4A] to-[#145C38]',
  'אביזרים':      'from-[#B45309] to-[#8A3F07]',
}

interface ServicesClientProps {
  services: NetworkService[]
  orders: (Order & { network_services: NetworkService })[]
  campId: string
  isAdmin?: boolean
}

export function ServicesClient({ services, orders, campId, isAdmin }: ServicesClientProps) {
  const [selectedService, setSelectedService] = useState<NetworkService | null>(null)
  const [orderFormOpen, setOrderFormOpen] = useState(false)
  const [adminFormOpen, setAdminFormOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('הכל')

  const categories = ['הכל', ...SERVICE_CATEGORIES]
  const filteredServices = services.filter((s) =>
    activeCategory === 'הכל' || s.category === activeCategory
  )

  function openOrder(service: NetworkService) {
    setSelectedService(service)
    setOrderFormOpen(true)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Catalog */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-[#333654]">קטלוג שירותים</h2>
          {isAdmin && (
            <button
              onClick={() => setAdminFormOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-[#333654] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#444668] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              הוסף שירות
            </button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
                activeCategory === cat
                  ? 'bg-[#333654] text-white shadow-sm'
                  : 'bg-white border border-[#E5E5E8] text-[#6B6D8A] hover:border-[#00B1AE] hover:text-[#00B1AE]',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        {filteredServices.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 rounded-xl border border-[#E5E5E8] bg-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F5F3]">
              <ShoppingCart className="h-7 w-7 text-[#9091A8]" />
            </div>
            <p className="text-sm text-[#6B6D8A]">אין שירותים זמינים</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredServices.map((service) => {
              const CatIcon = categoryIcon[service.category] ?? ImageIcon
              const gradient = categoryColor[service.category] ?? 'from-[#333654] to-[#444668]'
              return (
                <div key={service.id} className="group flex flex-col rounded-xl border border-[#E5E5E8] bg-white shadow-sm hover:shadow-md hover:border-[#00B1AE]/40 transition-all overflow-hidden">
                  {/* Image placeholder */}
                  <div className={`relative h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <CatIcon className="h-14 w-14 text-white/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                          <CatIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <span className="absolute top-3 left-3 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-bold text-white">
                      {service.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col gap-3 p-4">
                    <div>
                      <h3 className="font-bold text-[#333654] leading-snug">{service.name}</h3>
                      {service.description && (
                        <p className="mt-1 text-xs text-[#6B6D8A] leading-relaxed line-clamp-2">{service.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#FEF0EC]">
                      <span className="text-sm font-black text-[#333654]">
                        {service.price_per_unit
                          ? `₪${service.price_per_unit} ל${service.unit_label}`
                          : service.price_per_child
                          ? `₪${service.price_per_child} לילד`
                          : 'לפי הצעת מחיר'}
                      </span>
                      <button
                        onClick={() => openOrder(service)}
                        className="flex items-center gap-1.5 rounded-lg bg-[#00B1AE] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#006A82] transition-colors"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        הזמן
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* My Orders */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-black text-[#333654]">
          ההזמנות שלי
          {orders.length > 0 && (
            <span className="mr-2 text-sm font-semibold text-[#9091A8]">({orders.length})</span>
          )}
        </h2>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 rounded-xl border border-dashed border-[#E5E5E8]">
            <Package className="h-8 w-8 text-[#9091A8]" />
            <p className="text-sm text-[#6B6D8A]">לא בוצעו הזמנות עדיין</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E5E5E8] bg-white shadow-sm overflow-hidden divide-y divide-[#FEF0EC]">
            {orders.map((order) => {
              const cfg = statusStyle[order.status] ?? statusStyle['ממתין לאישור']
              const StatusIcon = cfg.icon
              const CatIcon = categoryIcon[order.network_services?.category] ?? Package
              return (
                <div key={order.id} className="flex items-center gap-4 px-4 py-3 hover:bg-[#F5F5F3]/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F5F5F3] flex-shrink-0">
                    <CatIcon className="h-5 w-5 text-[#6B6D8A]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#333654] truncate">{order.network_services?.name}</p>
                    <p className="text-xs text-[#9091A8] mt-0.5">
                      כמות: {order.quantity}
                      {order.delivery_date && ` · ${format(parseISO(order.delivery_date), 'dd/MM/yyyy')}`}
                    </p>
                  </div>
                  <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shrink-0 ${cfg.style}`}>
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <OrderForm
        open={orderFormOpen}
        onClose={() => setOrderFormOpen(false)}
        service={selectedService}
        campId={campId}
      />
      <ServiceAdminForm open={adminFormOpen} onClose={() => setAdminFormOpen(false)} />
    </div>
  )
}
