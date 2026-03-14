'use client'

import { useState } from 'react'
import {
  Megaphone, Plus, Play, Pause, BarChart3, Users, Mail,
  Calendar, ChevronRight, Loader2, X, Zap, Clock
} from 'lucide-react'
import Link from 'next/link'
import { cn, getStatusColor, formatRelativeTime } from '@/lib/utils'
import type { Campaign } from '@/types'
import toast from 'react-hot-toast'

const mockCampaigns: Campaign[] = [
  {
    id: '1', user_id: 'demo', name: 'SaaS Founders Outreach Q1',
    description: 'Targeting early-stage SaaS founders who raised seed recently',
    status: 'active', total_leads: 245, emails_sent: 189, replies: 47, meetings_booked: 12,
    calendly_link: 'https://calendly.com/demo/30min',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2', user_id: 'demo', name: 'Agency Decision Makers',
    description: 'Marketing agencies with 10-50 employees in North America',
    status: 'paused', total_leads: 120, emails_sent: 80, replies: 15, meetings_booked: 4,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3', user_id: 'demo', name: 'Series A Companies',
    description: 'Companies that raised Series A in past 6 months',
    status: 'draft', total_leads: 0, emails_sent: 0, replies: 0, meetings_booked: 0,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [showCreate, setShowCreate] = useState(false)

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id !== id) return c
      const next = c.status === 'active' ? 'paused' : 'active'
      toast.success(next === 'active' ? 'Campaign resumed' : 'Campaign paused')
      return { ...c, status: next as any }
    }))
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">Manage your outreach campaigns</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Campaigns', value: campaigns.filter(c => c.status === 'active').length, icon: Zap, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
          { label: 'Total Leads', value: campaigns.reduce((s, c) => s + c.total_leads, 0), icon: Users, color: 'text-brand-600', bg: 'bg-brand-50 dark:bg-brand-950' },
          { label: 'Emails Sent', value: campaigns.reduce((s, c) => s + c.emails_sent, 0), icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950' },
          { label: 'Meetings Booked', value: campaigns.reduce((s, c) => s + c.meetings_booked, 0), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${stat.bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${stat.color}`} style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-surface-400">{stat.label}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Campaign cards */}
      <div className="space-y-4">
        {campaigns.map((campaign) => {
          const convRate = campaign.total_leads > 0 ? ((campaign.meetings_booked / campaign.total_leads) * 100).toFixed(1) : '0'
          const replyRate = campaign.emails_sent > 0 ? ((campaign.replies / campaign.emails_sent) * 100).toFixed(1) : '0'

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

                  {/* Metrics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Leads', value: campaign.total_leads, icon: Users },
                      { label: 'Sent', value: campaign.emails_sent, icon: Mail },
                      { label: 'Replies', value: `${campaign.replies} (${replyRate}%)`, icon: BarChart3 },
                      { label: 'Meetings', value: `${campaign.meetings_booked} (${convRate}%)`, icon: Calendar },
                    ].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
                        <div className="text-xs text-surface-400 mb-1">{label}</div>
                        <div className="font-semibold text-sm">{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  {campaign.total_leads > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-surface-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round((campaign.emails_sent / campaign.total_leads) * 100)}% sent</span>
                      </div>
                      <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-cyan-500 rounded-full transition-all"
                          style={{ width: `${(campaign.emails_sent / campaign.total_leads) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col gap-2 flex-shrink-0">
                  {campaign.status !== 'draft' && (
                    <button
                      onClick={() => toggleStatus(campaign.id)}
                      className={cn('btn-secondary text-sm', campaign.status === 'active' ? 'text-amber-600' : 'text-green-600')}
                    >
                      {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {campaign.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                  )}
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => toggleStatus(campaign.id)}
                      className="btn-primary text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Launch
                    </button>
                  )}
                  <Link href={`/dashboard/campaigns/${campaign.id}`} className="btn-ghost text-sm">
                    <BarChart3 className="w-4 h-4" />
                    Details
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onCreate={(c) => { setCampaigns(prev => [c, ...prev]); setShowCreate(false) }}
        />
      )}
    </div>
  )
}

function CreateCampaignModal({ onClose, onCreate }: { onClose: () => void; onCreate: (c: Campaign) => void }) {
  const [form, setForm] = useState({ name: '', description: '', calendly_link: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    const campaign: Campaign = {
      id: `local-${Date.now()}`,
      user_id: 'demo',
      ...form,
      status: 'draft',
      total_leads: 0, emails_sent: 0, replies: 0, meetings_booked: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    onCreate(campaign)
    toast.success('Campaign created!')
    setSaving(false)
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
            <label className="block text-sm font-medium mb-1.5">Campaign Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="SaaS Founders Q1 2025" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="input-base min-h-[80px] resize-none" placeholder="Describe your target audience and goals..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Calendly Link (optional)</label>
            <input value={form.calendly_link} onChange={e => setForm(f => ({ ...f, calendly_link: e.target.value }))} className="input-base" placeholder="https://calendly.com/yourname/30min" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
