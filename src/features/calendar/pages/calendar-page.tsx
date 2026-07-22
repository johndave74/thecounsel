import * as React from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  format,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { usePermissions } from '@/features/auth/hooks/use-permissions'
import { useHearings } from '@/features/hearings/hooks/use-hearings'
import { HearingFormDialog } from '@/features/hearings/components/hearing-form-dialog'
import { HEARING_STATUS_META, type HearingRow } from '@/features/hearings/types'
import { PageHeader } from '@/shared/components/page-header'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/shared/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function CalendarPage() {
  const { activeOrgId } = useAuth()
  const { has } = usePermissions()
  const [cursor, setCursor] = React.useState(() => startOfMonth(new Date()))
  const [view, setView] = React.useState<'month' | 'agenda'>('month')
  const [formOpen, setFormOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<HearingRow | null>(null)
  const [presetDate, setPresetDate] = React.useState<string | undefined>()

  const gridStart = startOfWeek(startOfMonth(cursor))
  const gridEnd = endOfWeek(endOfMonth(cursor))
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd })

  const { data } = useHearings(activeOrgId, { from: gridStart.toISOString(), to: gridEnd.toISOString() })
  const canCreate = has('hearings.create')

  const byDay = React.useMemo(() => {
    const map = new Map<string, HearingRow[]>()
    for (const h of data ?? []) {
      const key = format(new Date(h.hearing_at), 'yyyy-MM-dd')
      const arr = map.get(key) ?? []
      arr.push(h)
      map.set(key, arr)
    }
    return map
  }, [data])

  const openHearing = (h: HearingRow) => {
    setEditing(h)
    setPresetDate(undefined)
    setFormOpen(true)
  }
  const openNewOn = (day: Date) => {
    if (!canCreate) return
    setEditing(null)
    const at = new Date(day)
    at.setHours(9, 0, 0, 0)
    setPresetDate(at.toISOString())
    setFormOpen(true)
  }

  const monthHearings = (data ?? []).filter((h) => isSameMonth(new Date(h.hearing_at), cursor))

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Every court date and appearance across the firm."
        actions={
          canCreate ? (
            <Button onClick={() => { setEditing(null); setPresetDate(undefined); setFormOpen(true) }}>
              <Plus /> Schedule
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, -1))} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCursor((c) => addMonths(c, 1))} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 font-display text-xl font-semibold">{format(cursor, 'MMMM yyyy')}</h2>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>Today</Button>
        </div>
        <div className="flex rounded-lg border border-border p-0.5">
          {(['month', 'agenda'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors',
                view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {view === 'month' ? (
        <Card className="overflow-hidden p-0">
          <div className="grid grid-cols-7 border-b border-border bg-muted/40">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = format(day, 'yyyy-MM-dd')
              const items = byDay.get(key) ?? []
              const inMonth = isSameMonth(day, cursor)
              return (
                <button
                  key={key}
                  onClick={() => openNewOn(day)}
                  className={cn(
                    'min-h-[104px] border-b border-r border-border p-1.5 text-left align-top transition-colors hover:bg-muted/40',
                    !inMonth && 'bg-muted/20 text-muted-foreground',
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      isToday(day) && 'bg-primary font-semibold text-primary-foreground',
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                  <div className="mt-1 space-y-1">
                    {items.slice(0, 3).map((h) => (
                      <div
                        key={h.id}
                        onClick={(e) => { e.stopPropagation(); openHearing(h) }}
                        className="truncate rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
                      >
                        {format(new Date(h.hearing_at), 'HH:mm')} {h.title}
                      </div>
                    ))}
                    {items.length > 3 && <p className="px-1 text-[11px] text-muted-foreground">+{items.length - 3} more</p>}
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {monthHearings.length > 0 ? (
            monthHearings.map((h) => (
              <Card key={h.id} className="flex cursor-pointer items-center gap-4 p-3 hover:border-primary/40" onClick={() => openHearing(h)}>
                <div className="flex w-14 shrink-0 flex-col items-center rounded-lg bg-primary/10 py-1.5 text-primary">
                  <span className="text-[10px] font-semibold uppercase">{format(new Date(h.hearing_at), 'EEE')}</span>
                  <span className="font-display text-lg font-semibold leading-none">{format(new Date(h.hearing_at), 'd')}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{h.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(h.hearing_at), 'HH:mm')}{h.court ? ` · ${h.court}` : ''}
                  </p>
                </div>
                <Badge variant={HEARING_STATUS_META[h.status].variant}>{HEARING_STATUS_META[h.status].label}</Badge>
              </Card>
            ))
          ) : (
            <Card className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nothing scheduled in {format(cursor, 'MMMM')}.</p>
            </Card>
          )}
        </div>
      )}

      <HearingFormDialog hearing={editing} presetDate={presetDate} open={formOpen} onOpenChange={setFormOpen} />
    </div>
  )
}
