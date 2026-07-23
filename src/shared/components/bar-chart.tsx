import { cn } from '@/shared/lib/utils'

export interface BarDatum {
  label: string
  value: number
}

/** Dependency-free vertical bar chart built with flexbox. */
export function BarChart({
  data,
  formatValue = (n) => String(n),
  className,
}: {
  data: BarDatum[]
  formatValue?: (n: number) => string
  className?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className={cn('flex h-56 items-end gap-3', className)}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{d.value ? formatValue(d.value) : ''}</span>
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-gradient-to-t from-primary/50 to-primary transition-all"
              style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 0 }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Horizontal labelled bars, e.g. distribution breakdowns. */
export function DistributionBars({
  data,
  formatValue = (n) => String(n),
}: {
  data: BarDatum[]
  formatValue?: (n: number) => string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-medium">{d.label}</span>
            <span className="text-muted-foreground">{formatValue(d.value)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
