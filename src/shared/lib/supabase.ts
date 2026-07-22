import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/shared/types/database.types'
import { env } from '@/shared/config/env'

/**
 * Singleton, fully-typed Supabase client. This is the ONLY backend in the app —
 * PostgreSQL, Auth, Storage, and Realtime are all reached through it, with
 * Row Level Security enforcing multi-tenant isolation.
 *
 * When credentials are absent (fresh checkout, no .env.local) we still create a
 * client against a placeholder so the UI can render; any network call will fail
 * clearly and `env.isSupabaseConfigured` lets the app show a setup notice.
 */
export const supabase: SupabaseClient<Database> = createClient<Database>(
  env.supabaseUrl || 'http://localhost:54321',
  env.supabaseAnonKey || 'public-anon-key-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  },
)

export type { Database }
