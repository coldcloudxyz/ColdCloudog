'use client'

import { useState } from 'react'
import { Mail, Send, Eye, MessageSquare, Search, Filter, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { formatRelativeTime, getStatusColor } from '@/lib/utils'

const mockEmails = [
  { id: '1', to: 'alex@stripe.com', name: 'Alex Johnson', company: 'Stripe', subject: 'Quick idea for Stripe\'s outbound', status: 'replied', sent_at: new Date(Date.now() - 3600000).toISOString(), opened_at: new Date(Date.now() - 3000000).toISOString(), replied_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', to: 'maria@notion.so', name: 'Maria Garcia', company: 'Notion', subject: 'Helping Notion grow faster', status: 'opened', sent_at: new Date(Date.now() - 86400000).toISOString(), opened_at: new Date(Date.now() - 43200000).toISOString() },
  { id: '3', to: 'tom@linear.app', name: 'Tom Lee', company: 'Linear', subject: 'Meeting booked ✓', status: 'sent', sent_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '4', to: 'sarah@figma.com', name: 'Sarah Kim', company: 'Figma', subject: 'Growing Figma\'s pipeline', status: 'sent', sent_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '5', to: 'james@vercel.com', name: 'James Wilson', company: 'Vercel', subject: 'AI-powered sales for Vercel', status: 'replied', sent_at: new Date(Date.now() - 345600000).toISOString(), opened_at: new Date(Date.now() - 300000000).toISOString(), replied_at: new Date(Date.now() - 259200000).toISOString() },
]

const statusInfo = {
  sent: { icon: Send, color: 'text-surface-400', bg: 'bg-surface-100 dark:bg-surface-800', label: 'Sent' },
  opened: { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', label: 'Opened' },
  replied: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950', label: 'Replied' },
}

export default function EmailsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = mockEmails.filter(e => {
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.company.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || e.status === filter
    return matchSearch && matchFilter
  })

  const stats = {
    sent: mockEmails.length,
    opened: mockEmails.filter(e => e.opened_at).length,
    replied: mockEmails.filter(e => e.replied_at).length,
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Email Center</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">Track all outreach emails and engagement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Emails Sent', value: stats.sent, icon: Send, color: 'text-surface-600', bg: 'bg-surface-100 dark:bg-surface-800' },
          { label: 'Opened', value: `${stats.opened} (${Math.round((stats.opened/stats.sent)*100)}%)`, icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' },
          { label: 'Replied', value: `${stats.replied} (${Math.round((stats.replied/stats.sent)*100)}%)`, icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} style={{ width: 18, height: 18 }} />
            </div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs text-surface-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} className="input-base pl-9" placeholder="Search emails..." />
        </div>
        <div className="flex gap-2">
          {['all', 'sent', 'opened', 'replied'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filter === s ? 'bg-brand-600 text-white' : 'btn-secondary'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Email list */}
      <div className="card overflow-hidden">
        <div className="divide-y divide-surface-50 dark:divide-surface-800">
          {filtered.map((email) => {
            const info = statusInfo[email.status as keyof typeof statusInfo] || statusInfo.sent
            const Icon = info.icon
            return (
              <div key={email.id} className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {email.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{email.name}</span>
                      <span className="text-surface-400 text-xs">·</span>
                      <span className="text-surface-400 text-xs">{email.company}</span>
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400 truncate">{email.subject}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-surface-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(email.sent_at)}
                      </span>
                      {email.opened_at && (
                        <span className="text-xs text-blue-600 flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          Opened {formatRelativeTime(email.opened_at)}
                        </span>
                      )}
                      {email.replied_at && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Replied {formatRelativeTime(email.replied_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${info.bg} ${info.color} flex-shrink-0`}>
                    <Icon className="w-3 h-3" />
                    {info.label}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
