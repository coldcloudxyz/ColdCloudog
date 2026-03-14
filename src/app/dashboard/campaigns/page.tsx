'use client'

import { useState, useEffect } from 'react'
import {
  Megaphone, Plus, Play, Pause, BarChart3, Users, Mail,
  Calendar, Loader2, X, Zap, RefreshCw
} from 'lucide-react'
import { cn, getStatusColor, formatRelativeTime } from '@/lib/utils'
import type { Campaign } from '@/types'
import toast from 'react-hot-toast'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadCampaigns() }, [])

  const loadCampaigns = async () => {
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

  const toggleStatus = async (campaign: Campaign) => {
    const next = campaign.status === 'active' ? 'paused' : 'active'
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: next }),
      })
      if (!res.ok) throw new Error('Update failed')
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: next as any } : c))
      toast.success(next === 'active' ? 'Campaign resumed' : 'Campaign paused')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const launchCampaign = async (campaign: Campaign) => {
    try {
      const res = await fetch('/api/campaigns', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: campaign.id, status: 'active' }),
      })
      if (!res.ok) throw new Error('Launch failed')
      setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'active' } : c))
      toast.success('Campaign launched!')
    } catch (e: any) {
      toast.error(e.message)
    }
  }

  const totalLeads = campaigns.reduce((s, c) => s + (c.total_leads || 0), 0)
  const totalSent = campaigns.reduce((s, c) => s + (c.emails_sent || 0), 0)
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
          <button onClick={loadCampaigns} className="btn-ghost text-sm" title="Refresh">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Campaigns', value: activeCampaigns, icon: Zap, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Total Leads', value: totalLeads, icon: Users, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'Emails Sent', value: totalSent, icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Meetings Booked', value: totalMeetings, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
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

      {loading ? (
        <div className="card py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
          <p className="text-surface-400 text-sm">Loading campaigns...</p>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="card py-20 text-center">
          <Megaphone className="w-12 h-12 mx-auto mb-4 text-surface-300 dark:text-surface-600" />
          <p className="font-semibold text-lg mb-2">No campaigns yet</p>
          <p className="text-surface-400 text-sm mb-6">Create your first campaign to start sending outreach at scale.</p>
          <button onClick={() => setShowCreate(true)} className="btn-primary mx-auto">
            <Plus className="w-4 h-4" /> Create Campaign
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map(campaign => {
            const convRate = (campaign.total_leads || 0) > 0
              ? (((campaign.meetings_booked || 0) / campaign.total_leads) * 100).toFixed(1)
              : '0'
            const replyRate = (campaign.emails_sent || 0) > 0
              ? (((campaign.replies || 0) / campaign.emails_sent) * 100).toFixed(1)
              : '0'

            return (
              <div key={campaign.id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg leading-tight">{campaign.name}</h3>
                      <span className={`badge flex-shrink-0 ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">{campaign.description}</p>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Leads', value: campaign.total_leads || 0 },
                        { label: 'Sent', value: campaign.emails_sent || 0 },
                        { label: 'Replies', value: `${campaign.replies || 0} (${replyRate}%)` },
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
                          <span>{Math.round(((campaign.emails_sent || 0) / campaign.total_leads) * 100)}% sent</span>
                        </div>
                        <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full transition-all"
                            style={{ width: `${Math.min(((campaign.emails_sent || 0) / campaign.total_leads) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-surface-400 mt-3">Created {formatRelativeTime(campaign.created_at)}</p>
                  </div>

                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {campaign.status === 'draft' ? (
                      <button onClick={() => launchCampaign(campaign)} className="btn-primary text-sm">
                        <Play className="w-4 h-4" /> Launch
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleStatus(campaign)}
                        className={cn('btn-secondary text-sm', campaign.status === 'active' ? 'text-amber-600' : 'text-green-600')}
                      >
                        {campaign.status === 'active'
                          ? <><Pause className="w-4 h-4" /> Pause</>
                          : <><Play className="w-4 h-4" /> Resume</>}
                      </button>
                    )}
                    <button className="btn-ghost text-sm">
                      <BarChart3 className="w-4 h-4" /> Details
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreate={c => { setCampaigns(prev => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

function CreateCampaignModal({ onClose, onCreate }: {
  onClose: () => void
  onCreate: (c: Campaign) => void
}) {
  const [form, setForm] = useState({ name: '', description: '', calendly_link: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          calendly_link: form.calendly_link || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign')
      onCreate(data.campaign)
      toast.success('Campaign created!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">New Campaign</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Campaign Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="input-base"
              placeholder="SaaS Founders Q1 2025"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="input-base min-h-[80px] resize-none"
              placeholder="Target audience and goals..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Calendly Link</label>
            <input
              value={form.calendly_link}
              onChange={e => setForm(f => ({ ...f, calendly_link: e.target.value }))}
              className="input-base"
              placeholder="https://calendly.com/yourname/30min"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}