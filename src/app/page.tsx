'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Zap, Users, Mail, Calendar, BarChart3, ArrowRight,
  CheckCircle2, Star, ChevronRight, Sparkles, Target,
  TrendingUp, Shield, Globe, Bot
} from 'lucide-react'

const features = [
  {
    icon: Bot,
    title: 'AI Personalization Engine',
    description: 'Our AI reads company websites and generates hyper-personalized outreach messages that convert at 3x industry average.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Users,
    title: 'Smart Lead Management',
    description: 'Upload CSV files or manually add leads. Track status, notes, and engagement all in one place.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Mail,
    title: 'Automated Email Sending',
    description: 'Send personalized outreach emails at scale with built-in tracking for opens, clicks, and replies.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Calendar,
    title: 'Meeting Booking Integration',
    description: 'Seamlessly integrate with Calendly to convert replies into booked meetings automatically.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Target,
    title: 'Campaign System',
    description: 'Build targeted campaigns with custom lead lists, messaging, and automated sending schedules.',
    color: 'from-brand-500 to-blue-500',
  },
  {
    icon: BarChart3,
    title: 'Deep Analytics',
    description: 'Track conversion rates, email performance, and revenue attribution across all your campaigns.',
    color: 'from-violet-500 to-purple-500',
  },
]

const stats = [
  { value: '3.2x', label: 'Higher reply rates' },
  { value: '47%', label: 'Faster to first meeting' },
  { value: '10k+', label: 'Meetings booked' },
  { value: '98%', label: 'Customer satisfaction' },
]

