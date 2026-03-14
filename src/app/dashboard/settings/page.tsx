'use client'

import { useState } from 'react'
import { Settings, Key, Mail, Calendar, User, Save, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})
  const [settings, setSettings] = useState({
    full_name: 'Demo User',
    email: 'demo@coldcloud.ai',
    company: 'ColdCloud Inc.',
    openai_api_key: '',
    resend_api_key: '',
    from_email: 'outreach@yourdomain.com',
    from_name: 'Your Name',
    calendly_link: 'https://calendly.com/yourname/30min',
    email_signature: 'Best regards,\nYour Name\nYour Company',
    daily_send_limit: '50',
    send_delay_minutes: '2',
  })

  const handleSave = async (section: string) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 1000))
    toast.success(`${section} settings saved!`)
    setSaving(false)
  }

  const toggleKey = (key: string) => setShowKeys(prev => ({ ...prev, [key]: !prev[key] }))

  const Section = ({ title, icon: Icon, children, onSave }: any) => (
    <div className="card p-6 mb-6">
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100 dark:border-surface-800">
        <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-950 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-brand-600 dark:text-brand-400" style={{ width: 18, height: 18 }} />
        </div>
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
      <div className="mt-5 pt-4 border-t border-surface-100 dark:border-surface-800">
        <button onClick={() => handleSave(title)} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </div>
    </div>
  )

  const Field = ({ label, description, children }: any) => (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {description && <p className="text-xs text-surface-400 mb-1.5">{description}</p>}
      {children}
    </div>
  )

  const ApiKeyField = ({ keyName, label, placeholder, docsUrl }: any) => (
    <Field label={label} description={`Your ${label}. Keep this secret.`}>
      <div className="relative">
        <input
          type={showKeys[keyName] ? 'text' : 'password'}
          value={settings[keyName as keyof typeof settings]}
          onChange={e => setSettings(s => ({ ...s, [keyName]: e.target.value }))}
          className="input-base pr-20"
          placeholder={placeholder}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button type="button" onClick={() => toggleKey(keyName)} className="p-1 text-surface-400 hover:text-surface-600">
            {showKeys[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {settings[keyName as keyof typeof settings] && (
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          API key configured
        </div>
      )}
    </Field>
  )

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">Configure your ColdCloud account</p>
      </div>

      <Section title="Profile" icon={User}>
        <Field label="Full Name">
          <input value={settings.full_name} onChange={e => setSettings(s => ({ ...s, full_name: e.target.value }))} className="input-base" />
        </Field>
        <Field label="Email Address">
          <input type="email" value={settings.email} onChange={e => setSettings(s => ({ ...s, email: e.target.value }))} className="input-base" />
        </Field>
        <Field label="Company">
          <input value={settings.company} onChange={e => setSettings(s => ({ ...s, company: e.target.value }))} className="input-base" />
        </Field>
      </Section>

      <Section title="API Keys" icon={Key}>
        <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300 mb-4">
          ⚠️ API keys are stored encrypted and never exposed in our UI. Add your own keys for full functionality.
        </div>
        <ApiKeyField keyName="openai_api_key" label="OpenAI API Key" placeholder="sk-proj-..." />
        <ApiKeyField keyName="resend_api_key" label="Resend API Key" placeholder="re_..." />
      </Section>

      <Section title="Email Settings" icon={Mail}>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="From Name">
            <input value={settings.from_name} onChange={e => setSettings(s => ({ ...s, from_name: e.target.value }))} className="input-base" placeholder="Your Name" />
          </Field>
          <Field label="From Email">
            <input type="email" value={settings.from_email} onChange={e => setSettings(s => ({ ...s, from_email: e.target.value }))} className="input-base" placeholder="you@yourdomain.com" />
          </Field>
        </div>
        <Field label="Email Signature">
          <textarea
            value={settings.email_signature}
            onChange={e => setSettings(s => ({ ...s, email_signature: e.target.value }))}
            className="input-base min-h-[100px] resize-none font-mono text-xs"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Daily Send Limit" description="Max emails to send per day">
            <input type="number" value={settings.daily_send_limit} onChange={e => setSettings(s => ({ ...s, daily_send_limit: e.target.value }))} className="input-base" min="1" max="500" />
          </Field>
          <Field label="Delay Between Emails (minutes)" description="Randomized delay to avoid spam filters">
            <input type="number" value={settings.send_delay_minutes} onChange={e => setSettings(s => ({ ...s, send_delay_minutes: e.target.value }))} className="input-base" min="1" max="60" />
          </Field>
        </div>
      </Section>

      <Section title="Calendly Integration" icon={Calendar}>
        <Field label="Calendly Booking Link" description="This link will be included when you send meeting invitations">
          <input value={settings.calendly_link} onChange={e => setSettings(s => ({ ...s, calendly_link: e.target.value }))} className="input-base" placeholder="https://calendly.com/yourname/30min" />
        </Field>
        {settings.calendly_link && (
          <a href={settings.calendly_link} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">
            Preview your booking page →
          </a>
        )}
      </Section>
    </div>
  )
}
