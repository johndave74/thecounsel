import * as React from 'react'
import type { GrowthPoint } from '@/features/platform/types'

/** Lightweight dependency-free cumulative area chart. */
export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const width = 720
  const height = 220
  const padX = 32
  const padY = 24
  const id = React.useId().replace(/[:]/g, '')

  if (data.length === 0) return null

  const max = Math.max(1, ...data.map((d) => d.value))
  const stepX = (width - padX * 2) / Math.max(1, data.length - 1)
  const points = data.map((d, i) => {
    const x = padX + i * stepX
    const y = height - padY - (d.value / max) * (height - padY * 2)
    return { x, y, ...d }
  })

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${line} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full" role="img" aria-label="Organization growth">
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* gridlines */}
      {[0, 0.5, 1].map((t) => {
        const y = padY + t * (height - padY * 2)
        return <line key={t} x1={padX} y1={y} x2={width - padX} y2={y} stroke="hsl(var(--border))" strokeWidth="1" />
      })}

      <path d={area} fill={`url(#grad-${id})`} />
      <path d={line} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="hsl(var(--primary))" />
          <text x={p.x} y={height - 6} textAnchor="middle" className="fill-muted-foreground" fontSize="11">
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}
