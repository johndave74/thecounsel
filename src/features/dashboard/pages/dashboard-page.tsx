import { Link } from 'react-router-dom'
import { Banknote, Briefcase, Clock, Gavel, Sparkles, TrendingUp, ArrowRight } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { useActivityTrend } from '@/features/dashboard/hooks/use-activity-trend'
import { StatTile } from '@/features/dashboard/components/stat-tile'
import { PageHeader } from '@/shared/components/page-header'
import { Sparkline } from '@/shared/components/sparkline'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function DashboardPage() {
  const { profile, activeMembership, activeOrgId } = useAuth()
  const { data: trend, isLoading } = useActivityTrend(activeOrgId)

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const orgName = activeMembership?.organization.name

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={orgName ? `Here's what's happening at ${orgName} today.` : undefined}
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Revenue (MTD)" value="—" hint="Awaiting billing module" icon={Banknote} />
        <StatTile label="Active matters" value="—" hint="Awaiting matters module" icon={Briefcase} />
        <StatTile label="Hearings this week" value="—" hint="Awaiting hearings module" icon={Gavel} />
        <StatTile label="Billable hours (MTD)" value="—" hint="Awaiting billing module" icon={Clock} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Activity trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-lg">Activity trend</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">Firm momentum over the last 14 days</p>
            </div>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <>
                <div className="flex items-end gap-6">
                  <div>
                    <p className="font-display text-3xl font-semibold">{trend?.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">events · 14 days</p>
                  </div>
                  <div className="pb-1">
                    <p className="font-display text-2xl font-semibold">{trend?.today ?? 0}</p>
                    <p className="text-xs text-muted-foreground">today</p>
                  </div>
                </div>
                <Sparkline data={(trend?.points ?? []).map((p) => p.value)} className="mt-4" />
                <div className="mt-4 flex justify-end">
                  <Link
                    to="/notifications"
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                  >
                    View live activity <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* AI insights placeholder */}
        <Card className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                'radial-gradient(24rem 24rem at 100% 0%, hsl(var(--primary) / 0.10), transparent 60%)',
            }}
          />
          <CardHeader className="relative flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">AI insights</CardTitle>
            <Sparkles className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="relative">
            <Badge variant="default">Coming soon</Badge>
            <p className="mt-3 text-sm text-muted-foreground">
              Predictive workload balancing, matter risk scoring and revenue forecasting will surface
              here — powered by your firm's own data.
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              {['Matter risk & deadline alerts', 'Revenue & collections forecast', 'Workload rebalancing'].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2 text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
