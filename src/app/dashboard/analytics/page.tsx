'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingUp, Users, Mail, MessageSquare,
  Calendar, ArrowUpRight, Loader2, RefreshCw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LeadRow {
  status: string
  email_sent_at:    string | null
  opened_at:        string | null
  replied_at:       string | null
  meeting_booked_at: string | null
  campaign_id:      string | null
}

interface CampaignRow {
  id:              string
  name:            string
  emails_sent:     number
  replies:         number
  meetings_booked: number
}

interface DayBucket {
  date:    string
  sent:    number
  opened:  number
  replied: number
}

interface PipelineSlice {
  name:  string
  value: number
  color: string
}

interface CampaignPerf {
  name:     string
  sent:     number
  replies:  number
  meetings: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildLast14Days(leads: LeadRow[]): DayBucket[] {
  const buckets: Record<string, DayBucket> = {}

  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    buckets[key] = { date: key, sent: 0, opened: 0, replied: 0 }
  }

  leads.forEach(lead => {
    const toKey = (ts: string | null) =>
      ts
        ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null

    const sentKey    = toKey(lead.email_sent_at)
    const openedKey  = toKey(lead.opened_at)
    const repliedKey = toKey(lead.replied_at)

    if (sentKey    && buckets[sentKey])    buckets[sentKey].sent++
    if (openedKey  && buckets[openedKey])  buckets[openedKey].opened++
    if (repliedKey && buckets[repliedKey]) buckets[repliedKey].replied++
  })

  return Object.values(buckets)
}

function buildPipeline(leads: LeadRow[]): PipelineSlice[] {
  const counts: Record<string, number> = {}
  leads.forEach(l => {
    counts[l.status] = (counts[l.status] ?? 0) + 1
  })
  return [
    { name: 'New',            value: counts['new']            ?? 0, color: '#94a3b8' },
    { name: 'Contacted',      value: counts['contacted']      ?? 0, color: '#0ea5e9' },
    { name: 'Replied',        value: counts['replied']        ?? 0, color: '#f59e0b' },
    { name: 'Meeting Booked', value: counts['meeting_booked'] ?? 0, color: '#22c55e' },
    { name: 'Closed',         value: counts['closed']         ?? 0, color: '#a855f7' },
    { name: 'Unqualified',    value: counts['unqualified']    ?? 0, color: '#f87171' },
  ].filter(s => s.value > 0)
}

