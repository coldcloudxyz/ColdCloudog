import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    const supabase = createAdminClient()

    const [
      { count: totalLeads },
      { count: emailsSent },
      { count: replies },
      { count: meetingsBooked },
      { count: totalCampaigns },
      { data: leadsStatusRows },
      { data: recentEmails }
    ] = await Promise.all([

      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('email_sent_at', 'is', null),

      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('email_replied_at', 'is', null),

      supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'meeting_booked'),

      supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true }),

      supabase
        .from('leads')
        .select('status'),

      supabase
        .from('leads')
        .select('name,email,company,email_sent_at,email_opened_at,email_replied_at')
        .not('email_sent_at', 'is', null)
        .order('email_sent_at', { ascending: false })
        .limit(20)

    ])

    const total = totalLeads || 0
    const sent = emailsSent || 0
    const replied = replies || 0
    const meetings = meetingsBooked || 0

    // Calculate status distribution
    const leadsByStatus = (leadsStatusRows || []).reduce(
      (acc: Record<string, number>, lead: any) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1
        return acc
      },
      {}
    )

    // Open rate calculation
    const opens =
      recentEmails?.filter((l: any) => l.email_opened_at).length || 0

    const openRate =
      sent > 0 ? Math.round((opens / sent) * 100) : 0

    const replyRate =
      sent > 0 ? Math.round((replied / sent) * 100) : 0

    const conversionRate =
      total > 0
        ? Math.round((meetings / total) * 1000) / 10
        : 0

    return NextResponse.json({
      overview: {
        total_leads: total,
        total_campaigns: totalCampaigns || 0,
        emails_sent: sent,
        replies: replied,
        meetings_booked: meetings
      },

      performance: {
        open_rate: openRate,
        reply_rate: replyRate,
        conversion_rate: conversionRate
      },

      leads_by_status: leadsByStatus,

      recent_activity: recentEmails || []
    })

  } catch (error: any) {
    console.error('Analytics API error:', error)

    return NextResponse.json(
      { error: error.message || 'Failed to load analytics' },
      { status: 500 }
    )
  }
}