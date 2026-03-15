import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status   = searchParams.get('status')
    const campaign = searchParams.get('campaign')
    const limit    = parseInt(searchParams.get('limit') ?? '200')
    const offset   = parseInt(searchParams.get('offset') ?? '0')

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status)   query = query.eq('status', status)
    if (campaign) query = query.eq('campaign_id', campaign)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ leads: data ?? [], total: count ?? 0 })
  } catch (e: any) {
    console.error('[leads GET]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const incoming = Array.isArray(body) ? body : [body]

    if (incoming.length === 0) {
      return NextResponse.json({ error: 'No leads provided' }, { status: 400 })
    }

    const toInsert = incoming.map((lead: any, i: number) => {
      if (!lead.name?.trim())    throw new Error(`Row ${i + 1}: name is required`)
      if (!lead.email?.trim())   throw new Error(`Row ${i + 1}: email is required`)
      if (!lead.company?.trim()) throw new Error(`Row ${i + 1}: company is required`)

      return {
        name:        lead.name.trim(),
        company:     lead.company.trim(),
        email:       lead.email.trim().toLowerCase(),
        website:     lead.website     ?? null,
        linkedin:    lead.linkedin    ?? null,
        campaign_id: lead.campaign_id ?? null,
        status:      lead.status      ?? 'new',
        notes:       lead.notes       ?? null,
        user_id:     user.id,
      }
    })

    const { data, error } = await supabase
      .from('leads')
      .insert(toInsert)
      .select()

    if (error) {
      console.error('[leads POST] insert error:', error.message)
      throw error
    }

    return NextResponse.json({ leads: data ?? [] }, { status: 201 })
  } catch (e: any) {
    console.error('[leads POST]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, ...updates } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    delete updates.user_id

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })
  } catch (e: any) {
    console.error('[leads PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[leads DELETE]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}