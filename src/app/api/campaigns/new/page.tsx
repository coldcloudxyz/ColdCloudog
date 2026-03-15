'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Megaphone, Target, MessageSquare, Users, Handshake,
  UserSearch, ChevronRight, ChevronLeft, Loader2,
  Sparkles, Check, Edit3, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

// ── Goal definitions ──────────────────────────────────────────

const GOALS = [
  {
    id:          'promotion',
    label:       'Product Promotion',
    description: 'Promote your product or service to potential customers',
    icon:        Megaphone,
    color:       'from-blue-500 to-cyan-500',
    questions: [
      'What does your company do?',
      'Who is your target customer?',
      'What problem do you solve for them?',
      'What makes your product different from alternatives?',
    ],
  },
  {
    id:          'meeting',
    label:       'Meeting Booking',
    description: 'Get prospects to book a call or demo with you',
    icon:        Target,
    color:       'from-brand-500 to-violet-500',
    questions: [
      'What service or product are you offering?',
      'Who is the ideal person to book this meeting?',
      'What outcome will they get from the meeting?',
      'Do you have a Calendly or booking link?',
    ],
  },
  {
    id:          'followup',
    label:       'Follow-up Outreach',
    description: 'Re-engage leads who have gone cold',
    icon:        MessageSquare,
    color:       'from-amber-500 to-orange-500',
    questions: [
      'What was the original reason you reached out to these leads?',
      'How long ago was the last contact?',
      'Has anything changed with your offer since then?',
      'What is the main thing you want them to do next?',
    ],
  },
  {
    id:          'partnership',
    label:       'Partnership Outreach',
    description: 'Reach out to potential partners or collaborators',
    icon:        Handshake,
    color:       'from-green-500 to-emerald-500',
    questions: [
      'What kind of partnership are you looking for?',
      'What does your company offer the potential partner?',
      'What would the partner gain from working with you?',
      'Do you have any existing partnerships to reference?',
    ],
  },
  {
    id:          'hiring',
    label:       'Hiring Outreach',
    description: 'Reach out to candidates for open roles',
    icon:        UserSearch,
    color:       'from-purple-500 to-pink-500',
    questions: [
      'What role are you hiring for?',
      'What does your company do?',
      'What makes this role or company exciting?',
      'What type of candidate are you looking for?',
    ],
  },
]

// ── Step indicator ────────────────────────────────────────────

const STEPS = [
  'Choose Goal',
  'Name Campaign',
  'Answer Questions',
  'Review Emails',
  'Launch',
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
              i < current
                ? 'bg-brand-600 text-white'
                : i === current
                  ? 'bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-400'
            )}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium hidden sm:block whitespace-nowrap',
              i <= current ? 'text-surface-700 dark:text-surface-300' : 'text-surface-400'
            )}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn(
              'flex-1 h-0.5 mx-2 mb-5 transition-all',
              i < current ? 'bg-brand-500' : 'bg-surface-100 dark:bg-surface-800'
            )} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Generated step card ───────────────────────────────────────

interface GeneratedStep {
  id?:            string
  step_number:    number
  delay_days:     number
  subject:        string
  email_template: string
}

