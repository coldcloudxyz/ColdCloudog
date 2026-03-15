'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading,      setLoading]      = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Use the SSR-aware browser client so the session cookie
      // is written correctly and middleware can read it
      const supabase = createBrowserClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password,
      })

      if (error) throw error

      if (data.session) {
        toast.success('Welcome back!')
        // Use router.refresh() first to update the server-side session,
        // then push to dashboard
        router.refresh()
        router.push('/dashboard')
      } else {
        throw new Error('No session returned. Please try again.')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-xl font-bold">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            ColdCloud
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-surface-900 dark:text-surface-50">
            Welcome back
          </h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400 text-sm">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <div className="card p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="you@company.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-surface-700 dark:text-surface-300">
                  Password
                </label>
                <Link
                  href="/auth/reset-password"
                  className="text-xs text-brand-600 hover:text-brand-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : null}
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-500">
            Don't have an account?{' '}
            <Link
              href="/auth/signup"
              className="text-brand-600 hover:text-brand-500 font-medium"
            >
              Start free trial
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}