import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { staffService } from '@/features/staff/services/staff.service'
import type { StaffProfileFormValues } from '@/features/staff/schemas'

export function useStaffProfiles(organizationId: string | null) {
  return useQuery({
    queryKey: ['staff-profiles', organizationId],
    enabled: Boolean(organizationId),
    queryFn: () => staffService.listProfiles(organizationId!),
  })
}

export function useUpsertStaffProfile(organizationId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, values }: { userId: string; values: StaffProfileFormValues }) =>
      staffService.upsertProfile(organizationId!, userId, values),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['staff-profiles', organizationId] }),
  })
}

export function useUploadAvatar(organizationId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) => staffService.uploadAvatar(userId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['administration', 'members', organizationId] })
      qc.invalidateQueries({ queryKey: ['firm-members', organizationId] })
    },
  })
}
