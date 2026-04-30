export type UserRole = 'שליח' | 'מנהל קייטנה' | 'מנהל רשת' | 'אדמין מערכת'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
}

export interface Camp {
  id: string
  name: string
  school_year: string
  address: string | null
  phone: string | null
  registration_open_at: string | null
  registration_close_at: string | null
  camp_open_at: string | null
  camp_close_at: string | null
  registration_goal: number
  cardcom_terminal: string | null
  cardcom_api_name: string | null
  cardcom_api_password: string | null
  created_at: string
}

export interface Track {
  id: string
  camp_id: string
  name: string
  description: string | null
  price: number
}

export interface Registrant {
  id: string
  camp_id: string
  track_id: string | null
  first_name: string
  last_name: string
  birth_date: string | null
  age: number | null
  group_name: string | null
  parent1_name: string | null
  parent1_phone: string | null
  parent2_name: string | null
  parent2_phone: string | null
  primary_phone: string | null
  email: string | null
  payment_status: 'טרם שולם' | 'שולם חלקי' | 'שולם מלא'
  amount_paid: number
  amount_due: number
  notes: string | null
  gender: 'זכר' | 'נקבה' | null
  photo_consent: boolean
  shirt_size: string | null
  kippah_size: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  is_healthy: boolean | null
  health_issues: string | null
  allergies: string | null
  medications: string | null
  is_waiting: boolean | null
  created_at: string
  tracks?: Track
}

export interface Attendance {
  id: string
  registrant_id: string
  camp_id: string
  date: string
  present: boolean
  notes: string | null
  created_at: string
}

export interface IncomeEntry {
  id: string
  camp_id: string
  category: string
  description: string | null
  amount: number
  entry_date: string
  created_at: string
}

export interface ExpenseEntry {
  id: string
  camp_id: string
  category: string
  description: string | null
  amount: number
  vendor: string | null
  payment_status: 'שולם' | 'לא שולם'
  invoice_url: string | null
  entry_date: string
  created_at: string
}

export interface Vendor {
  id: string
  name: string
  created_at: string
}

export interface Budget {
  id: string
  camp_id: string
  category: string
  planned_amount: number
  alert_threshold: number
}

export type ServiceCategory = 'אוזניות' | 'סובלימציה' | 'קצף' | 'ערכות לילדים' | 'אביזרים'

export interface NetworkService {
  id: string
  category: ServiceCategory
  name: string
  description: string | null
  price_per_unit: number | null
  price_per_child: number | null
  unit_label: string
  is_active: boolean
}

export type OrderStatus = 'ממתין לאישור' | 'מאושר' | 'בוצע'

export interface Order {
  id: string
  camp_id: string
  service_id: string
  quantity: number
  delivery_date: string | null
  notes: string | null
  status: OrderStatus
  ordered_by: string | null
  created_at: string
  network_services?: NetworkService
}

export interface Document {
  id: string
  camp_id: string
  doc_type: string
  label: string
  file_url: string | null
  is_completed: boolean
  due_date: string | null
  created_at: string
}

export interface StaffMember {
  id: string
  camp_id: string
  full_name: string
  role: string
  phone: string | null
  email: string | null
  salary: number | null
  salary_type: 'חודשי' | 'יומי' | 'שעתי'
  start_date: string | null
  end_date: string | null
  notes: string | null
}

export interface Activity {
  id: string
  plan_id: string
  start_time: string | null
  end_time: string | null
  title: string
  description: string | null
  materials_url: string | null
  responsible: string | null
}

export interface DailyPlan {
  id: string
  camp_id: string
  plan_date: string
  topic: string | null
  notes: string | null
  activities?: Activity[]
}

export interface Alert {
  id: string
  camp_id: string | null
  alert_type: string
  severity: 'info' | 'warning' | 'error'
  title: string
  body: string | null
  is_read: boolean
  created_at: string
}

export interface PaymentTransaction {
  id: string
  registrant_id: string
  camp_id: string
  amount: number
  status: 'pending' | 'paid' | 'failed' | 'cancelled'
  provider: string
  provider_ref: string | null
  payment_url: string | null
  created_at: string
  paid_at: string | null
}

export interface Trip {
  id: string
  camp_id: string
  title: string
  description: string | null
  trip_date: string | null
  created_at: string
}

export interface TripApproval {
  id: string
  trip_id: string
  registrant_id: string
  camp_id: string
  token: string
  signed: boolean
  signed_at: string | null
  signer_name: string | null
  signature_data: string | null
  created_at: string
}

export interface SharedContent {
  id: string
  uploaded_by: string | null
  camp_id: string | null
  title: string
  description: string | null
  category: string
  file_url: string | null
  created_at: string
}

export interface ActivityVendor {
  id: string
  name: string
  activity: string
  phone: string | null
  website: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  avg_stars?: number
  review_count?: number
}

export interface VendorReview {
  id: string
  vendor_id: string
  reviewer_id: string
  camp_id: string | null
  stars: number
  comment: string | null
  created_at: string
}

export interface DashboardStats {
  total_registrants: number
  registration_goal: number
  total_income: number
  total_expenses: number
  avg_price_per_child: number
  age_groups: { label: string; count: number }[]
  waiting_count: number
  health_flags_count: number
  attendance_today_count: number | null
}
