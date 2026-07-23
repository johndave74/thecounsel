import { format } from 'date-fns'
import { Check, Crown } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { useSubscription } from '@/features/administration/hooks/use-administration'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { formatNaira, daysUntil } from '@/shared/lib/format'

export function PlanSummary() {
  const { activeOrgId } = useAuth()
  const { data: sub, isLoading } = useSubscription(activeOrgId)

  if (isLoading) return <Skeleton className="h-64 w-full rounded-lg" />
  if (!sub) return <Card className="p-6 text-sm text-muted-foreground">No subscription on file. Contact CloudTech.</Card>

  const plan = sub.plan
  const trialLeft = sub.status === 'trialing' ? daysUntil(sub.trial_ends_at) : null
  const highlights = (plan?.highlights ?? []) as string[]

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            <h3 className="font-display text-xl font-semibold">{plan?.name ?? 'Custom'}</h3>
            <Badge variant={sub.status === 'active' ? 'success' : sub.status === 'trialing' ? 'warning' : 'muted'} className="capitalize">
              {sub.status}
            </Badge>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold">{plan ? formatNaira(Number(plan.price_monthly)) : '—'}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>
        </div>

        {trialLeft != null && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            Trial — {trialLeft < 0 ? 'expired' : `${trialLeft} days left`}. Contact CloudTech to convert to a paid plan.
          </p>
        )}

        {highlights.length > 0 && (
          <ul className="mt-5 grid gap-2 sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-success" /> {h}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-6 text-sm">
        <div className="flex justify-between"><span className="text-muted-foreground">Billing cycle</span><span className="font-medium capitalize">{sub.billing_cycle}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-medium">{sub.seats}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Auto-renew</span><span className="font-medium">{sub.auto_renew ? 'On' : 'Off'}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Renews</span><span className="font-medium">{sub.current_period_end ? format(new Date(sub.current_period_end), 'PP') : '—'}</span></div>
        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Plan changes and billing are handled by CloudTech. Reach out to upgrade or adjust seats.
        </p>
      </Card>
    </div>
  )
}
