import { LifeBuoy, Activity, ShieldCheck, Settings2 } from 'lucide-react'
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

export const PlatformUsersPage = () => (
  <ModulePlaceholder
    title="Platform Users"
    description="CloudTech employees — not law-firm users."
    icon={ShieldCheck}
    highlights={['Platform Owner & Administrators', 'Support Engineers', 'Sales & Finance', 'Developers', 'Role-based access', 'Activity & sessions']}
  />
)

export const PlatformSettingsPage = () => (
  <ModulePlaceholder
    title="Platform Settings"
    description="Global configuration."
    icon={Settings2}
    highlights={['Branding', 'Email templates & SMTP', 'Default plans', 'Feature flags', 'Global notifications', 'Maintenance mode']}
  />
)