const plans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for solo founders and small teams',
    features: ['500 leads/month', '1,000 emails/month', 'AI message generation', 'Basic analytics', 'Email support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Pro',
    price: 149,
    description: 'For growing agencies and sales teams',
    features: ['5,000 leads/month', '20,000 emails/month', 'Advanced AI personalization', 'Campaign automation', 'Calendly integration', 'Priority support', 'Team collaboration'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 499,
    description: 'For large organizations with custom needs',
    features: ['Unlimited leads', 'Unlimited emails', 'Custom AI training', 'White-label option', 'API access', 'Dedicated CSM', 'SLA guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
]

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Founder, GrowthLab Agency',
    content: 'ColdCloud tripled our outbound response rates within the first month. The AI personalization is genuinely impressive.',
    rating: 5,
    avatar: 'SC',
  },
  {
    name: 'Marcus Williams',
    role: 'VP Sales, DataFlow SaaS',
    content: "We went from 2 meetings/week to 15+ meetings/week with the same team size. It's like having 10 extra SDRs.",
    rating: 5,
    avatar: 'MW',
  },
  {
    name: 'Julia Santos',
    role: 'CEO, B2B Ventures',
    content: 'The campaign system and analytics help us understand exactly what messaging works. Our conversion rate is up 180%.',
    rating: 5,
    avatar: 'JS',
  },
]

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-white dark:bg-surface-950 text-surface-900 dark:text-surface-50 transition-colors">

        {/* Nav */}
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-surface-950/90 backdrop-blur-md border-b border-surface-100 dark:border-surface-800 shadow-sm' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-glow">
                  <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-lg tracking-tight">ColdCloud</span>
              </div>

              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-surface-600 dark:text-surface-400">
                <a href="#features" className="hover:text-surface-900 dark:hover:text-white transition-colors">Features</a>
                <a href="#pricing" className="hover:text-surface-900 dark:hover:text-white transition-colors">Pricing</a>
                <a href="#testimonials" className="hover:text-surface-900 dark:hover:text-white transition-colors">Testimonials</a>
              </nav>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500"
                >
                  {darkMode ? '☀️' : '🌙'}
                </button>
                <Link href="/auth/login" className="text-sm font-medium text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link href="/auth/signup" className="btn-primary text-sm">
                  Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-grid-pattern opacity-50 dark:opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-gradient-radial from-brand-500/10 to-transparent rounded-full blur-3xl" />

          <div className="max-w-5xl mx-auto text-center relative">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by GPT-4 · Trusted by 500+ companies
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
            >
              Find leads and book{' '}
              <span className="gradient-text">meetings automatically</span>
              {' '}with AI
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-surface-500 dark:text-surface-400 max-w-2xl mx-auto mb-10"
            >
              ColdCloud AI reads your prospects' websites and writes hyper-personalized outreach that actually gets replies. Agencies, SaaS founders, and B2B businesses book 3x more meetings.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link href="/auth/signup" className="btn-primary px-6 py-3 text-base">
                Start free trial — no card needed
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/dashboard" className="btn-secondary px-6 py-3 text-base">
                View live demo
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-4 text-sm text-surface-400 dark:text-surface-500"
            >
              14-day free trial · No credit card required · Cancel anytime
            </motion.p>

            {/* App preview */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-16 relative"
            >
              <div className="rounded-2xl border border-surface-200 dark:border-surface-700 shadow-2xl overflow-hidden bg-surface-50 dark:bg-surface-900">
                <div className="flex items-center gap-1.5 px-4 py-3 bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 mx-4 h-6 bg-white dark:bg-surface-700 rounded border border-surface-200 dark:border-surface-600 text-xs flex items-center px-3 text-surface-400">
                    app.coldcloud.ai/dashboard
                  </div>
                </div>
                {/* Fake dashboard preview */}
                <div className="p-6 grid grid-cols-4 gap-4">
                  {[
                    { label: 'Total Leads', value: '2,847', color: 'text-brand-600', change: '+12%' },
                    { label: 'Emails Sent', value: '1,203', color: 'text-green-600', change: '+8%' },
                    { label: 'Replies', value: '347', color: 'text-amber-600', change: '+24%' },
                    { label: 'Meetings', value: '89', color: 'text-purple-600', change: '+31%' },
                  ].map((stat) => (
                    <div key={stat.label} className="card p-4">
                      <p className="text-xs text-surface-500 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-xs text-green-600 mt-1">{stat.change} this week</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6 grid grid-cols-3 gap-4">
                  <div className="col-span-2 card p-4">
                    <p className="text-xs font-medium text-surface-500 mb-3">Recent Leads</p>
                    <div className="space-y-2">
                      {[
                        { name: 'Alex Johnson', company: 'Stripe Inc.', status: 'replied', email: 'alex@stripe.com' },
                        { name: 'Maria Garcia', company: 'Notion', status: 'contacted', email: 'maria@notion.so' },
                        { name: 'Tom Lee', company: 'Linear', status: 'meeting_booked', email: 'tom@linear.app' },
                      ].map((lead) => (
                        <div key={lead.email} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                              {lead.name[0]}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{lead.name}</p>
                              <p className="text-xs text-surface-400">{lead.company}</p>
                            </div>
                          </div>
                          <span className={`badge text-xs ${lead.status === 'replied' ? 'bg-amber-50 text-amber-700' : lead.status === 'meeting_booked' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-4">
                    <p className="text-xs font-medium text-surface-500 mb-3">AI Message</p>
                    <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
                      Hi Alex, I noticed Stripe recently launched their Revenue Recognition feature — impressive work. We help fintech companies like yours accelerate outbound with AI...
                    </p>
                    <button className="mt-3 w-full py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium">
                      Generate & Send ✨
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-surface-50 dark:bg-surface-900 border-y border-surface-100 dark:border-surface-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="text-4xl font-bold gradient-text mb-1">{stat.value}</div>
                  <div className="text-sm text-surface-500 dark:text-surface-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Everything you need to scale outbound</h2>
              <p className="text-xl text-surface-500 dark:text-surface-400">A complete AI-powered sales engine — from finding leads to booking meetings.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    viewport={{ once: true }}
                    className="card p-6 hover:shadow-md transition-shadow group"
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-surface-500 dark:text-surface-400 text-sm leading-relaxed">{feature.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-surface-50 dark:bg-surface-900">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Loved by growth teams</h2>
              <p className="text-xl text-surface-500 dark:text-surface-400">Join 500+ companies already booking more meetings with ColdCloud.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="card p-6"
                >
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-surface-600 dark:text-surface-400 text-sm leading-relaxed mb-6">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{t.name}</p>
                      <p className="text-xs text-surface-400">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">Simple, transparent pricing</h2>
              <p className="text-xl text-surface-500 dark:text-surface-400">Start free, scale as you grow. No hidden fees.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`card p-6 relative ${plan.popular ? 'ring-2 ring-brand-500 shadow-glow' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand-600 text-white text-xs font-semibold rounded-full shadow">
                      Most Popular
                    </div>
                  )}
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-surface-500 dark:text-surface-400 text-sm mb-4">{plan.description}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-surface-400 text-sm">/month</span>
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0" />
                        <span className="text-surface-600 dark:text-surface-400">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className={plan.popular ? 'btn-primary w-full justify-center' : 'btn-secondary w-full justify-center'}
                  >
                    {plan.cta}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-brand-600 to-cyan-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to 3x your meetings?</h2>
            <p className="text-xl text-brand-100 mb-8">Join 500+ companies using ColdCloud to automate their outbound and fill their calendars with qualified meetings.</p>
            <Link href="/auth/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-brand-700 font-semibold rounded-xl hover:bg-brand-50 transition-colors shadow-lg text-base">
              Start your free trial today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-4 text-brand-200 text-sm">No credit card required · 14-day free trial · Cancel anytime</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-surface-50 dark:bg-surface-900 border-t border-surface-100 dark:border-surface-800">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                </div>
                <span className="font-bold">ColdCloud</span>
                <span className="text-surface-400 text-sm ml-2">© 2025 All rights reserved</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-surface-500">
                <a href="#" className="hover:text-surface-900 dark:hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-surface-900 dark:hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-surface-900 dark:hover:text-white transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
