'use client'

import { useEffect, useState } from 'react'
import { Settings, Key, Mail, Calendar, User, Save, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserSettings {
  sender_name:   string
  sender_email:  string
  company_name:  string
  calendly_link: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    sender_name:   '',
    sender_email:  '',
    company_name:  '',
    calendly_link: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  useEffect(() => { loadSettings() }, [])

  async function loadSettings() {
    try {
      const res  = await fetch('/api/settings', { credentials: 'same-origin' })
      const data = await res.json()
      if (data.settings) {
        setSettings({
          sender_name:   data.settings.sender_name   ?? '',
          sender_email:  data.settings.sender_email  ?? '',
          company_name:  data.settings.company_name  ?? '',
          calendly_link: data.settings.calendly_link ?? '',
        })
      }
    } catch (e: any) {
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res  = await fetch('/api/settings', {
        method:      'POST',
        credentials: 'same-origin',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(settings),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      toast.success('Settings saved!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  function field(key: keyof UserSettings) {
    return {
      value:    settings[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setSettings(s => ({ ...s, [key]: e.target.value })),
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
          Configure your ColdCloud account
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* Sender identity */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-800">
            <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
              <User className="text-brand-600 dark:text-brand-400" style={{ width: 18, height: 18 }} />
            </div>
            <h2 className="font-semibold">Sender Identity</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Your Name</label>
              <input {...field('sender_name')} className="input-base" placeholder="Alex Johnson" />
              <p className="text-xs text-surface-400 mt-1">Used as the From name in outreach emails</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Company Name</label>
              <input {...field('company_name')} className="input-base" placeholder="Acme Inc." />
            </div>
          </div>
        </div>

        {/* Email settings */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-800">
            <div className="w-9 h-9 rounded-lg bg-green-50 dark:bg-green-950 flex items-center justify-center">
              <Mail className="text-green-600 dark:text-green-400" style={{ width: 18, height: 18 }} />
            </div>
            <h2 className="font-semibold">Email Settings</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sending Email Address</label>
            <input
              {...field('sender_email')}
              type="email"
              className="input-base"
              placeholder="outreach@yourdomain.com"
            />
            <p className="text-xs text-surface-400 mt-1">
              Must be a verified domain in your Resend account. Use{' '}
              <code className="bg-surface-100 dark:bg-surface-800 px-1 rounded">onboarding@resend.dev</code>{' '}
              for testing.
            </p>
          </div>
        </div>

        {/* Calendly */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-800">
            <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center">
              <Calendar className="text-purple-600 dark:text-purple-400" style={{ width: 18, height: 18 }} />
            </div>
            <h2 className="font-semibold">Meeting Booking</h2>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Calendly Link</label>
            <input
              {...field('calendly_link')}
              className="input-base"
              placeholder="https://calendly.com/yourname/30min"
            />
            <p className="text-xs text-surface-400 mt-1">
              Included when you send Calendly links to leads
            </p>
          </div>
          {settings.calendly_link && (
            <a
              href={settings.calendly_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-600 hover:underline mt-2 block"
            >
              Preview booking page →
            </a>
          )}
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
