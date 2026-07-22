import { supabase } from '@/shared/lib/supabase'

export interface CreateUserInput {
  email: string
  password: string
  fullName: string
  organizationId: string
  roleKey: string
  title?: string
}

/**
 * Create a user account via the admin-create-user Edge Function (service role).
 * Used by Platform Admins (to create an organization's admin) and by
 * organization admins (to create their firm's users). Public signup is disabled.
 */
export const adminUsersService = {
  async createUser(input: CreateUserInput): Promise<{ userId: string; email: string }> {
    const { data, error } = await supabase.functions.invoke('admin-create-user', { body: input })
    if (error) {
      // Surface the function's JSON error message when present.
      const ctx = (error as { context?: Response }).context
      if (ctx && typeof ctx.json === 'function') {
        try {
          const payload = await ctx.json()
          throw new Error(payload.error ?? error.message)
        } catch {
          /* fall through */
        }
      }
      throw error
    }
    if (data?.error) throw new Error(data.error)
    return data as { userId: string; email: string }
  },
}
