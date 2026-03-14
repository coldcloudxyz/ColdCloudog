'use client'

import { useEffect, useState } from 'react'
import {
  Users, Mail, MessageSquare, Calendar, TrendingUp,
  ArrowUpRight, ArrowDownRight, Zap, Plus, ChevronRight, Activity
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime, getStatusColor, getStatusLabel } from '@/lib/utils'

const mockChartData = [
  { date: 'Jan 8', sent: 12, opened: 8, replied: 3 },
  { date: 'Jan 9', sent: 18, opened: 13, replied: 5 },
  { date: 'Jan 10', sent: 25, opened: 19, replied: 7 },
  { date: 'Jan 11', sent: 30, opened: 22, replied: 9 },
  { date: 'Jan 12', sent: 22, opened: 16, replied: 6 },
  { date: 'Jan 13', sent: 35, opened: 28, replied: 12 },
  { date: 'Jan 14', sent: 41, opened: 33, replied: 15 },
]

const mockLeads = [
  { id: '1', name: 'Alex Johnson', company: 'Stripe', email: 'alex@stripe.com', status: 'replied', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', name: 'Maria Garcia', company: 'Notion', email: 'maria@notion.so', status: 'contacted', created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', name: 'Tom Lee', company: 'Linear', email: 'tom@linear.app', status: 'meeting_booked', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', name: 'Sarah Kim', company: 'Figma', email: 'sarah@figma.com', status: 'new', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', name: 'James Wilson', company: 'Vercel', email: 'james@vercel.com', status: 'contacted', created_at: new Date(Date.now() - 259200000).toISOString() },
]

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_leads: 0, emails_sent: 0, replies: 0,
    meetings_booked: 0, conversion_rate: 0
  })
  const [leads, setLeads] = useState(mockLeads)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const { data: leadsData } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(5)
      if (leadsData && leadsData.length > 0) setLeads(leadsData)

      const { count: totalLeads } = await supabase.from('leads').select('*', { count: 'exact', head: true })
      const { count: emailsSent } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('email_sent_at', 'is', null)
      const { count: replies } = await supabase.from('leads').select('*', { count: 'exact', head: true }).not('email_replied_at', 'is', null)
      const { count: meetings } = await supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'meeting_booked')

      setStats({
        total_leads: totalLeads || 2847,
        emails_sent: emailsSent || 1203,
        replies: replies || 347,
        meetings_booked: meetings || 89,
        conversion_rate: totalLeads ? Math.round(((meetings || 0) / totalLeads) * 100 * 10) / 10 : 3.1,
      })
    } catch (e) {
      // Use mock data if Supabase not configured
      setStats({ total_leads: 2847, emails_sent: 1203, replies: 347, meetings_booked: 89, conversion_rate: 3.1 })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      label: 'Total Leads',
      value: stats.total_leads.toLocaleString(),
      change: '+12%',
      positive: true,
      icon: Users,
      color: 'text-brand-600 dark:text-brand-400',
      bg: 'bg-brand-50 dark:bg-brand-950',
    },
    {
      label: 'Emails Sent',
      value: stats.emails_sent.toLocaleString(),
      change: '+8%',
      positive: true,
      icon: Mail,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-950',
    },
    {
      label: 'Replies',
      value: stats.replies.toLocaleString(),
      change: '+24%',
      positive: true,
      icon: MessageSquare,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950',
    },
    {
      label: 'Meetings Booked',
      value: stats.meetings_booked.toLocaleString(),
      change: '+31%',
      positive: true,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950',
    },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">Welcome back — here's what's happening.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/leads/new" className="btn-secondary text-sm">
            <Plus className="w-4 h-4" />
            Add Lead
          </Link>
          <Link href="/dashboard/campaigns/new" className="btn-primary text-sm">
            <Zap className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {stat.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {stat.change}
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Conversion rate banner */}
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
            <div className="text-3xl font-bold text-white">{stats.conversion_rate}%</div>
            <div className="text-brand-200 text-sm">Industry avg: 1.2%</div>
          </div>
        </div>
      </div>

      {/* Chart + Recent leads */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Email chart */}
        <div className="lg:col-span-3 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Email Performance</h2>
              <p className="text-sm text-surface-400">Last 7 days activity</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {[
                { color: 'bg-brand-500', label: 'Sent' },
                { color: 'bg-cyan-400', label: 'Opened' },
                { color: 'bg-green-400', label: 'Replied' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
                  <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={mockChartData}>
              <defs>
                <linearGradient id="sent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="opened" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="replied" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--toast-bg)', border: '1px solid var(--toast-border)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'var(--toast-color)', fontWeight: 600 }}
              />
              <Area type="monotone" dataKey="sent" stroke="#0ea5e9" fill="url(#sent)" strokeWidth={2} />
              <Area type="monotone" dataKey="opened" stroke="#22d3ee" fill="url(#opened)" strokeWidth={2} />
              <Area type="monotone" dataKey="replied" stroke="#4ade80" fill="url(#replied)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent leads */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Leads</h2>
            <Link href="/dashboard/leads" className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {leads.map((lead) => (
              <div key={lead.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {lead.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium truncate">{lead.name}</p>
                    <span className={`badge ml-2 flex-shrink-0 ${getStatusColor(lead.status)}`}>
                      {getStatusLabel(lead.status)}
                    </span>
                  </div>
                  <p className="text-xs text-surface-400 truncate">{lead.company} · {formatRelativeTime(lead.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="/dashboard/leads" className="btn-secondary w-full justify-center mt-4 text-sm">
            <Users className="w-3.5 h-3.5" />
            Manage all leads
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, label: 'Generate AI Messages', desc: 'Personalize outreach for all new leads', href: '/dashboard/leads', color: 'from-brand-500 to-cyan-500' },
          { icon: Mail, label: 'Send Campaign', desc: 'Launch your next outreach campaign', href: '/dashboard/campaigns', color: 'from-purple-500 to-pink-500' },
          { icon: Activity, label: 'View Analytics', desc: 'Deep dive into your performance data', href: '/dashboard/analytics', color: 'from-green-500 to-emerald-500' },
        ].map((action) => {
          const Icon = action.icon
          return (
            <Link key={action.label} href={action.href} className="card p-4 flex items-center gap-4 hover:shadow-md transition-all group">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{action.label}</p>
                <p className="text-xs text-surface-400 truncate">{action.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-surface-300 dark:text-surface-600 ml-auto flex-shrink-0 group-hover:text-brand-500 transition-colors" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
