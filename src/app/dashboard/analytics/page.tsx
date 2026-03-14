'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { TrendingUp, Users, Mail, MessageSquare, Calendar, ArrowUpRight } from 'lucide-react'

const emailData = [
  { date: 'Jan 8', sent: 12, opened: 8, replied: 3, meetings: 1 },
  { date: 'Jan 9', sent: 18, opened: 13, replied: 5, meetings: 2 },
  { date: 'Jan 10', sent: 25, opened: 19, replied: 7, meetings: 2 },
  { date: 'Jan 11', sent: 30, opened: 22, replied: 9, meetings: 3 },
  { date: 'Jan 12', sent: 22, opened: 16, replied: 6, meetings: 2 },
  { date: 'Jan 13', sent: 35, opened: 28, replied: 12, meetings: 4 },
  { date: 'Jan 14', sent: 41, opened: 33, replied: 15, meetings: 5 },
  { date: 'Jan 15', sent: 38, opened: 30, replied: 11, meetings: 3 },
  { date: 'Jan 16', sent: 50, opened: 42, replied: 18, meetings: 6 },
  { date: 'Jan 17', sent: 45, opened: 36, replied: 14, meetings: 4 },
  { date: 'Jan 18', sent: 55, opened: 44, replied: 20, meetings: 7 },
  { date: 'Jan 19', sent: 48, opened: 39, replied: 16, meetings: 5 },
  { date: 'Jan 20', sent: 60, opened: 50, replied: 22, meetings: 8 },
  { date: 'Jan 21', sent: 65, opened: 53, replied: 25, meetings: 9 },
]

const statusData = [
  { name: 'New', value: 423, color: '#94a3b8' },
  { name: 'Contacted', value: 687, color: '#0ea5e9' },
  { name: 'Replied', value: 347, color: '#f59e0b' },
  { name: 'Meeting Booked', value: 89, color: '#22c55e' },
  { name: 'Closed', value: 156, color: '#a855f7' },
  { name: 'Unqualified', value: 145, color: '#f87171' },
]

const campaignPerf = [
  { name: 'SaaS Founders', sent: 189, replies: 47, meetings: 12 },
  { name: 'Agency DMs', sent: 80, replies: 15, meetings: 4 },
  { name: 'E-commerce', sent: 120, replies: 28, meetings: 8 },
  { name: 'Series A', sent: 95, replies: 19, meetings: 5 },
]

const tooltipStyle = {
  contentStyle: { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12, color: '#f1f5f9' },
  labelStyle: { color: '#94a3b8', fontWeight: 600 },
}

export default function AnalyticsPage() {
  const kpis = [
    { label: 'Total Leads', value: '2,847', change: '+12%', icon: Users, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950' },
    { label: 'Email Open Rate', value: '81%', change: '+5%', icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
    { label: 'Reply Rate', value: '28.8%', change: '+8%', icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
    { label: 'Meeting Conversion', value: '3.1%', change: '+1.2%', icon: Calendar, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
  ]

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">Track your outreach performance and ROI</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map(({ label, value, change, icon: Icon, color, bg }) => (
          <div key={label} className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`${color}`} style={{ width: 18, height: 18 }} />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {change}
              </span>
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-surface-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Email performance */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-semibold">Email Funnel Over Time</h2>
              <p className="text-xs text-surface-400 mt-0.5">Last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              {[
                { color: 'bg-brand-500', label: 'Sent' },
                { color: 'bg-cyan-400', label: 'Opened' },
                { color: 'bg-amber-400', label: 'Replied' },
                { color: 'bg-green-400', label: 'Meetings' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400 hidden sm:flex">
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={emailData}>
              <defs>
                {['sent', 'opened', 'replied', 'meetings'].map((key, i) => {
                  const colors = ['#0ea5e9', '#22d3ee', '#f59e0b', '#4ade80']
                  return (
                    <linearGradient key={key} id={key} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={colors[i]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={colors[i]} stopOpacity={0} />
                    </linearGradient>
                  )
                })}
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={1} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} />
              {[
                { key: 'sent', color: '#0ea5e9' },
                { key: 'opened', color: '#22d3ee' },
                { key: 'replied', color: '#f59e0b' },
                { key: 'meetings', color: '#4ade80' },
              ].map(({ key, color }) => (
                <Area key={key} type="monotone" dataKey={key} stroke={color} fill={`url(#${key})`} strokeWidth={2} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead pipeline */}
        <div className="card p-5">
          <h2 className="font-semibold mb-1">Lead Pipeline</h2>
          <p className="text-xs text-surface-400 mb-4">By status</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" strokeWidth={0}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-surface-600 dark:text-surface-400">{item.name}</span>
                </div>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Campaign performance */}
      <div className="card p-5">
        <h2 className="font-semibold mb-1">Campaign Performance</h2>
        <p className="text-xs text-surface-400 mb-5">Comparing all active campaigns</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={campaignPerf} barGap={4}>
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
            <Bar dataKey="sent" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="Sent" />
            <Bar dataKey="replies" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Replies" />
            <Bar dataKey="meetings" fill="#22c55e" radius={[4, 4, 0, 0]} name="Meetings" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
