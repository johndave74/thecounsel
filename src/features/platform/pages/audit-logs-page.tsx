import { format } from 'date-fns'
import { usePlatformActivity } from '@/features/platform/hooks/use-platform'
import { PageHeader } from '@/shared/components/page-header'
import { Card } from '@/shared/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/components/ui/table'
import { Badge } from '@/shared/components/ui/badge'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { titleCase } from '@/shared/lib/format'

export function AuditLogsPage() {
  const { data, isLoading } = usePlatformActivity()

  return (
    <div>
      <PageHeader title="Audit Logs" description="Every recorded action across the platform." />
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Badge variant="muted">{a.action}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{a.summary ?? titleCase(a.action.replace('.', ' '))}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.entity_type ?? '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(a.created_at), 'MMM d, yyyy · HH:mm')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="px-6 py-16 text-center text-sm text-muted-foreground">No audit entries yet.</div>
        )}
      </Card>
    </div>
  )
}
