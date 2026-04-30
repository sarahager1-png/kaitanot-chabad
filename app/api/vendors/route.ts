import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('vendors')
    .select('id, name')
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { name } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'שם חסר' }, { status: 400 })

  const { data, error } = await supabase
    .from('vendors')
    .upsert({ name: name.trim() }, { onConflict: 'name' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
