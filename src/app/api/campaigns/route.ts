import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        *,
        leads:leads(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ campaigns: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json()

    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        name: body.name,
        description: body.description || null,
        status: 'draft',
        calendly_link: body.calendly_link || null,
        send_schedule: body.send_schedule || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { id, ...updates } = await req.json()

    if (!id) return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 })

    const { data, error } = await supabase
      .from('campaigns')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ campaign: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