const tooltipStyle = {
  contentStyle: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 8,
    fontSize: 12,
    color: '#f1f5f9',
  },
  labelStyle: { color: '#94a3b8', fontWeight: 600 },
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)

  // KPIs — all start at 0, never hardcoded
  const [totalLeads,     setTotalLeads]     = useState(0)
  const [emailsSent,     setEmailsSent]     = useState(0)
  const [totalOpened,    setTotalOpened]    = useState(0)
  const [totalReplied,   setTotalReplied]   = useState(0)
  const [meetingsBooked, setMeetingsBooked] = useState(0)
  const [openRate,       setOpenRate]       = useState(0)
  const [replyRate,      setReplyRate]      = useState(0)
  const [convRate,       setConvRate]       = useState(0)

  // Chart data — all start empty
  const [timelineData, setTimelineData] = useState<DayBucket[]>([])
  const [pipelineData, setPipelineData] = useState<PipelineSlice[]>([])
  const [campaignPerf, setCampaignPerf] = useState<CampaignPerf[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  async function loadAnalytics() {
    setLoading(true)
    try {

      // ── 1. Fetch every lead row we need ──────────────────────
      // Columns used:
      //   email_sent_at  → Emails Sent count + timeline
      //   opened_at      → Opened count + timeline
      //   replied_at     → Replied count + timeline
      //   meeting_booked_at → cross-check (status field is primary)
      //   status         → pipeline donut
      //   campaign_id    → reserved for future per-campaign drill-down
      const { data: leads, error: leadsErr } = await supabase
        .from('leads')
        .select(
          'status, email_sent_at, opened_at, replied_at, meeting_booked_at, campaign_id'
        )

      if (leadsErr) throw leadsErr

      const rows: LeadRow[] = leads ?? []

      // ── 2. Calculate KPIs directly from real rows ────────────
      const sent     = rows.filter(r => r.email_sent_at  !== null).length
      const opened   = rows.filter(r => r.opened_at      !== null).length
      const replied  = rows.filter(r => r.replied_at     !== null).length
      const meetings = rows.filter(r => r.status === 'meeting_booked').length

      setTotalLeads(rows.length)
      setEmailsSent(sent)
      setTotalOpened(opened)
      setTotalReplied(replied)
      setMeetingsBooked(meetings)

      // Rates — always 0 when denominator is 0, never NaN
      setOpenRate( sent > 0        ? Math.round((opened   / sent)       * 100) : 0)
      setReplyRate(sent > 0        ? Math.round((replied  / sent)       * 100) : 0)
      setConvRate( rows.length > 0 ? Math.round((meetings / rows.length) * 1000) / 10 : 0)

      // ── 3. Build chart data from the same rows ───────────────
      setTimelineData(buildLast14Days(rows))
      setPipelineData(buildPipeline(rows))

      // ── 4. Campaign bar chart from campaigns table ───────────
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, name, emails_sent, replies, meetings_booked')
        .order('emails_sent', { ascending: false })
        .limit(6)

      setCampaignPerf(
        (campaigns ?? []).map((c: CampaignRow) => ({
          name:     c.name.length > 18 ? c.name.slice(0, 18) + '…' : c.name,
          sent:     c.emails_sent     ?? 0,
          replies:  c.replies         ?? 0,
          meetings: c.meetings_booked ?? 0,
        }))
      )

    } catch (e: any) {
      console.error('[analytics] load error:', e.message)
    } finally {
      setLoading(false)
    }
  }

  // ── Derived flags for empty-state rendering ──────────────────
  const hasTimeline  = timelineData.some(d => d.sent > 0)
  const hasPipeline  = pipelineData.length > 0
  const hasCampaigns = campaignPerf.length > 0

  // ── KPI card definitions (values come from state, never hardcoded) ──
  const kpis = [
    {
      label: 'Total Leads',
      value: totalLeads.toLocaleString(),
      sub:   'in database',
      icon:  Users,
      color: 'text-brand-600 dark:text-brand-400',
      bg:    'bg-brand-50 dark:bg-brand-950',
    },
    {
      label: 'Emails Sent',
      value: emailsSent.toLocaleString(),
      sub:   'email_sent_at not null',
      icon:  Mail,
      color: 'text-blue-600 dark:text-blue-400',
      bg:    'bg-blue-50 dark:bg-blue-950',
    },
    {
      label: 'Opened',
      value: `${totalOpened.toLocaleString()} (${openRate}%)`,
      sub:   'opened_at not null',
      icon:  TrendingUp,
      color: 'text-amber-600 dark:text-amber-400',
      bg:    'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Replied',
      value: `${totalReplied.toLocaleString()} (${replyRate}%)`,
      sub:   'replied_at not null',
      icon:  MessageSquare,
      color: 'text-purple-600 dark:text-purple-400',
      bg:    'bg-purple-50 dark:bg-purple-950',
    },
    {
      label: 'Meetings Booked',
      value: meetingsBooked.toLocaleString(),
      sub:   `${convRate}% conversion`,
      icon:  Calendar,
      color: 'text-green-600 dark:text-green-400',
      bg:    'bg-green-50 dark:bg-green-950',
    },
  ]

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            Live metrics from your Supabase database
          </p>
        </div>
        <button
          onClick={loadAnalytics}
          className="btn-ghost text-sm"
          title="Refresh data"
          disabled={loading}
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* KPI cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={color} style={{ width: 18, height: 18 }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Live
                </span>
              </div>
              <div className="text-xl font-bold leading-tight">{value}</div>
              <div className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{label}</div>
              <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Timeline + Pipeline */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">

        {/* Email activity timeline */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Email Activity</h2>
              <p className="text-xs text-surface-400 mt-0.5">Last 14 days</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs">
              {[
                { color: 'bg-brand-500', label: 'Sent'    },
                { color: 'bg-cyan-400',  label: 'Opened'  },
                { color: 'bg-amber-400', label: 'Replied' },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400"
                >
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-[220px] skeleton rounded-lg" />
          ) : !hasTimeline ? (
            <div className="h-[220px] flex flex-col items-center justify-center text-surface-400 text-sm text-center gap-1">
              <Mail className="w-8 h-8 opacity-30 mb-1" />
              <p className="font-medium">No email activity yet</p>
              <p className="text-xs">Send outreach from the Leads page to see data here</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={timelineData}>
                <defs>
                  {[
                    { id: 'sent',    color: '#0ea5e9' },
                    { id: 'opened',  color: '#22d3ee' },
                    { id: 'replied', color: '#f59e0b' },
                  ].map(({ id, color }) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}   />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  interval={1}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip {...tooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#0ea5e9"
                  fill="url(#sent)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stroke="#22d3ee"
                  fill="url(#opened)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="replied"
                  stroke="#f59e0b"
                  fill="url(#replied)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pipeline donut */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Lead Pipeline</h2>
          <p className="text-xs text-surface-400 mb-4">By current status</p>

          {loading ? (
            <div className="h-[180px] skeleton rounded-lg" />
          ) : !hasPipeline ? (
            <div className="h-[180px] flex flex-col items-center justify-center text-surface-400 text-sm text-center gap-1">
              <Users className="w-8 h-8 opacity-30 mb-1" />
              <p className="font-medium">No leads yet</p>
              <p className="text-xs">Add leads to see pipeline breakdown</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pipelineData.map(entry => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {pipelineData.map(item => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: item.color }}
                      />
                      <span className="text-surface-600 dark:text-surface-400">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Campaign performance bar chart */}
      <div className="card p-5">
        <h2 className="font-semibold mb-1">Campaign Performance</h2>
        <p className="text-xs text-surface-400 mb-5">
          Emails sent, replies, and meetings per campaign
        </p>

        {loading ? (
          <div className="h-[220px] skeleton rounded-lg" />
        ) : !hasCampaigns ? (
          <div className="h-[220px] flex flex-col items-center justify-center text-surface-400 text-sm text-center gap-1">
            <TrendingUp className="w-8 h-8 opacity-30 mb-1" />
            <p className="font-medium">No campaigns yet</p>
            <p className="text-xs">
              Create a campaign from the Campaigns page to see performance here
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={campaignPerf} barGap={4}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip {...tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar
                dataKey="sent"
                fill="#0ea5e9"
                radius={[4, 4, 0, 0]}
                name="Sent"
              />
              <Bar
                dataKey="replies"
                fill="#f59e0b"
                radius={[4, 4, 0, 0]}
                name="Replies"
              />
              <Bar
                dataKey="meetings"
                fill="#22c55e"
                radius={[4, 4, 0, 0]}
                name="Meetings"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  )
}