function EmailStepCard({
  step,
  onChange,
}: {
  step: GeneratedStep
  onChange: (updated: GeneratedStep) => void
}) {
  const [editing, setEditing] = useState(false)

  const stepLabels = ['Initial Outreach', 'Follow-up', 'Final Follow-up']
  const label = stepLabels[step.step_number - 1] ?? `Email ${step.step_number}`

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            {step.step_number}
          </div>
          <div>
            <p className="font-semibold text-sm">{label}</p>
            <p className="text-xs text-surface-400">
              {step.delay_days === 0
                ? 'Send immediately'
                : `Send after ${step.delay_days} days`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing(e => !e)}
          className="btn-ghost text-xs py-1.5"
        >
          <Edit3 className="w-3.5 h-3.5" />
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">
              Subject line
            </label>
            <input
              value={step.subject}
              onChange={e => onChange({ ...step, subject: e.target.value })}
              className="input-base text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-500 mb-1">
              Email body — use {'{{name}}'}, {'{{company}}'}, {'{{website}}'}
            </label>
            <textarea
              value={step.email_template}
              onChange={e => onChange({ ...step, email_template: e.target.value })}
              rows={8}
              className="input-base text-sm resize-none leading-relaxed"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2">
            <span className="text-xs text-surface-400 font-medium">Subject: </span>
            <span className="text-sm">{step.subject}</span>
          </div>
          <div className="bg-surface-50 dark:bg-surface-800 rounded-lg px-3 py-2 text-sm text-surface-600 dark:text-surface-400 whitespace-pre-wrap leading-relaxed">
            {step.email_template}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────

export default function NewCampaignPage() {
  const router = useRouter()

  const [step,         setStep]         = useState(0)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [answers,      setAnswers]      = useState<string[]>([])
  const [campaignId,   setCampaignId]   = useState<string | null>(null)
  const [generatedSteps, setGeneratedSteps] = useState<GeneratedStep[]>([])
  const [building,     setBuilding]     = useState(false)
  const [launching,    setLaunching]    = useState(false)

  const goalDef = GOALS.find(g => g.id === selectedGoal)

  // ── Step 0 — choose goal ──────────────────────────────────

  async function handleGoalNext() {
    if (!selectedGoal) {
      toast.error('Please select a campaign goal')
      return
    }
    setStep(1)
  }

  // ── Step 1 — name the campaign and create it in DB ────────

  async function handleNameNext() {
    if (!campaignName.trim()) {
      toast.error('Please enter a campaign name')
      return
    }
    setBuilding(true)
    try {
      const res = await fetch('/api/campaigns', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:          campaignName.trim(),
          campaign_goal: selectedGoal,
          status:        'draft',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to create campaign')
      setCampaignId(data.campaign.id)
      setAnswers(new Array(goalDef!.questions.length).fill(''))
      setStep(2)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBuilding(false)
    }
  }

  // ── Step 2 — answer questions, then generate emails ───────

  async function handleGenerateEmails() {
    const unanswered = answers.filter(a => !a.trim()).length
    if (unanswered === answers.length) {
      toast.error('Please answer at least one question')
      return
    }
    if (!campaignId || !goalDef) return

    setBuilding(true)
    try {
      const qa = goalDef.questions.map((q, i) => ({
        question: q,
        answer:   answers[i] ?? '',
      }))

      const res = await fetch('/api/campaigns/build', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          campaign_id:   campaignId,
          goal:          selectedGoal,
          campaign_name: campaignName,
          qa,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to generate emails')
      setGeneratedSteps(data.steps)
      setStep(3)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBuilding(false)
    }
  }

  // ── Step 3 — user edits templates ─────────────────────────

  function handleStepChange(updated: GeneratedStep) {
    setGeneratedSteps(prev =>
      prev.map(s => (s.step_number === updated.step_number ? updated : s))
    )
  }

  async function handleSaveAndContinue() {
    if (!campaignId) return
    setBuilding(true)
    try {
      // Save any edits back to DB
      await Promise.all(
        generatedSteps.map(s =>
          s.id
            ? fetch('/api/campaigns/steps', {
                method:  'PUT',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({
                  id:             s.id,
                  subject:        s.subject,
                  email_template: s.email_template,
                }),
              })
            : Promise.resolve()
        )
      )
      setStep(4)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBuilding(false)
    }
  }

  // ── Step 4 — launch ───────────────────────────────────────

  async function handleLaunch() {
    if (!campaignId) return
    setLaunching(true)
    try {
      const res = await fetch('/api/campaigns', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: campaignId, status: 'active' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to launch campaign')
      toast.success('Campaign launched!')
      router.push('/dashboard/campaigns')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLaunching(false)
    }
  }

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New Campaign</h1>
        <p className="text-surface-500 dark:text-surface-400 text-sm mt-0.5">
          AI builds your email sequence based on your goal
        </p>
      </div>

      <StepBar current={step} />

      {/* ── Step 0: Goal selection ── */}
      {step === 0 && (
        <div>
          <h2 className="font-semibold text-lg mb-1">Choose your campaign goal</h2>
          <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">
            AI will tailor the questions and email templates to your goal.
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {GOALS.map(goal => {
              const Icon = goal.icon
              const selected = selectedGoal === goal.id
              return (
                <button
                  key={goal.id}
                  onClick={() => setSelectedGoal(goal.id)}
                  className={cn(
                    'card p-4 text-left transition-all hover:shadow-md',
                    selected
                      ? 'ring-2 ring-brand-500 shadow-glow'
                      : 'hover:border-surface-300 dark:hover:border-surface-600'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow',
                      goal.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{goal.label}</p>
                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-surface-400 mt-0.5 leading-relaxed">
                        {goal.description}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleGoalNext}
              disabled={!selectedGoal}
              className="btn-primary"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1: Campaign name ── */}
      {step === 1 && goalDef && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className={cn(
              'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow',
              goalDef.color
            )}>
              <goalDef.icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{goalDef.label}</p>
              <p className="text-xs text-surface-400">Give your campaign a name</p>
            </div>
          </div>

          <div className="card p-6 mb-6">
            <label className="block text-sm font-medium mb-2">Campaign name</label>
            <input
              autoFocus
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameNext()}
              className="input-base text-base"
              placeholder={`e.g. ${goalDef.label} — Q3 2025`}
            />
            <p className="text-xs text-surface-400 mt-2">
              This is just for your reference — leads won't see it.
            </p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleNameNext}
              disabled={building || !campaignName.trim()}
              className="btn-primary"
            >
              {building ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: AI interview ── */}
      {step === 2 && goalDef && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            <h2 className="font-semibold text-lg">AI Interview</h2>
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">
            Answer these questions so the AI can write emails specific to your situation.
            You can leave some blank.
          </p>

          <div className="space-y-4 mb-8">
            {goalDef.questions.map((question, i) => (
              <div key={i} className="card p-4">
                <label className="block text-sm font-medium mb-2">
                  <span className="text-brand-500 font-bold mr-2">{i + 1}.</span>
                  {question}
                </label>
                <textarea
                  value={answers[i] ?? ''}
                  onChange={e => {
                    const next = [...answers]
                    next[i] = e.target.value
                    setAnswers(next)
                  }}
                  rows={2}
                  placeholder="Your answer..."
                  className="input-base text-sm resize-none"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleGenerateEmails}
              disabled={building}
              className="btn-primary"
            >
              {building ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating emails...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Email Sequence
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review and edit emails ── */}
      {step === 3 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-5 h-5 text-green-500" />
            <h2 className="font-semibold text-lg">Your Email Sequence</h2>
          </div>
          <p className="text-surface-500 dark:text-surface-400 text-sm mb-6">
            AI generated 3 emails for your campaign. Click <strong>Edit</strong> on
            any card to customise the subject or body before launching.
          </p>

          <div className="space-y-4 mb-8">
            {generatedSteps.map(s => (
              <EmailStepCard
                key={s.step_number}
                step={s}
                onChange={handleStepChange}
              />
            ))}
          </div>

          <div className="card p-4 bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700 mb-6">
            <p className="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
              <strong className="text-surface-700 dark:text-surface-300">Variables:</strong>{' '}
              Use <code className="bg-white dark:bg-surface-900 px-1 rounded">{'{{name}}'}</code>,{' '}
              <code className="bg-white dark:bg-surface-900 px-1 rounded">{'{{company}}'}</code>, and{' '}
              <code className="bg-white dark:bg-surface-900 px-1 rounded">{'{{website}}'}</code> —
              they will be replaced with each lead's real data when emails are sent.
            </p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={building}
              className="btn-primary"
            >
              {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Save & Continue
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Launch ── */}
      {step === 4 && (
        <div>
          <div className="card p-8 text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Ready to launch</h2>
            <p className="text-surface-500 dark:text-surface-400 text-sm mb-1">
              <strong className="text-surface-700 dark:text-surface-200">{campaignName}</strong>
            </p>
            <p className="text-surface-400 text-sm mb-6">
              {generatedSteps.length}-email sequence ·{' '}
              {GOALS.find(g => g.id === selectedGoal)?.label}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8 text-left">
              {generatedSteps.map(s => {
                const labels = ['Initial', 'Follow-up', 'Final']
                return (
                  <div
                    key={s.step_number}
                    className="bg-surface-50 dark:bg-surface-800 rounded-xl p-3"
                  >
                    <div className="text-xs font-semibold text-brand-600 dark:text-brand-400 mb-1">
                      Email {s.step_number} — {labels[s.step_number - 1]}
                    </div>
                    <div className="text-xs text-surface-500 truncate">{s.subject}</div>
                    <div className="text-xs text-surface-400 mt-1">
                      {s.delay_days === 0 ? 'Day 0' : `Day ${s.delay_days}`}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setStep(3)} className="btn-secondary">
                <ChevronLeft className="w-4 h-4" /> Edit emails
              </button>
              <button
                onClick={handleLaunch}
                disabled={launching}
                className="btn-primary px-8"
              >
                {launching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {launching ? 'Launching...' : 'Launch Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}