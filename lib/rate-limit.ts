// Rate limiter בזיכרון — מספיק לעומסים רגילים
// key = מזהה ייחודי (IP + endpoint), limit = מקסימום בקשות, windowMs = חלון זמן במילישניות
const store = new Map<string, { count: number; resetAt: number }>()

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false

  entry.count++
  return true
}
