import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mattersService } from '@/features/matters/services/matters.service'

export function useMatterEvents(matterId: string | undefined) {
  return useQuery({
    queryKey: ['matter-events', matterId],
    enabled: Boolean(matterId),
    queryFn: () => mattersService.listEvents(matterId!),
  })
}

export function useAddMatterEvent(organizationId: string | null, matterId: string, actorId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (summary: string) => mattersService.addEvent(organizationId!, matterId, summary, actorId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['matter-events', matterId] }),
  })
}
