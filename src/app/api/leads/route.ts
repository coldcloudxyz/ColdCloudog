import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const status = searchParams.get('status')
    const campaign = searchParams.get('campaign')
    const search = searchParams.get('search')

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)

    if (campaign) query = query.eq('campaign_id', campaign)

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,company.ilike.%${search}%,email.ilike.%${search}%`
      )
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      leads: data,
      total: count,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('Leads GET error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const leads = Array.isArray(body) ? body : [body]

    if (!leads.length) {
      return NextResponse.json(
        { error: 'No leads provided' },
        { status: 400 }
      )
    }

    const toInsert = leads.map((lead) => ({
      name: lead.name,
      company: lead.company,
      email: lead.email,
      website: lead.website || null,
      linkedin: lead.linkedin || null,
      campaign_id: lead.campaign_id || null,
      status: lead.status || 'new',
      notes: lead.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('leads')
      .insert(toInsert)
      .select()

    if (error) throw error

    return NextResponse.json(
      { leads: data, inserted: data.length },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Leads POST error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to create leads' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ lead: data })

  } catch (error: any) {
    console.error('Leads PUT error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to update lead' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Lead ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })

  } catch (error: any) {
    console.error('Leads DELETE error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to delete lead' },
      { status: 500 }
    )
  }
}