'use client'

import { useEffect, useState } from 'react'
import {
  Users, Mail, MessageSquare, Calendar, TrendingUp,
  ArrowUpRight, Zap, Plus, ChevronRight, Activity, Loader2
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { createBrowserClient } from '@/lib/supabase'
import { formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Lead } from '@/types'

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_leads:     0,
    emails_sent:     0,
    replies:         0,
    meetings_booked: 0,
    conversion_rate: 0,
  })
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [chartData,   setChartData]   = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => { loadDashboard() }, [])

  async function loadDashboard() {
    setLoading(true)
    // Always create the client inside the function — never at module level
    const supabase = createBrowserClient()

    try {
      const [
        { count: totalLeads },
        { count: emailsSent },
        { count: replies },
        { count: meetings },
        { data: leadsData },
        { data: sentLeads },
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
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('leads')
          .select('email_sent_at, email_opened_at, email_replied_at')
          .not('email_sent_at', 'is', null),
      ])

      const total = totalLeads ?? 0
      const met   = meetings   ?? 0

      setStats({
        total_leads:     total,
        emails_sent:     emailsSent ?? 0,
        replies:         replies    ?? 0,
        meetings_booked: met,
        conversion_rate: total > 0
          ? Math.round((met / total) * 100 * 10) / 10
          : 0,
      })

      setRecentLeads(leadsData ?? [])
      setChartData(buildChartData(sentLeads ?? []))
    } catch (e: any) {
      console.error('[dashboard] load error:', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            Welcome back — here's what's happening.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads" className="btn-secondary text-sm">
            <Plus className="w-4 h-4" /> Add Lead
          </Link>
          <Link href="/dashboard/campaigns" className="btn-primary text-sm">
            <Zap className="w-4 h-4" /> New Campaign
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 h-28 skeleton" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: 'Total Leads',
              value: stats.total_leads.toLocaleString(),
              icon:  Users,
              color: 'text-brand-600 dark:text-brand-400',
              bg:    'bg-brand-50 dark:bg-brand-950',
            },
            {
              label: 'Emails Sent',
              value: stats.emails_sent.toLocaleString(),
              icon:  Mail,
              color: 'text-green-600 dark:text-green-400',
              bg:    'bg-green-50 dark:bg-green-950',
            },
            {
              label: 'Replies',
              value: stats.replies.toLocaleString(),
              icon:  MessageSquare,
              color: 'text-amber-600 dark:text-amber-400',
              bg:    'bg-amber-50 dark:bg-amber-950',
            },
            {
              label: 'Meetings Booked',
              value: stats.meetings_booked.toLocaleString(),
              icon:  Calendar,
              color: 'text-purple-600 dark:text-purple-400',
              bg:    'bg-purple-50 dark:bg-purple-950',
            },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={color} style={{ width: 18, height: 18 }} />
                </div>
                <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Live
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Conversion banner */}
      <div className="card p-4 mb-6 bg-gradient-to-r from-brand-600 to-cyan-600 border-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Conversion Rate</div>
              <div className="text-brand-100 text-sm">Leads → Meetings booked</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-white">
              {loading
                ? <Loader2 className="w-6 h-6 animate-spin" />
                : `${stats.conversion_rate}%`}
            </div>
            <div className="text-brand-200 text-sm">Industry avg: 1.2%</div>
          </div>
        </div>
      </div>

      {/* Chart + recent leads */}
      <div className="grid lg:grid-cols-5 gap-6">

        {/* Email chart */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Email Performance</h2>
              <p className="text-sm text-surface-400">Last 7 days</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs">
              {[
                { color: 'bg-brand-500', label: 'Sent'    },
                { color: 'bg-cyan-400',  label: 'Opened'  },
                { color: 'bg-green-400', label: 'Replied' },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400"
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="h-[200px] skeleton rounded-lg" />
          ) : chartData.every(d => d.sent === 0) ? (
            <div className="h-[200px] flex items-center justify-center text-surface-400 text-sm text-center px-4">
              No email activity yet. Send your first outreach to see data here.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <defs>
                  {[
                    { id: 'sent',    color: '#0ea5e9' },
                    { id: 'opened',  color: '#22d3ee' },
                    { id: 'replied', color: '#4ade80' },
                  ].map(({ id, color }) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0}   />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis
                  dataKey="date"
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
                <Tooltip
                  contentStyle={{
                    background:   '#1e293b',
                    border:       '1px solid #334155',
                    borderRadius: 8,
                    fontSize:     12,
                    color:        '#f1f5f9',
                  }}
                />
                <Area type="monotone" dataKey="sent"    stroke="#0ea5e9" fill="url(#sent)"    strokeWidth={2} />
                <Area type="monotone" dataKey="opened"  stroke="#22d3ee" fill="url(#opened)"  strokeWidth={2} />
                <Area type="monotone" dataKey="replied" stroke="#4ade80" fill="url(#replied)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent leads */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link
              href="/dashboard/leads"
              className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-10 skeleton rounded-lg" />
              ))}
            </div>
          ) : recentLeads.length === 0 ? (
            <div className="py-8 text-center text-surface-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No leads yet.</p>
              <Link
                href="/dashboard/leads"
                className="text-xs text-brand-600 hover:underline mt-1 block"
              >
                Add your first lead →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map(lead => (
                <div key={lead.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {lead.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{lead.name}</p>
                      <span className={`badge ml-2 flex-shrink-0 ${getStatusColor(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </div>
                    <p className="text-xs text-surface-400 truncate">
                      {lead.company} · {formatRelativeTime(lead.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Link
            href="/dashboard/leads"
            className="btn-secondary w-full justify-center mt-4 text-sm"
          >
            <Users className="w-3.5 h-3.5" /> Manage leads
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          {
            icon:  Zap,
            label: 'Generate AI Messages',
            desc:  'Personalize outreach for new leads',
            href:  '/dashboard/leads',
            color: 'from-brand-500 to-cyan-500',
          },
          {
            icon:  Mail,
            label: 'Send Campaign',
            desc:  'Launch your next outreach campaign',
            href:  '/dashboard/campaigns',
            color: 'from-purple-500 to-pink-500',
          },
          {
            icon:  Activity,
            label: 'View Analytics',
            desc:  'Deep dive into performance data',
            href:  '/dashboard/analytics',
            color: 'from-green-500 to-emerald-500',
          },
        ].map(({ icon: Icon, label, desc, href, color }) => (
          <Link
            key={label}
            href={href}
            className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow group-hover:scale-110 transition-transform`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm">{label}</p>
              <p className="text-xs text-surface-400 truncate">{desc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600 ml-auto flex-shrink-0 group-hover:text-brand-500 transition-colors" />
          </Link>
        ))}
      </div>

    </div>
  )
}

// ── Chart helper ──────────────────────────────────────────────────────────────

function buildChartData(
  leads: {
    email_sent_at:   string | null
    email_opened_at: string | null
    email_replied_at: string | null
  }[]
) {
  const days: Record<string, { date: string; sent: number; opened: number; replied: number }> = {}

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    days[key] = { date: key, sent: 0, opened: 0, replied: 0 }
  }

  leads.forEach(lead => {
    const toKey = (ts: string | null) =>
      ts
        ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null

    const sk = toKey(lead.email_sent_at)
    const ok = toKey(lead.email_opened_at)
    const rk = toKey(lead.email_replied_at)

    if (sk && days[sk]) days[sk].sent++
    if (ok && days[ok]) days[ok].opened++
    if (rk && days[rk]) days[rk].replied++
  })

  return Object.values(days)
}
