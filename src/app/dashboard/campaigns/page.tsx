'use client'

import { useState, useEffect } from 'react'
import {
  Megaphone, Plus, Play, Pause, BarChart3, Users, Mail,
  Calendar, Loader2, Zap, RefreshCw, ArrowRight
} from 'lucide-react'
import Link from 'next/link'
import { cn, getStatusColor, formatRelativeTime } from '@/lib/utils'
import type { Campaign } from '@/types'
import toast from 'react-hot-toast'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns')
      if (!res.ok) throw new Error('Failed to fetch campaigns')
      const data = await res.json()
      setCampaigns(data.campaigns ?? [])
    } catch (e: any) {
      toast.error('Failed to load campaigns: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleStatus(campaign: Campaign) {
    const next = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/campaigns', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: campaign.id, status: next }),
      })
      if (!res.ok) throw new Error('Update failed')
      setCampaigns(prev =>
        prev.map(c => (c.id === campaign.id ? { ...c, status: next as any } : c))
      )
      toast.success(next === 'active' ? 'Campaign resumed' : 'Campaign paused')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  async function launchCampaign(campaign: Campaign) {
    try {
      const res = await fetch('/api/campaigns', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: campaign.id, status: 'active' }),
      })
      if (!res.ok) throw new Error('Launch failed')
      setCampaigns(prev =>
        prev.map(c => (c.id === campaign.id ? { ...c, status: 'active' } : c))
      )
      toast.success('Campaign launched!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const totalLeads    = campaigns.reduce((s, c) => s + (c.total_leads    || 0), 0)
  const totalSent     = campaigns.reduce((s, c) => s + (c.emails_sent    || 0), 0)
  const totalMeetings = campaigns.reduce((s, c) => s + (c.meetings_booked || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            {loading ? 'Loading...' : `${campaigns.length} campaigns`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadCampaigns}
            className="btn-ghost text-sm"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <Link href="/dashboard/campaigns/new" className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Campaigns', value: activeCampaigns, icon: Zap,      color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-950'   },
          { label: 'Total Leads',      value: totalLeads,      icon: Users,     color: 'text-brand-600',  bg: 'bg-brand-50 dark:bg-brand-950'   },
          { label: 'Emails Sent',      value: totalSent,       icon: Mail,      color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Meetings Booked',  value: totalMeetings,   icon: Calendar,  color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-950'   },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={color} style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <div className="text-xl font-bold">{value}</div>
              <div className="text-xs text-surface-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign list */}
      {loading ? (
        <div className="card py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
          <p className="text-surface-400 text-sm">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card py-20 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
          <p className="font-semibold text-lg mb-2">No campaigns yet</p>
          <p className="text-surface-400 text-sm mb-6">
            Create your first AI-powered campaign to start sending outreach at scale.
          </p>
          <Link href="/dashboard/campaigns/new" className="btn-primary inline-flex mx-auto">
            <Plus className="w-4 h-4" />
            Create AI Campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => {
            const convRate  = (campaign.total_leads  || 0) > 0
              ? (((campaign.meetings_booked || 0) / campaign.total_leads)  * 100).toFixed(1)
              : '0'
            const replyRate = (campaign.emails_sent  || 0) > 0
              ? (((campaign.replies         || 0) / campaign.emails_sent)  * 100).toFixed(1)
              : '0'

            return (
              <div key={campaign.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg leading-tight">
                        {campaign.name}
                      </h3>
                      <span className={`badge flex-shrink-0 ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                      {(campaign as any).campaign_goal && (
                        <span className="badge flex-shrink-0 bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 text-xs">
                          {GOAL_LABELS[(campaign as any).campaign_goal] ?? (campaign as any).campaign_goal}
                        </span>
                      )}
                    </div>

                    {campaign.description && (
                      <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">
                        {campaign.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Leads',    value: campaign.total_leads    || 0 },
                        { label: 'Sent',     value: campaign.emails_sent    || 0 },
                        { label: 'Replies',  value: `${campaign.replies || 0} (${replyRate}%)` },
                        { label: 'Meetings', value: `${campaign.meetings_booked || 0} (${convRate}%)` },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                          <div className="text-xs text-surface-400 mb-1">{label}</div>
                          <div className="font-semibold text-sm">{value}</div>
                        </div>
                      ))}
                    </div>

                    {(campaign.total_leads || 0) > 0 && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-surface-400 mb-1">
                          <span>Progress</span>
                          <span>
                            {Math.round(
                              ((campaign.emails_sent || 0) / campaign.total_leads) * 100
                            )}% sent
                          </span>
                        </div>
                        <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                ((campaign.emails_sent || 0) / campaign.total_leads) * 100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-surface-400 mt-3">
                      Created {formatRelativeTime(campaign.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {campaign.status === 'draft' ? (
                      <button
                        onClick={() => launchCampaign(campaign)}
                        className="btn-primary text-sm"
                      >
                        <Play className="w-4 h-4" /> Launch
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus(campaign)}
                        className={cn(
                          'btn-secondary text-sm',
                          campaign.status === 'active'
                            ? 'text-amber-600'
                            : 'text-green-600'
                        )}
                      >
                        {campaign.status === 'active' ? (
                          <><Pause className="w-4 h-4" /> Pause</>
                        ) : (
                          <><Play className="w-4 h-4" /> Resume</>
                        )}
                      </button>
                    )}
                    <Link
                      href={`/dashboard/campaigns/${campaign.id}`}
                      className="btn-ghost text-sm"
                    >
                      <BarChart3 className="w-4 h-4" /> Details
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

const GOAL_LABELS: Record<string, string> = {
  promotion:   'Promotion',
  meeting:     'Meeting',
  followup:    'Follow-up',
  partnership: 'Partnership',
  hiring:      'Hiring',
}