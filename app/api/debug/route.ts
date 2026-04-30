import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Test Supabase connection
  let connectionOk = false
  let connectionError = ''
  if (url && anon) {
    try {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: { apikey: anon, Authorization: `Bearer ${anon}` }
      })
      connectionOk = res.ok
      if (!res.ok) connectionError = `HTTP ${res.status}`
    } catch (e) {
      connectionError = String(e)
    }
  }

  return NextResponse.json({
    env: {
      supabase_url: url ? url.slice(0, 30) + '...' : 'MISSING',
      anon_key: anon ? 'SET (' + anon.length + ' chars)' : 'MISSING',
      service_key: service ? 'SET (' + service.length + ' chars)' : 'MISSING',
    },
    connection: { ok: connectionOk, error: connectionError },
  })
}
