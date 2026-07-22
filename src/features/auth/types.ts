import type {
  Membership,
  Organization,
  Profile,
  Role,
} from '@/shared/types/database.types'
import type { PermissionKey } from '@/shared/lib/permissions'

/** A membership joined with its role and organization. */
export interface ActiveMembership extends Membership {
  role: Role
  organization: Organization
}

export interface AuthState {
  /** Supabase user id, or null when signed out. */
  userId: string | null
  profile: Profile | null
  memberships: ActiveMembership[]
  activeOrgId: string | null
  activeMembership: ActiveMembership | null
  /** Permission keys granted in the active organization. */
  permissions: Set<PermissionKey>
  isPlatformAdmin: boolean
  status: 'loading' | 'authenticated' | 'unauthenticated'
}

export interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
  setActiveOrg: (orgId: string) => void
  refresh: () => Promise<void>
  has: (permission: PermissionKey) => boolean
  hasAny: (permissions: PermissionKey[]) => boolean
  hasAll: (permissions: PermissionKey[]) => boolean
}
