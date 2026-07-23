import { LifeBuoy, Activity } from 'lucide-react'
import { ModulePlaceholder } from '@/shared/components/module-placeholder'

export const SupportTicketsPage = () => (
  <ModulePlaceholder
    title="Support Tickets"
    description="Customer support operations."
    icon={LifeBuoy}
    highlights={['Open / assigned / resolved', 'Priority & SLA', 'By organization', 'Assigned engineer', 'Threaded replies', 'Support-session links']}
  />
)

export const SystemHealthPage = () => (
  <ModulePlaceholder
    title="System Health"
    description="Infrastructure status & performance."
    icon={Activity}
    highlights={['Supabase database', 'Authentication & storage', 'Realtime & edge functions', 'API response times', 'Storage usage', 'Performance metrics']}
  />
)
