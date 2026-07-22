import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import type { AuditLog } from '@/shared/types/database.types'

/**
 * Live activity feed backed by audit_logs. Loads the recent history, then keeps
 * it current via a Supabase Realtime subscription (RLS scopes it to this firm).
 */
export function useLiveActivity(organizationId: string | null, limit = 40) {
  const qc = useQueryClient()
  const [live, setLive] = useState(false)
  const key = ['notifications', 'activity', organizationId] as const

  const query = useQuery({
    queryKey: key,
    enabled: Boolean(organizationId),
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return data ?? []
    },
  })

  useEffect(() => {
    if (!organizationId) return
    const channel = supabase
      .channel(`activity:${organizationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs', filter: `organization_id=eq.${organizationId}` },
        (payload) => {
          const row = payload.new as AuditLog
          qc.setQueryData<AuditLog[]>(key, (old) => {
            if (!old) return [row]
            if (old.some((r) => r.id === row.id)) return old
            return [row, ...old].slice(0, limit)
          })
        },
      )
      .subscribe((status) => setLive(status === 'SUBSCRIBED'))

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId])

  return { ...query, live }
}
