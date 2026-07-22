import * as React from 'react'
import { cn } from '@/shared/lib/utils'

/** Compact dependency-free sparkline (area + line). */
export function Sparkline({ data, className }: { data: number[]; className?: string }) {
  const id = React.useId().replace(/[:]/g, '')
  const width = 260
  const height = 64
  const pad = 4
  if (data.length === 0) return null

  const max = Math.max(1, ...data)
  const stepX = (width - pad * 2) / Math.max(1, data.length - 1)
  const points = data.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - (v / max) * (height - pad * 2),
  }))
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${line} L ${points[points.length - 1].x} ${height - pad} L ${points[0].x} ${height - pad} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={cn('h-16 w-full', className)} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
