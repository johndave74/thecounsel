import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { LifeBuoy, LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { platformService } from '@/features/platform/services/platform.service'
import { Button } from '@/shared/components/ui/button'

/** Persistent banner shown while a platform admin is inside a firm via Support Mode. */
export function SupportModeBanner() {
  const { supportOrgId, activeMembership, exitSupport } = useAuth()
  const navigate = useNavigate()
  const [remaining, setRemaining] = React.useState<number>(0)
  const [ending, setEnding] = React.useState(false)

  const end = React.useCallback(async () => {
    if (ending) return
    setEnding(true)
    const sessionId = sessionStorage.getItem('counsel.support_session')
    try {
      if (sessionId) await platformService.endSupportSession(sessionId)
    } catch {
      /* best effort */
    }
    await exitSupport()
    navigate('/platform', { replace: true })
  }, [ending, exitSupport, navigate])

  React.useEffect(() => {
    if (!supportOrgId) return
    const expiresAt = sessionStorage.getItem('counsel.support_expires')
    const expiry = expiresAt ? new Date(expiresAt).getTime() : Date.now() + 30 * 60 * 1000
    const tick = () => {
      const secs = Math.max(0, Math.round((expiry - Date.now()) / 1000))
      setRemaining(secs)
      if (secs <= 0) void end()
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [supportOrgId, end])

  if (!supportOrgId) return null
  const mm = Math.floor(remaining / 60)
  const ss = String(remaining % 60).padStart(2, '0')

  return (
    <div className="flex items-center gap-3 bg-destructive px-4 py-2 text-destructive-foreground sm:px-6">
      <LifeBuoy className="h-4 w-4 shrink-0" />
      <p className="min-w-0 flex-1 truncate text-sm font-medium">
        Support Mode · {activeMembership?.organization.name ?? 'Firm workspace'}
        <span className="ml-2 hidden font-normal opacity-90 sm:inline">
          You are viewing this firm's workspace for support. All activity is audited.
        </span>
      </p>
      <span className="shrink-0 font-mono text-sm tabular-nums">{mm}:{ss}</span>
      <Button
        size="sm"
        variant="secondary"
        className="shrink-0"
        loading={ending}
        onClick={end}
      >
        <LogOut className="h-4 w-4" /> Exit
      </Button>
    </div>
  )
}
