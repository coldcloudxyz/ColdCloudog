'use client'

import { useEffect, useState } from 'react'
import {
  Mail, Send, Eye, MessageSquare, Search,
  Clock, Loader2, RefreshCw, InboxIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface EmailRecord {
  id: string
  name: string
  email: string
  company: string
  personalized_message: string | null
  status: string
  email_sent_at: string | null
  email_opened_at: string | null
  email_replied_at: string | null
}

const statusConfig = {
  replied: {
    icon: MessageSquare,
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-950',
    label: 'Replied',
  },
  opened: {
    icon: Eye,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950',
    label: 'Opened',
  },
  contacted: {
    icon: Send,
    color: 'text-surface-500 dark:text-surface-400',
    bg: 'bg-surface-100 dark:bg-surface-800',
    label: 'Sent',
  },
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEmails()
  }, [])

  async function loadEmails() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, company, personalized_message, status, email_sent_at, email_opened_at, email_replied_at')
        .not('email_sent_at', 'is', null)
        .order('email_sent_at', { ascending: false })

      if (error) throw error
      setEmails(data ?? [])
    } catch (e: any) {
      console.error('Failed to load emails:', e.message)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  function getDisplayStatus(record: EmailRecord) {
    if (record.email_replied_at) return 'replied'
    if (record.email_opened_at) return 'opened'
    return 'contacted'
  }

  const filtered = emails.filter(e => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.company.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    const displayStatus = getDisplayStatus(e)
    const matchFilter =
      filter === 'all' ||
      (filter === 'sent' && displayStatus === 'contacted') ||
      filter === displayStatus
    return matchSearch && matchFilter
  })

  const totalSent    = emails.length
  const totalOpened  = emails.filter(e => e.email_opened_at).length
  const totalReplied = emails.filter(e => e.email_replied_at).length

  const openRate   = totalSent > 0 ? Math.round((totalOpened  / totalSent) * 100) : 0
  const replyRate  = totalSent > 0 ? Math.round((totalReplied / totalSent) * 100) : 0

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Email Center</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            Track all outreach emails and engagement
          </p>
        </div>
        <button
          onClick={loadEmails}
          className="btn-ghost text-sm"
          title="Refresh"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Emails Sent',
            value: totalSent,
            sub: 'total outreach',
            icon: Send,
            color: 'text-surface-600 dark:text-surface-400',
            bg: 'bg-surface-100 dark:bg-surface-800',
          },
          {
            label: 'Opened',
            value: totalOpened,
            sub: `${openRate}% open rate`,
            icon: Eye,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950',
          },
          {
            label: 'Replied',
            value: totalReplied,
            sub: `${replyRate}% reply rate`,
            icon: MessageSquare,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-950',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 sm:p-5">
            <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={color} style={{ width: 18, height: 18 }} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">{label}</div>
            <div className="text-xs text-surface-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
            placeholder="Search by name, company or email..."
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all',     label: 'All'     },
            { key: 'sent',    label: 'Sent'    },
            { key: 'opened',  label: 'Opened'  },
            { key: 'replied', label: 'Replied' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                filter === key
                  ? 'bg-brand-600 text-white'
                  : 'btn-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
            <p className="text-surface-400 text-sm">Loading email activity...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center text-surface-400">
            <InboxIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">
              {emails.length === 0
                ? 'No emails sent yet'
                : 'No emails match your filter'}
            </p>
            <p className="text-sm mt-1">
              {emails.length === 0
                ? 'Send your first outreach from the Leads page to see activity here'
                : 'Try a different search or filter'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-50 dark:divide-surface-800">
            {filtered.map(record => {
              const displayStatus = getDisplayStatus(record)
              const cfg = statusConfig[displayStatus as keyof typeof statusConfig]
              const Icon = cfg.icon

              return (
                <div
                  key={record.id}
                  className="p-4 hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {record.name[0]?.toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-medium text-sm">{record.name}</span>
                        <span className="text-surface-300 dark:text-surface-600 text-xs">·</span>
                        <span className="text-surface-400 text-xs">{record.company}</span>
                        <span className="text-surface-300 dark:text-surface-600 text-xs">·</span>
                        <span className="text-surface-400 text-xs">{record.email}</span>
                      </div>

                      {/* Message preview */}
                      {record.personalized_message ? (
                        <p className="text-sm text-surface-600 dark:text-surface-400 truncate">
                          {record.personalized_message}
                        </p>
                      ) : (
                        <p className="text-sm text-surface-300 dark:text-surface-600 italic">
                          No message recorded
                        </p>
                      )}

                      {/* Timestamps */}
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                        {record.email_sent_at && (
                          <span className="text-xs text-surface-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Sent {formatRelativeTime(record.email_sent_at)}
                          </span>
                        )}
                        {record.email_opened_at && (
                          <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Opened {formatRelativeTime(record.email_opened_at)}
                          </span>
                        )}
                        {record.email_replied_at && (
                          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Replied {formatRelativeTime(record.email_replied_at)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium flex-shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <Icon className="w-3 h-3" />
                      {cfg.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}