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

    const campaign_id = new URL(req.url).searchParams.get('campaign_id')
    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaign_steps')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('user_id', user.id)
      .order('step_number', { ascending: true })

    if (error) throw error

    return NextResponse.json({ steps: data ?? [] })
  } catch (e: any) {
    console.error('[campaigns/steps GET]', e.message)
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

    const { id, subject, email_template } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Step ID required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('campaign_steps')
      .update({
        subject,
        email_template,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ step: data })
  } catch (e: any) {
    console.error('[campaigns/steps PUT]', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}