import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const EXACT_PUBLIC = ['/']
const PREFIX_PUBLIC = ['/login', '/register', '/api/register', '/api/payments/webhook', '/payment', '/trip-approval', '/api/trip-approval', '/agreements/camp-contract', '/agreements/direct-operation', '/api/signed-agreements']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (EXACT_PUBLIC.includes(pathname)) return NextResponse.next()
  if (PREFIX_PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next()
  return await updateSession(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
