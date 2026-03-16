'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Zap, LayoutDashboard, Users, Mail, BarChart3, Settings,
  LogOut, Menu, ChevronRight, Bell, Megaphone, Moon, Sun, Loader2
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const navItems = [
  { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/dashboard/leads',     icon: Users,           label: 'Leads'        },
  { href: '/dashboard/campaigns', icon: Megaphone,       label: 'Campaigns'    },
  { href: '/dashboard/emails',    icon: Mail,            label: 'Email Center' },
  { href: '/dashboard/analytics', icon: BarChart3,       label: 'Analytics'    },
  { href: '/dashboard/settings',  icon: Settings,        label: 'Settings'     },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode,    setDarkMode]    = useState(false)
  const [user,        setUser]        = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser(data.user)
      } else {
        router.push('/auth/login')
      }
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) router.push('/auth/login')
      if (event === 'SIGNED_IN' && session)   setUser(session.user)
    })

    const dark = localStorage.getItem('darkMode') === 'true'
    setDarkMode(dark)
    if (dark) document.documentElement.classList.add('dark')

    return () => subscription.unsubscribe()
  }, [])

  function toggleDark() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  async function handleLogout() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-surface-50 dark:bg-surface-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    )
  }

  function Sidebar() {
    return (
      <aside className="flex flex-col w-64 bg-white dark:bg-surface-900 border-r border-surface-100 dark:border-surface-800 h-full">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-100 dark:border-surface-800">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center shadow-glow flex-shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-bold text-sm leading-none">ColdCloud</div>
            <div className="text-xs text-surface-400 mt-0.5">AI Lead Engine</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon   = item.icon
            const active = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn('nav-item', active ? 'nav-item-active' : 'nav-item-inactive')}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-surface-100 dark:border-surface-800 space-y-1">
          <button onClick={toggleDark} className="nav-item nav-item-inactive w-full">
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <button
            onClick={handleLogout}
            className="nav-item nav-item-inactive w-full text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
          <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">
                {user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'}
              </div>
              <div className="text-xs text-surface-400 truncate">{user?.email}</div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <div className="flex h-screen bg-surface-50 dark:bg-surface-950 overflow-hidden">
      <div className="hidden lg:flex flex-shrink-0"><Sidebar /></div>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative w-64 flex-shrink-0"><Sidebar /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-14 bg-white dark:bg-surface-900 border-b border-surface-100 dark:border-surface-800 flex items-center gap-4 px-4 sm:px-6">
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-500">
            <Bell className="w-4 h-4" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}