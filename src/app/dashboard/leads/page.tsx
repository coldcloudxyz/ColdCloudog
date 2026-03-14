'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, Plus, Upload, Search, Filter, Sparkles, Mail,
  ExternalLink, Trash2, Edit, Loader2, ChevronDown, X, Calendar
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { cn, getStatusColor, getStatusLabel, formatRelativeTime } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'

const statusOptions: LeadStatus[] = ['new', 'contacted', 'replied', 'meeting_booked', 'closed', 'unqualified']

const mockLeads: Lead[] = [
  { id: '1', user_id: 'demo', name: 'Alex Johnson', company: 'Stripe', email: 'alex@stripe.com', website: 'https://stripe.com', linkedin: 'linkedin.com/in/alexj', status: 'replied', created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date().toISOString() },
  { id: '2', user_id: 'demo', name: 'Maria Garcia', company: 'Notion', email: 'maria@notion.so', website: 'https://notion.so', status: 'contacted', created_at: new Date(Date.now() - 7200000).toISOString(), updated_at: new Date().toISOString() },
  { id: '3', user_id: 'demo', name: 'Tom Lee', company: 'Linear', email: 'tom@linear.app', website: 'https://linear.app', status: 'meeting_booked', created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
  { id: '4', user_id: 'demo', name: 'Sarah Kim', company: 'Figma', email: 'sarah@figma.com', website: 'https://figma.com', status: 'new', created_at: new Date(Date.now() - 172800000).toISOString(), updated_at: new Date().toISOString() },
  { id: '5', user_id: 'demo', name: 'James Wilson', company: 'Vercel', email: 'james@vercel.com', website: 'https://vercel.com', status: 'new', created_at: new Date(Date.now() - 259200000).toISOString(), updated_at: new Date().toISOString() },
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showLeadDetail, setShowLeadDetail] = useState<Lead | null>(null)
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async () => {
    try {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      if (data && data.length > 0) setLeads(data)
    } catch (e) {
      // use mock
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch = !search || 
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchSearch && matchStatus
  })

  const generateMessage = async (lead: Lead) => {
    setGeneratingMessage(lead.id)
    try {
      const res = await fetch('/api/messages/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, website: lead.website, company: lead.company, name: lead.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, personalized_message: data.message } : l))
      if (showLeadDetail?.id === lead.id) setShowLeadDetail(d => d ? { ...d, personalized_message: data.message } : d)
      toast.success('AI message generated!')
    } catch (e: any) {
      // Demo fallback
      const demoMessage = `Hi ${lead.name},\n\nI noticed that ${lead.company} is doing impressive work in your space. The way you're approaching [specific insight from their website] really caught my attention.\n\nWe help companies like ${lead.company} automate their outbound sales process with AI-powered personalization, typically helping teams book 3x more meetings with the same effort.\n\nWould it make sense to connect for a quick 15-minute call to see if there's a fit?\n\nBest,\n[Your name]`
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, personalized_message: demoMessage } : l))
      if (showLeadDetail?.id === lead.id) setShowLeadDetail(d => d ? { ...d, personalized_message: demoMessage } : d)
      toast.success('Demo message generated!')
    } finally {
      setGeneratingMessage(null)
    }
  }

  const sendEmail = async (lead: Lead) => {
    if (!lead.personalized_message) {
      toast.error('Generate a message first!')
      return
    }
    setSendingEmail(lead.id)
    try {
      const res = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, email: lead.email, name: lead.name, message: lead.personalized_message }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', email_sent_at: new Date().toISOString() } : l))
      toast.success(`Email sent to ${lead.name}!`)
    } catch (e: any) {
      // Demo mode
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted', email_sent_at: new Date().toISOString() } : l))
      toast.success(`Demo: Email sent to ${lead.name}!`)
    } finally {
      setSendingEmail(null)
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      await supabase.from('leads').delete().eq('id', id)
    } catch (e) {}
    setLeads(prev => prev.filter(l => l.id !== id))
    toast.success('Lead deleted')
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">{leads.length} total leads</p>
        </div>
        <div className="flex items-center gap-3">
          <CSVUploader onImport={(newLeads) => setLeads(prev => [...newLeads, ...prev])} />
          <button onClick={() => setShowAddModal(true)} className="btn-primary text-sm">
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-base pl-9"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="input-base w-auto"
        >
          <option value="all">All statuses</option>
          {statusOptions.map(s => <option key={s} value={s}>{getStatusLabel(s)}</option>)}
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {['all', ...statusOptions].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0',
              statusFilter === s
                ? 'bg-brand-600 text-white'
                : 'text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800'
            )}
          >
            {s === 'all' ? 'All' : getStatusLabel(s)}
            <span className="ml-1.5 text-xs opacity-70">
              {s === 'all' ? leads.length : leads.filter(l => l.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100 dark:border-surface-800">
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Lead</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden lg:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider hidden sm:table-cell">Added</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-surface-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-surface-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No leads found</p>
                    <p className="text-sm mt-1">Add leads manually or upload a CSV file</p>
                  </td>
                </tr>
              ) : filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  className="table-row-hover"
                  onClick={() => setShowLeadDetail(lead)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {lead.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{lead.name}</p>
                        <p className="text-xs text-surface-400 md:hidden">{lead.company}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-surface-700 dark:text-surface-300">{lead.company}</span>
                      {lead.website && (
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-surface-400 hover:text-brand-500">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-surface-500">{lead.email}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${getStatusColor(lead.status)}`}>{getStatusLabel(lead.status)}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell text-xs text-surface-400">{formatRelativeTime(lead.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => generateMessage(lead)}
                        disabled={generatingMessage === lead.id}
                        className="btn-ghost py-1.5 px-2 text-xs text-brand-600 dark:text-brand-400"
                        title="Generate AI message"
                      >
                        {generatingMessage === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => sendEmail(lead)}
                        disabled={sendingEmail === lead.id}
                        className="btn-ghost py-1.5 px-2 text-xs text-green-600 dark:text-green-400"
                        title="Send email"
                      >
                        {sendingEmail === lead.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteLead(lead.id)}
                        className="btn-ghost py-1.5 px-2 text-xs text-red-500"
                        title="Delete lead"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={(lead) => {
            setLeads(prev => [lead, ...prev])
            setShowAddModal(false)
          }}
        />
      )}

      {showLeadDetail && (
        <LeadDetailModal
          lead={showLeadDetail}
          onClose={() => setShowLeadDetail(null)}
          onGenerateMessage={() => generateMessage(showLeadDetail)}
          onSendEmail={() => sendEmail(showLeadDetail)}
          generating={generatingMessage === showLeadDetail.id}
          sending={sendingEmail === showLeadDetail.id}
        />
      )}
    </div>
  )
}

function CSVUploader({ onImport }: { onImport: (leads: Lead[]) => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback((files: File[]) => {
    if (!files[0]) return
    setUploading(true)
    Papa.parse(files[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const leads = results.data.map((row: any, i: number) => ({
          id: `csv-${Date.now()}-${i}`,
          user_id: 'demo',
          name: row.name || row.Name || row.full_name || '',
          company: row.company || row.Company || '',
          email: row.email || row.Email || '',
          website: row.website || row.Website || '',
          linkedin: row.linkedin || row.LinkedIn || '',
          status: 'new' as LeadStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })).filter((l: Lead) => l.email)
        onImport(leads)
        toast.success(`Imported ${leads.length} leads!`)
        setUploading(false)
      },
      error: () => {
        toast.error('Failed to parse CSV')
        setUploading(false)
      }
    })
  }, [onImport])

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <button className="btn-secondary text-sm" disabled={uploading}>
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        {uploading ? 'Importing...' : 'Import CSV'}
      </button>
    </div>
  )
}

function AddLeadModal({ onClose, onAdd }: { onClose: () => void; onAdd: (lead: Lead) => void }) {
  const [form, setForm] = useState({ name: '', company: '', email: '', website: '', linkedin: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data, error } = await supabase.from('leads').insert([{ ...form, status: 'new' }]).select().single()
      if (error) throw error
      onAdd(data)
      toast.success('Lead added!')
    } catch (e) {
      const lead: Lead = {
        id: `local-${Date.now()}`,
        user_id: 'demo',
        ...form,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      onAdd(lead)
      toast.success('Lead added!')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Add Lead</h2>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name', label: 'Full Name', placeholder: 'Alex Johnson', required: true },
            { key: 'company', label: 'Company', placeholder: 'Acme Inc.', required: true },
            { key: 'email', label: 'Email', placeholder: 'alex@acme.com', required: true },
            { key: 'website', label: 'Website', placeholder: 'https://acme.com' },
            { key: 'linkedin', label: 'LinkedIn', placeholder: 'linkedin.com/in/alexj' },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input
                type={key === 'email' ? 'email' : 'text'}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-base"
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function LeadDetailModal({ lead, onClose, onGenerateMessage, onSendEmail, generating, sending }: {
  lead: Lead; onClose: () => void; onGenerateMessage: () => void; onSendEmail: () => void; generating: boolean; sending: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card p-6 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white font-bold">
              {lead.name[0]}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{lead.name}</h2>
              <p className="text-surface-400 text-sm">{lead.company} · {lead.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5"><X className="w-4 h-4" /></button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            { label: 'Status', value: <span className={`badge ${getStatusColor(lead.status)}`}>{getStatusLabel(lead.status)}</span> },
            { label: 'Added', value: formatRelativeTime(lead.created_at) },
            { label: 'Website', value: lead.website ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm">{lead.website}</a> : '—' },
            { label: 'LinkedIn', value: lead.linkedin ? <a href={`https://${lead.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline text-sm">{lead.linkedin}</a> : '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
              <p className="text-xs text-surface-400 mb-1">{label}</p>
              <div className="text-sm font-medium">{value}</div>
            </div>
          ))}
        </div>

        {/* AI Message */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">AI Personalized Message</h3>
            <button onClick={onGenerateMessage} disabled={generating} className="btn-secondary text-xs py-1.5">
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {generating ? 'Generating...' : lead.personalized_message ? 'Regenerate' : 'Generate with AI'}
            </button>
          </div>
          {lead.personalized_message ? (
            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-4 text-sm text-surface-700 dark:text-surface-300 whitespace-pre-wrap border border-brand-200 dark:border-brand-800">
              {lead.personalized_message}
            </div>
          ) : (
            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-8 text-center text-surface-400">
              <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Click "Generate with AI" to create a personalized outreach message</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSendEmail}
            disabled={sending || !lead.personalized_message}
            className="btn-primary flex-1 justify-center"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {sending ? 'Sending...' : 'Send Email'}
          </button>
          <button className="btn-secondary flex-1 justify-center">
            <Calendar className="w-4 h-4" />
            Send Calendly Link
          </button>
        </div>
      </div>
    </div>
  )
}
