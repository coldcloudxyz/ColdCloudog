// Browser client — safe to use in client components
export { createBrowserSupabaseClient as createBrowserClient } from './supabase/client'

// Server client — only call from Server Components or Server Actions
// Never import this in a client component
export { createServerSupabaseClient } from './supabase/server'

// Admin client — only call from API routes
// Never import this in a client component
export { createAdminClient } from './supabase/admin'