import type { UserRole } from './types'

export const CAMP_SCOPED_ROLES: UserRole[] = ['שליח', 'מנהל קייטנה']
export const MANAGER_ROLES: UserRole[] = ['מנהל קייטנה', 'מנהל רשת', 'אדמין מערכת']
export const NETWORK_ROLES: UserRole[] = ['מנהל רשת', 'אדמין מערכת']

// ראה/ערוך קייטנה אחת בלבד (מסונן לפי camp_users)
export const isCampScoped = (role: string): boolean =>
  CAMP_SCOPED_ROLES.includes(role as UserRole)

// יכול לנהל תוכן בקייטנה (ולא רק לצפות)
export const isManager = (role: string): boolean =>
  MANAGER_ROLES.includes(role as UserRole)

// גישה לכל הקייטנות ברשת
export const isNetworkAdmin = (role: string): boolean =>
  NETWORK_ROLES.includes(role as UserRole)
