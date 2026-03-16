import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-client'

export async function GET() {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { data, error } = await supabase!
      .from('campaigns')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ campaigns: data ?? [] })
  } catch (e: any) {
    console.error('[campaigns GET]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const body = await req.json()
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Campaign name is required' }, { status: 400 })
    }

    const { data, error } = await supabase!
      .from('campaigns')
      .insert({
        name:            body.name.trim(),
        description:     body.description     ?? null,
        calendly_link:   body.calendly_link   ?? null,
        campaign_goal:   body.campaign_goal   ?? null,
        status:          'draft',
        total_leads:     0,
        emails_sent:     0,
        replies:         0,
        meetings_booked: 0,
        user_id:         user!.id,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (e: any) {
    console.error('[campaigns POST]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { supabase, user, response } = await requireAuth()
  if (response) return response

  try {
    const { id, ...updates } = await req.json()
    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

    delete updates.user_id

    const { data, error } = await supabase!
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user!.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ campaign: data })
  } catch (e: any) {
    console.error('[campaigns PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}