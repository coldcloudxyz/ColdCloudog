'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Users, Plus, Upload, Search, Sparkles, Mail,
  ExternalLink, Trash2, Loader2, X, Calendar, RefreshCw, PenLine
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import toast from 'react-hot-toast'
import { cn, getStatusColor, getStatusLabel, formatRelativeTime } from '@/lib/utils'
import type { Lead, LeadStatus } from '@/types'

const statusOptions: LeadStatus[] = [
  'new', 'contacted', 'replied', 'meeting_booked', 'closed', 'unqualified',
]

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function LeadsPage() {
  const [leads,            setLeads]            = useState<Lead[]>([])
  const [loading,          setLoading]          = useState(true)
  const [search,           setSearch]           = useState('')
  const [statusFilter,     setStatusFilter]     = useState<string>('all')
  const [showAddModal,     setShowAddModal]     = useState(false)
  const [showLeadDetail,   setShowLeadDetail]   = useState<Lead | null>(null)
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(null)
  const [sendingEmail,     setSendingEmail]     = useState<string | null>(null)

  useEffect(() => { loadLeads() }, [])

  // ── All data fetching goes through API routes ──────────────
  // The API routes use createRouteHandlerClient which reads the
  // session cookie and passes the JWT to Supabase automatically.
  // RLS then filters rows to the logged-in user only.

  async function loadLeads() {
    setLoading(true)
    try {
      const res = await fetch('/api/leads', {
        // Include cookies so the API route can read the session
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Failed to fetch leads')
      }
      const data = await res.json()
      setLeads(data.leads ?? [])
    } catch (e: any) {
      toast.error('Failed to load leads: ' + e.message)
    } finally {
      setLoading(false)
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchSearch =
      !search ||
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()) ||
      lead.email.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || lead.status === statusFilter
    return matchSearch && matchStatus
  })

  async function generateMessage(lead: Lead) {
    setGeneratingMessage(lead.id)
    try {
      const res = await fetch('/api/messages/generate', {
        method:      'POST',
        credentials: 'same-origin',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId:  lead.id,
          website: lead.website,
          company: lead.company,
          name:    lead.name,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Generation failed')

      const updated = { ...lead, personalized_message: data.message }
      setLeads(prev => prev.map(l => (l.id === lead.id ? updated : l)))
      if (showLeadDetail?.id === lead.id) setShowLeadDetail(updated)
      toast.success('AI message generated!')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to generate — you can type manually.')
    } finally {
      setGeneratingMessage(null)
    }
  }

  async function sendEmail(lead: Lead) {
    if (!lead.personalized_message?.trim()) {
      toast.error('Write or generate a message first.')
      return
    }
    setSendingEmail(lead.id)
    try {
      const res = await fetch('/api/emails/send', {
        method:      'POST',
        credentials: 'same-origin',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId:  lead.id,
          email:   lead.email,
          name:    lead.name,
          message: lead.personalized_message,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Send failed')

      const updated: Lead = {
        ...lead,
        status:        'contacted' as LeadStatus,
        email_sent_at: new Date().toISOString(),
      }
      setLeads(prev => prev.map(l => (l.id === lead.id ? updated : l)))
      if (showLeadDetail?.id === lead.id) setShowLeadDetail(updated)
      toast.success(`Email sent to ${lead.name}!`)
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to send email')
    } finally {
      setSendingEmail(null)
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Delete this lead?')) return
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method:      'DELETE',
        credentials: 'same-origin',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Delete failed')
      }
      setLeads(prev => prev.filter(l => l.id !== id))
      if (showLeadDetail?.id === id) setShowLeadDetail(null)
      toast.success('Lead deleted')
    } catch (e: any) {
      toast.error('Delete failed: ' + e.message)
    }
  }

  async function handleCSVImport(rows: any[]) {
    try {
      const res = await fetch('/api/leads', {
        method:      'POST',
        credentials: 'same-origin',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setLeads(prev => [...(data.leads ?? []), ...prev])
      toast.success(`Imported ${data.leads?.length} leads!`)
    } catch (e: any) {
      toast.error('Import failed: ' + e.message)
    }
  }

  function handleMessageChange(leadId: string, message: string) {
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, personalized_message: message } : l))
    )
    if (showLeadDetail?.id === leadId) {
      setShowLeadDetail(prev =>
        prev ? { ...prev, personalized_message: message } : prev
      )
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
            {loading ? 'Loading...' : `${leads.length} total leads`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLeads}
            className="btn-ghost text-sm"
            title="Refresh"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <CSVUploader onImport={handleCSVImport} />
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
        {(['all', ...statusOptions] as string[]).map(s => (
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
              {s === 'all'
                ? leads.length
                : leads.filter(l => l.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
        <input
          type="text"
          placeholder="Search leads..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base pl-9"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500 mb-3" />
            <p className="text-surface-400 text-sm">Loading your leads...</p>
          </div>
        ) : (
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
                      <p className="font-medium">
                        {leads.length === 0 ? 'No leads yet' : 'No leads match filters'}
                      </p>
                      <p className="text-sm mt-1">
                        {leads.length === 0
                          ? 'Add a lead or upload a CSV to get started'
                          : 'Try a different search or status filter'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map(lead => (
                    <tr
                      key={lead.id}
                      className="table-row-hover"
                      onClick={() => setShowLeadDetail(lead)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {lead.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{lead.name}</p>
                            <p className="text-xs text-surface-400 md:hidden">{lead.company}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{lead.company}</span>
                          {lead.website && (
                            <a
                              href={lead.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-surface-400 hover:text-brand-500"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-sm text-surface-500">
                        {lead.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusColor(lead.status)}`}>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs text-surface-400">
                        {formatRelativeTime(lead.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-1"
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            onClick={() => generateMessage(lead)}
                            disabled={generatingMessage === lead.id}
                            className="btn-ghost py-1.5 px-2 text-xs text-brand-600 dark:text-brand-400"
                            title="Generate AI message"
                          >
                            {generatingMessage === lead.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Sparkles className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => sendEmail(lead)}
                            disabled={
                              sendingEmail === lead.id ||
                              !lead.personalized_message?.trim()
                            }
                            className={cn(
                              'btn-ghost py-1.5 px-2 text-xs',
                              lead.personalized_message?.trim()
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-surface-300 cursor-not-allowed'
                            )}
                            title={
                              lead.personalized_message?.trim()
                                ? 'Send email'
                                : 'Write or generate a message first'
                            }
                          >
                            {sendingEmail === lead.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Mail className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => deleteLead(lead.id)}
                            className="btn-ghost py-1.5 px-2 text-xs text-red-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLeadModal
          onClose={() => setShowAddModal(false)}
          onAdd={lead => {
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
          onMessageChange={msg => handleMessageChange(showLeadDetail.id, msg)}
          generating={generatingMessage === showLeadDetail.id}
          sending={sendingEmail === showLeadDetail.id}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// CSV UPLOADER
// ─────────────────────────────────────────────

function CSVUploader({ onImport }: { onImport: (rows: any[]) => void }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(
    (files: File[]) => {
      if (!files[0]) return
      setUploading(true)
      Papa.parse(files[0], {
        header:         true,
        skipEmptyLines: true,
        complete: results => {
          const rows = (results.data as any[])
            .map(row => ({
              name:     row.name     || row.Name     || row.full_name || '',
              company:  row.company  || row.Company  || '',
              email:    row.email    || row.Email    || '',
              website:  row.website  || row.Website  || null,
              linkedin: row.linkedin || row.LinkedIn || null,
              status:   'new' as LeadStatus,
            }))
            .filter(r => r.name && r.email)
          if (rows.length === 0) {
            toast.error('No valid rows. CSV needs name + email columns.')
          } else {
            onImport(rows)
          }
          setUploading(false)
        },
        error: () => {
          toast.error('Failed to parse CSV')
          setUploading(false)
        },
      })
    },
    [onImport]
  )

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept:   { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <button className="btn-secondary text-sm" disabled={uploading}>
        {uploading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Upload className="w-4 h-4" />}
        {uploading ? 'Importing...' : 'Import CSV'}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// ADD LEAD MODAL
// ─────────────────────────────────────────────

function AddLeadModal({
  onClose,
  onAdd,
}: {
  onClose: () => void
  onAdd:   (lead: Lead) => void
}) {
  const [form, setForm] = useState({
    name: '', company: '', email: '', website: '', linkedin: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/leads', {
        method:      'POST',
        credentials: 'same-origin',
        headers:     { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     form.name,
          company:  form.company,
          email:    form.email,
          website:  form.website  || null,
          linkedin: form.linkedin || null,
          status:   'new',
          // user_id is added by the API route — never send it from the frontend
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to add lead')
      onAdd(data.leads[0])
      toast.success('Lead added!')
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
          <h2 className="font-bold text-lg">Add Lead</h2>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { key: 'name',     label: 'Full Name',    placeholder: 'Alex Johnson',                required: true               },
            { key: 'company',  label: 'Company',      placeholder: 'Acme Inc.',                  required: true               },
            { key: 'email',    label: 'Email',        placeholder: 'alex@acme.com',              required: true, type: 'email' },
            { key: 'website',  label: 'Website',      placeholder: 'https://acme.com',           required: false              },
            { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/in/...', required: false              },
          ].map(({ key, label, placeholder, required, type }) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1.5">{label}</label>
              <input
                type={type ?? 'text'}
                value={(form as any)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="input-base"
                placeholder={placeholder}
                required={required}
              />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Plus className="w-4 h-4" />}
              {saving ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// LEAD DETAIL MODAL
// ─────────────────────────────────────────────

function LeadDetailModal({
  lead,
  onClose,
  onGenerateMessage,
  onSendEmail,
  onMessageChange,
  generating,
  sending,
}: {
  lead:              Lead
  onClose:           () => void
  onGenerateMessage: () => void
  onSendEmail:       () => void
  onMessageChange:   (msg: string) => void
  generating:        boolean
  sending:           boolean
}) {
  const hasMessage = !!lead.personalized_message?.trim()

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative card p-6 w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white font-bold">
              {lead.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">{lead.name}</h2>
              <p className="text-surface-400 text-sm">{lead.company} · {lead.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {[
            {
              label: 'Status',
              value: (
                <span className={`badge ${getStatusColor(lead.status)}`}>
                  {getStatusLabel(lead.status)}
                </span>
              ),
            },
            {
              label: 'Added',
              value: formatRelativeTime(lead.created_at),
            },
            {
              label: 'Website',
              value: lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 hover:underline text-sm truncate block"
                >
                  {lead.website}
                </a>
              ) : (
                <span className="text-surface-400 text-sm">—</span>
              ),
            },
            {
              label: 'Email Sent',
              value: lead.email_sent_at ? (
                <span className="text-green-600 text-sm">
                  {formatRelativeTime(lead.email_sent_at)}
                </span>
              ) : (
                <span className="text-surface-400 text-sm">Not yet</span>
              ),
            },
          ].map(({ label, value }) => (
            <div key={label} className="bg-surface-50 dark:bg-surface-800 rounded-lg p-3">
              <p className="text-xs text-surface-400 mb-1">{label}</p>
              <div className="text-sm font-medium">{value}</div>
            </div>
          ))}
        </div>

        {/* Message section */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">Outreach Message</h3>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                hasMessage
                  ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
              )}>
                {hasMessage ? 'Ready' : 'Empty'}
              </span>
            </div>
            <button
              onClick={onGenerateMessage}
              disabled={generating}
              className="btn-secondary text-xs py-1.5"
            >
              {generating
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Sparkles className="w-3.5 h-3.5" />}
              {generating
                ? 'Generating...'
                : hasMessage ? 'Regenerate with AI' : 'Generate with AI'}
            </button>
          </div>

          {generating ? (
            <div className="bg-surface-50 dark:bg-surface-800 rounded-lg p-8 text-center border border-surface-200 dark:border-surface-700">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-brand-500 mb-2" />
              <p className="text-sm text-surface-400">
                {lead.website
                  ? `Reading ${lead.company}'s website...`
                  : 'Writing your message...'}
              </p>
              <p className="text-xs text-surface-300 dark:text-surface-600 mt-1">
                This takes 5–10 seconds
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={lead.personalized_message ?? ''}
                onChange={e => onMessageChange(e.target.value)}
                rows={10}
                placeholder={
                  `Write your message to ${lead.name} here, or click "Generate with AI" to create one automatically.\n\nTip: mention something specific about ${lead.company} to boost reply rates.`
                }
                className={cn(
                  'input-base resize-none text-sm leading-relaxed font-normal',
                  hasMessage
                    ? 'border-brand-200 dark:border-brand-800'
                    : 'border-surface-200 dark:border-surface-700'
                )}
              />
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs text-surface-400 flex items-center gap-1">
                  <PenLine className="w-3 h-3" />
                  You can edit this message before sending
                </p>
                <p className="text-xs text-surface-400">
                  {lead.personalized_message?.length ?? 0} chars
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onSendEmail}
            disabled={sending || !hasMessage || !!lead.email_sent_at}
            className={cn(
              'flex-1 justify-center btn-primary',
              (!hasMessage || !!lead.email_sent_at) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {sending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Mail className="w-4 h-4" />}
            {sending
              ? 'Sending...'
              : lead.email_sent_at ? 'Already Sent ✓' : 'Send Email'}
          </button>
          <button className="btn-secondary flex-1 justify-center">
            <Calendar className="w-4 h-4" />
            Send Calendly Link
          </button>
        </div>

        {!hasMessage && !generating && (
          <p className="text-xs text-center text-surface-400 mt-3">
            Type a message above or click{' '}
            <span className="text-brand-500 font-medium">Generate with AI</span>{' '}
            to get started
          </p>
        )}
      </div>
    </div>
  )
}