import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'

export async function GET() {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { data, error } = await supabase!
      .from('user_settings')
      .select('*')
      .eq('user_id', user!.id)
      .single()

    // No settings row yet — return empty object, not an error
    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ settings: null })
    }
    if (error) throw error

    return NextResponse.json({ settings: data })
  } catch (e: any) {
    console.error('[settings GET]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const body = await req.json()

    const { data, error } = await supabase!
      .from('user_settings')
      .upsert(
        {
          user_id:       user!.id,
          sender_name:   body.sender_name   ?? null,
          sender_email:  body.sender_email  ?? null,
          company_name:  body.company_name  ?? null,
          calendly_link: body.calendly_link ?? null,
          updated_at:    new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ settings: data })
  } catch (e: any) {
    console.error('[settings POST]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}