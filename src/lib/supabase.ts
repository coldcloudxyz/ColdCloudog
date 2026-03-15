import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser client ─────────────────────────────────────────────
// Use this in client components for auth and data fetching.
// It reads and writes the session cookie automatically.
export const createBrowserClient = () =>
  createSupabaseBrowserClient(supabaseUrl, supabaseAnon)

// ── Server client ──────────────────────────────────────────────
// Use this in Server Components and Server Actions.
// It reads the session cookie from the request headers.
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies()
  return createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll:    () => cookieStore.getAll(),
      setAll:    (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options)
        })
      },
    },
  })
}

// ── Admin client ───────────────────────────────────────────────
// Only use in API routes. Bypasses RLS entirely.
export const createAdminClient = () => {
  const { createClient } = require('@supabase/supabase-js')
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession:   false,
      },
    }
  )
}

// Legacy export — only use for auth operations (signIn, signUp, signOut)
// Never use this for database queries
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(supabaseUrl, supabaseAnon)