import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Every handler creates a route-handler Supabase client so the
// session cookie is read automatically.  RLS then enforces that
// the authenticated user can only touch their own rows.

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Confirm the caller is signed in
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
      .eq('user_id', user.id)           // ← scope to this user
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

    // Accept a single object or an array (CSV bulk import)
    const incoming = Array.isArray(body) ? body : [body]

    const toInsert = incoming.map(lead => ({
      name:        lead.name,
      company:     lead.company,
      email:       lead.email,
      website:     lead.website     ?? null,
      linkedin:    lead.linkedin    ?? null,
      campaign_id: lead.campaign_id ?? null,
      status:      lead.status      ?? 'new',
      notes:       lead.notes       ?? null,
      user_id:     user.id,          // ← always stamp with the caller's id
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert(toInsert)
      .select()

    if (error) throw error

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

    // The .eq('user_id', user.id) ensures users cannot update
    // another user's lead even if they guess the UUID.
    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)          // ← ownership check
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
      .eq('user_id', user.id)          // ← ownership check

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[leads DELETE]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}