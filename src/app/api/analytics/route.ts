import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Parallel queries for performance
    const [
      { count: totalLeads },
      { count: emailsSent },
      { count: replies },
      { count: meetingsBooked },
      { data: leadsByStatus },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('leads').select('*', { count: 'exact', head: true }).not('email_sent_at', 'is', null),
      supabase.from('leads').select('*', { count: 'exact', head: true }).not('email_replied_at', 'is', null),
      supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'meeting_booked'),
      supabase.from('leads').select('status').then(({ data }) => ({
        data: data?.reduce((acc: Record<string, number>, lead) => {
          acc[lead.status] = (acc[lead.status] || 0) + 1
          return acc
        }, {}),
      })),
      supabase
        .from('leads')
        .select('created_at, email_sent_at, email_opened_at, email_replied_at')
        .not('email_sent_at', 'is', null)
        .order('email_sent_at', { ascending: false })
        .limit(100),
    ])

    const total = totalLeads || 0
    const meetings = meetingsBooked || 0

    return NextResponse.json({
      total_leads: total,
      emails_sent: emailsSent || 0,
      replies: replies || 0,
      meetings_booked: meetings,
      conversion_rate: total > 0 ? Math.round((meetings / total) * 100 * 10) / 10 : 0,
      open_rate: emailsSent && emailsSent > 0
        ? Math.round(((recentActivity?.filter(l => l.email_opened_at).length || 0) / emailsSent) * 100)
        : 0,
      reply_rate: emailsSent && emailsSent > 0
        ? Math.round(((replies || 0) / emailsSent) * 100)
        : 0,
      leads_by_status: leadsByStatus || {},
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
