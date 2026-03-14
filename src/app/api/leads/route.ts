import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const campaign = searchParams.get('campaign')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (campaign) query = query.eq('campaign_id', campaign)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ leads: data, total: count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    // Support bulk insert for CSV imports
    const leads = Array.isArray(body) ? body : [body]

    const toInsert = leads.map(lead => ({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      website: lead.website || null,
      linkedin: lead.linkedin || null,
      campaign_id: lead.campaign_id || null,
      status: lead.status || 'new',
      notes: lead.notes || null,
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert(toInsert)
      .select()

    if (error) throw error

    return NextResponse.json({ leads: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()
    const { id, ...updates } = body

    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

    const { error } = await supabase.from('leads').delete().eq('id', id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
