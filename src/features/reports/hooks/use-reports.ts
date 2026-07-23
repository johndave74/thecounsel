import { useQuery } from '@tanstack/react-query'
import { reportsService } from '@/features/reports/services/reports.service'

export function useReportData(orgId: string | null) {
  return useQuery({
    queryKey: ['reports', orgId],
    enabled: Boolean(orgId),
    queryFn: () => reportsService.getReportData(orgId!),
  })
}
