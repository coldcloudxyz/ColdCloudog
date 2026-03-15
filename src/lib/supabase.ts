import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Use this ONLY for auth (signIn, signUp, signOut, getUser)
// Never use this for database queries — use API routes instead
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Use this in client components when you need the session-aware client
// This automatically reads the session cookie
export const createBrowserClient = () =>
  createClientComponentClient({
    supabaseUrl,
    supabaseKey: supabaseAnon,
  })

// Server-side admin client — only use in API routes
// This bypasses RLS entirely — use with care
export const createAdminClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken:  false,
      persistSession:    false,
    },
  })
}