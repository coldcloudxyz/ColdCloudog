import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('campaigns')
      .select(`
        *,
        leads:leads(count)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.ilike('name', `%${search}%`)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      campaigns: data,
      total: count,
      limit,
      offset
    })

  } catch (error: any) {
    console.error('Campaigns GET error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Campaign name is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        description: body.description || null,
        status: body.status || 'draft',
        calendly_link: body.calendly_link || null,
        send_schedule: body.send_schedule || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(
      { campaign: data },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('Campaign POST error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const { id, leads, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Campaign ID required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Attach leads to campaign if provided
    if (Array.isArray(leads) && leads.length > 0) {
      try {
        await supabase
          .from('leads')
          .update({
            campaign_id: id,
            updated_at: new Date().toISOString()
          })
          .in('id', leads)
      } catch (e) {
        console.log('Lead campaign assignment failed')
      }
    }

    return NextResponse.json({ campaign: data })

  } catch (error: any) {
    console.error('Campaign PUT error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to update campaign' },
      { status: 500 }
    )
  }
}