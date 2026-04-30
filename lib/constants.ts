export const SERVICE_CATEGORIES = [
  'אוזניות',
  'סובלימציה',
  'קצף',
  'ערכות לילדים',
  'אביזרים',
] as const

export const INCOME_CATEGORIES = [
  'דמי קייטנה',
  'טיולים',
  'צהרון',
  'העשרה',
  'אחר',
] as const

export const EXPENSE_CATEGORIES = [
  'צוות',
  'ציוד',
  'פרסום',
  'סדנאות רשת',
  'שכירות',
  'תחבורה',
  'אחר',
] as const

export const PAYMENT_STATUSES = [
  'טרם שולם',
  'שולם חלקי',
  'שולם מלא',
] as const

export const ORDER_STATUSES = [
  'ממתין לאישור',
  'מאושר',
  'בוצע',
] as const

export const STAFF_ROLES = [
  'מנהל קייטנה',
  'רכז פעילות',
  'מדריך בכיר',
  'מדריך',
  'אחראי לוגיסטיקה',
  'אחר',
] as const

export const SALARY_TYPES = ['חודשי', 'יומי', 'שעתי'] as const

export const DOCUMENT_TEMPLATES = [
  { type: 'ביטוח', label: 'פוליסת ביטוח', required: true },
  { type: 'בטיחות', label: 'נוהל בטיחות', required: true },
  { type: 'בטיחות', label: 'ביקורת בטיחות שנתית', required: true },
  { type: 'חוזה', label: 'חוזה שכירות מקום', required: false },
  { type: 'חוזה', label: 'חוזה מול צוות', required: false },
  { type: 'אישור', label: 'אישור עירייה', required: true },
  { type: 'אישור', label: 'אישור כיבוי אש', required: false },
  { type: 'טיול', label: 'אישור הורים לטיול', required: true },
  { type: 'טיול', label: 'הצהרת בריאות לטיול', required: true },
  { type: 'טיול', label: 'ביטוח נסיעות לטיול', required: true },
  { type: 'טיול', label: 'רשימת ציוד לטיול', required: false },
] as const

export const SHIRT_SIZES = ['6', '8', '10', '12', '14', '16', '18'] as const

export const KIPPAH_SIZES = ['3', '4', '5'] as const

export const SCHOOL_YEARS = [
  'תשפ״ד — 2023/24',
  'תשפ״ה — 2024/25',
  'תשפ״ו — 2025/26',
  'תשפ״ז — 2026/27',
  'תשפ״ח — 2027/28',
] as const

export function getCurrentSchoolYear(): string {
  const now = new Date()
  const month = now.getMonth() + 1 // 1-12
  const year = now.getFullYear()
  // Hebrew year starts in September (month 9)
  // תשפ״ו = 2025/26 → starts Sep 2025
  const startYear = month >= 9 ? year : year - 1
  const map: Record<number, string> = {
    2023: 'תשפ״ד — 2023/24',
    2024: 'תשפ״ה — 2024/25',
    2025: 'תשפ״ו — 2025/26',
    2026: 'תשפ״ז — 2026/27',
    2027: 'תשפ״ח — 2027/28',
  }
  return map[startYear] ?? 'תשפ״ו — 2025/26'
}

export const USER_ROLES = {
  'שליח': 'שליח',
  'מנהל רשת': 'מנהל רשת',
  'אדמין מערכת': 'אדמין מערכת',
} as const
