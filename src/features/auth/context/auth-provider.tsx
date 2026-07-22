import * as React from 'react'
import { supabase } from '@/shared/lib/supabase'
import { PERMISSION_KEYS, type PermissionKey } from '@/shared/lib/permissions'
import { authService } from '@/features/auth/services/auth.service'
import type { ActiveMembership, AuthContextValue, AuthState } from '@/features/auth/types'

const ACTIVE_ORG_KEY = 'counsel.active_org'

const initialState: AuthState = {
  userId: null,
  profile: null,
  memberships: [],
  activeOrgId: null,
  activeMembership: null,
  permissions: new Set<PermissionKey>(),
  isPlatformAdmin: false,
  status: 'loading',
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

function pickActiveOrg(
  memberships: ActiveMembership[],
  preferred: string | null,
  fallback: string | null,
): string | null {
  const ids = memberships.map((m) => m.organization_id)
  if (preferred && ids.includes(preferred)) return preferred
  if (fallback && ids.includes(fallback)) return fallback
  return ids[0] ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AuthState>(initialState)

  const load = React.useCallback(async (userId: string | null) => {
    if (!userId) {
      setState({ ...initialState, status: 'unauthenticated' })
      return
    }

    const [profile, memberships] = await Promise.all([
      authService.getProfile(userId),
      authService.getMemberships(userId),
    ])

    const isPlatformAdmin = Boolean(profile?.is_platform_admin)
    const stored = localStorage.getItem(ACTIVE_ORG_KEY)
    const activeOrgId = pickActiveOrg(memberships, stored, profile?.default_organization_id ?? null)
    const activeMembership = memberships.find((m) => m.organization_id === activeOrgId) ?? null

    let permissions: Set<PermissionKey>
    if (isPlatformAdmin) {
      permissions = new Set(PERMISSION_KEYS)
    } else if (activeMembership) {
      permissions = new Set(await authService.getPermissionKeys(activeMembership.role_id))
    } else {
      permissions = new Set<PermissionKey>()
    }

    if (activeOrgId) localStorage.setItem(ACTIVE_ORG_KEY, activeOrgId)

    setState({
      userId,
      profile,
      memberships,
      activeOrgId,
      activeMembership,
      permissions,
      isPlatformAdmin,
      status: 'authenticated',
    })

    void authService.touchLastSeen(userId)
  }, [])

  React.useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) void load(data.session?.user.id ?? null)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      if (event === 'PASSWORD_RECOVERY') return // handled by reset-password page
      void load(session?.user.id ?? null)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [load])

  const setActiveOrg = React.useCallback(
    (orgId: string) => {
      setState((prev) => {
        const activeMembership = prev.memberships.find((m) => m.organization_id === orgId) ?? null
        localStorage.setItem(ACTIVE_ORG_KEY, orgId)
        return { ...prev, activeOrgId: orgId, activeMembership }
      })
      // Recompute permissions for the newly selected org.
      void (async () => {
        const membership = state.memberships.find((m) => m.organization_id === orgId)
        if (!membership || state.isPlatformAdmin) return
        const keys = await authService.getPermissionKeys(membership.role_id)
        setState((prev) => ({ ...prev, permissions: new Set(keys) }))
      })()
    },
    [state.memberships, state.isPlatformAdmin],
  )

  const has = React.useCallback(
    (permission: PermissionKey) => state.isPlatformAdmin || state.permissions.has(permission),
    [state.isPlatformAdmin, state.permissions],
  )
  const hasAny = React.useCallback(
    (perms: PermissionKey[]) => state.isPlatformAdmin || perms.some((p) => state.permissions.has(p)),
    [state.isPlatformAdmin, state.permissions],
  )
  const hasAll = React.useCallback(
    (perms: PermissionKey[]) => state.isPlatformAdmin || perms.every((p) => state.permissions.has(p)),
    [state.isPlatformAdmin, state.permissions],
  )

  const value = React.useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: async (email, password) => {
        await authService.signIn(email, password)
      },
      signOut: async () => {
        await authService.signOut()
      },
      sendPasswordReset: (email) => authService.sendPasswordReset(email),
      updatePassword: (pwd) => authService.updatePassword(pwd),
      setActiveOrg,
      refresh: () => load(state.userId),
      has,
      hasAny,
      hasAll,
    }),
    [state, setActiveOrg, load, has, hasAny, hasAll],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
