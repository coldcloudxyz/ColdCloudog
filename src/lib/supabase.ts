// Browser client — import this in all 'use client' files
export { createBrowserSupabaseClient as createBrowserClient } from './supabase/client'

// Server client — import this in Server Components and Server Actions only
export { createServerSupabaseClient } from './supabase/server'

// Admin client — import this in API routes only, never in client code
export { createAdminSupabaseClient as createAdminClient } from './supabase/admin'