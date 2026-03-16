import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'

export async function GET(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const campaign_id = new URL(req.url).searchParams.get('campaign_id')
    if (!campaign_id) return NextResponse.json({ error: 'campaign_id required' }, { status: 400 })

    const { data, error } = await supabase!
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('user_id', user!.id)
      .order('step_number', { ascending: true })

    if (error) throw error
    return NextResponse.json({ steps: data ?? [] })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { id, subject, email_template } = await req.json()
    if (!id) return NextResponse.json({ error: 'Step ID required' }, { status: 400 })

    const { data, error } = await supabase!
      .from('campaign_steps')
      .update({ subject, email_template, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ step: data })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}