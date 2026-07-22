import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'

export interface ActivityTrend {
  points: { label: string; value: number }[]
  total: number
  today: number
}

/** Daily activity volume over the last `days` days, for the trend widget. */
export function useActivityTrend(organizationId: string | null, days = 14) {
  return useQuery({
    queryKey: ['dashboard', 'activity-trend', organizationId, days],
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<ActivityTrend> => {
      const since = new Date()
      since.setHours(0, 0, 0, 0)
      since.setDate(since.getDate() - (days - 1))

      const { data, error } = await supabase
        .from('audit_logs')
        .select('created_at')
        .eq('organization_id', organizationId!)
        .gte('created_at', since.toISOString())
      if (error) throw error

      const buckets: { label: string; value: number }[] = []
      const fmt = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short' })
      for (let i = 0; i < days; i++) {
        const d = new Date(since)
        d.setDate(since.getDate() + i)
        buckets.push({ label: fmt.format(d), value: 0 })
      }
      for (const row of data ?? []) {
        const d = new Date(row.created_at)
        d.setHours(0, 0, 0, 0)
        const idx = Math.round((d.getTime() - since.getTime()) / 86400000)
        if (idx >= 0 && idx < buckets.length) buckets[idx].value += 1
      }
      return {
        points: buckets,
        total: (data ?? []).length,
        today: buckets[buckets.length - 1]?.value ?? 0,
      }
    },
  })
}
