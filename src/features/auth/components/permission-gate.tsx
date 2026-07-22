import type { ReactNode } from 'react'
import { usePermissions } from '@/features/auth/hooks/use-permissions'
import type { PermissionKey } from '@/shared/lib/permissions'

interface PermissionGateProps {
  /** Require all of these permissions (default) or any of them with `mode="any"`. */
  permission: PermissionKey | PermissionKey[]
  mode?: 'all' | 'any'
  fallback?: ReactNode
  children: ReactNode
}

/** Conditionally render children based on the active organization's permissions. */
export function PermissionGate({ permission, mode = 'all', fallback = null, children }: PermissionGateProps) {
  const { has, hasAny, hasAll } = usePermissions()
  const perms = Array.isArray(permission) ? permission : [permission]
  const granted = perms.length === 1 ? has(perms[0]) : mode === 'any' ? hasAny(perms) : hasAll(perms)
  return <>{granted ? children : fallback}</>
}
