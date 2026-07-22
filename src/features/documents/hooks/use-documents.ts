import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { documentsService, type DocumentFilters } from '@/features/documents/services/documents.service'
import type { DocumentRow } from '@/shared/types/database.types'

export function useDocuments(organizationId: string | null, filters: DocumentFilters) {
  return useQuery({
    queryKey: ['org-documents', organizationId, filters],
    enabled: Boolean(organizationId),
    queryFn: () => documentsService.list(organizationId!, filters),
  })
}

function useInvalidate(organizationId: string | null) {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: ['org-documents', organizationId] })
}

export function useUploadDocuments(organizationId: string | null, uploadedBy: string | null) {
  const invalidate = useInvalidate(organizationId)
  return useMutation({
    mutationFn: (params: { file: File; matterId?: string | null; category?: string | null }) =>
      documentsService.upload({ organizationId: organizationId!, uploadedBy, ...params }),
    onSuccess: invalidate,
  })
}

export function useDeleteOrgDocument(organizationId: string | null) {
  const invalidate = useInvalidate(organizationId)
  return useMutation({ mutationFn: (doc: DocumentRow) => documentsService.remove(doc), onSuccess: invalidate })
}
