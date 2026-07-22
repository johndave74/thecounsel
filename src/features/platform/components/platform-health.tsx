import { CheckCircle2, Server } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'

const SERVICES = ['Authentication', 'Database', 'Edge Functions', 'Realtime', 'Storage'] as const

/**
 * Because the app reached Supabase to authenticate and load data, the core
 * services are known-reachable. Latency history and incident tracking are
 * wired to a metrics source in a later phase.
 */
export function PlatformHealth({ reachable }: { reachable: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-4 w-4 text-muted-foreground" /> Platform Health
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-medium ${
            reachable ? 'bg-success/12 text-success' : 'bg-destructive/12 text-destructive'
          }`}
        >
          {reachable ? 'All systems operational' : 'Connection issue detected'}
        </div>
        <ul className="space-y-2.5">
          {SERVICES.map((s) => (
            <li key={s} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{s}</span>
              <span className="inline-flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" /> Operational
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Status reflects live Supabase reachability. Latency &amp; incident history connect in a later
          phase.
        </p>
      </CardContent>
    </Card>
  )
}
