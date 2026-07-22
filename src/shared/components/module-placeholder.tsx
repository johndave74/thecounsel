import type { LucideIcon } from 'lucide-react'
import { PageHeader } from '@/shared/components/page-header'
import { Card } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

/**
 * Elegant placeholder used while a module's UI is being built out. The data
 * model, RLS and services arrive with each module; this keeps navigation whole
 * and communicates roadmap status without looking unfinished.
 */
export function ModulePlaceholder({
  title,
  description,
  icon: Icon,
  highlights,
}: {
  title: string
  description: string
  icon: LucideIcon
  highlights: string[]
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-5 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
            <Icon className="h-8 w-8" />
          </span>
          <div>
            <Badge variant="warning">In development</Badge>
            <h2 className="mt-3 font-display text-xl font-semibold">This module is being built</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              The foundation — database schema, row-level security and services — is being delivered
              module by module. Here's what's coming to {title}:
            </p>
          </div>
          <ul className="grid gap-2 text-left text-sm sm:grid-cols-2">
            {highlights.map((h) => (
              <li key={h} className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  )
}
