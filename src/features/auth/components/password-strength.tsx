import { cn } from '@/shared/lib/utils'

const RULES = [
  { test: (v: string) => v.length >= 10, label: '10+ characters' },
  { test: (v: string) => /[A-Z]/.test(v), label: 'Uppercase' },
  { test: (v: string) => /[a-z]/.test(v), label: 'Lowercase' },
  { test: (v: string) => /[0-9]/.test(v), label: 'Number' },
  { test: (v: string) => /[^A-Za-z0-9]/.test(v), label: 'Symbol' },
]

const LABELS = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
const COLORS = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-primary', 'bg-success']

export function PasswordStrength({ value }: { value: string }) {
  const score = RULES.reduce((n, r) => n + (r.test(value) ? 1 : 0), 0)
  const idx = Math.max(0, score - 1)

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {Array.from({ length: RULES.length }).map((_, i) => (
          <span
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < score ? COLORS[idx] : 'bg-border',
            )}
          />
        ))}
      </div>
      {value && (
        <p className="text-xs text-muted-foreground">
          Strength: <span className="font-medium text-foreground">{LABELS[idx]}</span>
        </p>
      )}
    </div>
  )
}
