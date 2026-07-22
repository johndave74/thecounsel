import { useAuth } from '@/features/auth/context/auth-provider'
import type { PermissionKey } from '@/shared/lib/permissions'

/** Ergonomic access to the permission engine for the active organization. */
export function usePermissions() {
  const { has, hasAny, hasAll, permissions, isPlatformAdmin } = useAuth()
  return {
    has,
    hasAny,
    hasAll,
    isPlatformAdmin,
    all: permissions,
    can: (permission: PermissionKey) => has(permission),
  }
}
