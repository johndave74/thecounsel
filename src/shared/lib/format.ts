/** Small shared formatting helpers used across features. */

export function initialsOf(name?: string | null, fallback = 'U'): string {
  if (!name) return fallback
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || fallback
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Format an amount as Nigerian Naira (no decimals). */
export function formatNaira(amount: number, currency = 'NGN'): string {
  try {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `₦${Math.round(amount).toLocaleString()}`
  }
}

/** Compact money for KPI cards, e.g. ₦1.2M. */
export function formatMoneyCompact(amount: number, currency = 'NGN'): string {
  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(amount)
  } catch {
    return formatNaira(amount, currency)
  }
}

export function formatStorage(bytes: number): string {
  if (!bytes) return '0 GB'
  const gb = bytes / 1024 ** 3
  if (gb < 1) return `${(bytes / 1024 ** 2).toFixed(0)} MB`
  if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
  return `${gb.toFixed(1)} GB`
}

export function daysUntil(date: string | null): number | null {
  if (!date) return null
  const ms = new Date(date).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

