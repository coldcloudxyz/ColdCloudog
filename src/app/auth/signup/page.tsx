'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const benefits = [
  '14-day free trial included',
  'No credit card required',
  'AI message generation',
  'Cancel anytime',
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.fullName }
        }
      })
      if (error) throw error
      toast.success('Account created! Check your email to verify.')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-600 to-cyan-600 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-white font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            ColdCloud
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-3xl font-bold text-white mb-4">Start booking more meetings today</h2>
          <p className="text-brand-100 text-lg mb-8">Join 500+ companies automating their outbound sales with AI.</p>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-white">
                <CheckCircle2 className="w-5 h-5 text-cyan-300 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div className="mt-10 p-5 bg-white/10 backdrop-blur rounded-xl border border-white/20">
            <p className="text-white text-sm italic mb-3">
              "ColdCloud tripled our outbound response rates in the first month. The AI personalization is genuinely impressive."
            </p>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">SC</div>
              <div>
                <p className="text-white text-sm font-medium">Sarah Chen</p>
                <p className="text-brand-200 text-xs">Founder, GrowthLab Agency</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative text-brand-200 text-sm">© 2025 ColdCloud. All rights reserved.</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-glow">
                <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              ColdCloud
            </Link>
          </div>

          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-surface-500 dark:text-surface-400 text-sm mb-8">Start your 14-day free trial. No card needed.</p>

          <div className="card p-8">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  className="input-base"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Work email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-base"
                  placeholder="you@company.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="input-base pr-10"
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 mt-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Creating account...' : 'Create account'}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <p className="mt-4 text-xs text-center text-surface-400">
              By signing up you agree to our{' '}
              <a href="#" className="text-brand-600 hover:underline">Terms of Service</a> and{' '}
              <a href="#" className="text-brand-600 hover:underline">Privacy Policy</a>.
            </p>

            <p className="mt-5 text-center text-sm text-surface-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-brand-600 hover:text-brand-500 font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
