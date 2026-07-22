import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { platformService, type PlanInput } from '@/features/platform/services/platform.service'

const keys = {
  stats: ['platform', 'stats'] as const,
  organizations: (deleted: boolean) => ['platform', 'organizations', deleted] as const,
  activity: ['platform', 'activity'] as const,
  growth: ['platform', 'growth'] as const,
  plans: ['platform', 'plans'] as const,
  subscriptions: ['platform', 'subscriptions'] as const,
  trials: ['platform', 'trials'] as const,
  members: ['platform', 'members'] as const,
}

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: ['platform'] })
  }
}

export function usePlatformStats() {
  return useQuery({ queryKey: keys.stats, queryFn: () => platformService.getStats() })
}
export function usePlatformOrganizations(includeDeleted = false) {
  return useQuery({
    queryKey: keys.organizations(includeDeleted),
    queryFn: () => platformService.listOrganizations(includeDeleted),
  })
}
export function usePlatformActivity() {
  return useQuery({ queryKey: keys.activity, queryFn: () => platformService.getRecentActivity() })
}
export function useOrganizationGrowth() {
  return useQuery({ queryKey: keys.growth, queryFn: () => platformService.getOrganizationGrowth() })
}
export function usePlans() {
  return useQuery({ queryKey: keys.plans, queryFn: () => platformService.listPlans() })
}
export function useSubscriptions() {
  return useQuery({ queryKey: keys.subscriptions, queryFn: () => platformService.listSubscriptions() })
}
export function useTrials() {
  return useQuery({ queryKey: keys.trials, queryFn: () => platformService.listTrials() })
}
export function useAllMembers() {
  return useQuery({ queryKey: keys.members, queryFn: () => platformService.listAllMembers() })
}

export function useCreateOrganizationWithAdmin() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: platformService.createOrganizationWithAdmin, onSuccess: invalidate })
}
export function useSetOrganizationStatus() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Parameters<typeof platformService.setOrganizationStatus>[1] }) =>
      platformService.setOrganizationStatus(id, status),
    onSuccess: invalidate,
  })
}
export function useSoftDeleteOrganization() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (id: string) => platformService.softDeleteOrganization(id), onSuccess: invalidate })
}
export function useRestoreOrganization() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (id: string) => platformService.restoreOrganization(id), onSuccess: invalidate })
}
export function useHardDeleteOrganization() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: (id: string) => platformService.hardDeleteOrganization(id), onSuccess: invalidate })
}
export function useUpdateOrganization() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (args: { id: string; patch: Parameters<typeof platformService.updateOrganization>[1] }) =>
      platformService.updateOrganization(args.id, args.patch),
    onSuccess: invalidate,
  })
}
export function useSavePlan() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (plan: PlanInput) => platformService.savePlan(plan),
    onSuccess: invalidate,
  })
}
export function useUpdateSubscription() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: (args: {
      id: string
      orgId: string
      action: string
      patch: Parameters<typeof platformService.updateSubscription>[1]
    }) => platformService.updateSubscription(args.id, args.patch, args.orgId, args.action),
    onSuccess: invalidate,
  })
}
