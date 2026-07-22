import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { administrationService } from '@/features/administration/services/administration.service'

const keys = {
  organizations: ['administration', 'organizations'] as const,
  roles: ['administration', 'assignable-roles'] as const,
  invitations: (orgId: string) => ['administration', 'invitations', orgId] as const,
  members: (orgId: string) => ['administration', 'members', orgId] as const,
  myInvitations: ['administration', 'my-invitations'] as const,
}

export function useOrganizations(enabled = true) {
  return useQuery({
    queryKey: keys.organizations,
    queryFn: () => administrationService.listOrganizations(),
    enabled,
  })
}

export function useAssignableRoles() {
  return useQuery({
    queryKey: keys.roles,
    queryFn: () => administrationService.listAssignableRoles(),
    staleTime: 5 * 60_000,
  })
}

export function useInvitations(organizationId: string | null) {
  return useQuery({
    queryKey: keys.invitations(organizationId ?? 'none'),
    queryFn: () => administrationService.listInvitations(organizationId!),
    enabled: Boolean(organizationId),
  })
}

export function useMembers(organizationId: string | null) {
  return useQuery({
    queryKey: keys.members(organizationId ?? 'none'),
    queryFn: () => administrationService.listMembers(organizationId!),
    enabled: Boolean(organizationId),
  })
}

export function useMyPendingInvitations(enabled = true) {
  return useQuery({
    queryKey: keys.myInvitations,
    queryFn: () => administrationService.listMyPendingInvitations(),
    enabled,
  })
}

export function useCreateOrganization() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: administrationService.createOrganization,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.organizations }),
  })
}

export function useCreateInvitation(organizationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: administrationService.createInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.invitations(organizationId) }),
  })
}

export function useRevokeInvitation(organizationId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: administrationService.revokeInvitation,
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.invitations(organizationId) }),
  })
}

export function useRemoveMember(organizationId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ membershipId, name }: { membershipId: string; name: string }) =>
      administrationService.removeMember(membershipId, organizationId!, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administration', 'members', organizationId] })
      qc.invalidateQueries({ queryKey: ['firm-members', organizationId] })
    },
  })
}
