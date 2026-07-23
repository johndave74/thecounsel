import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { platformService } from '@/features/platform/services/platform.service'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { toast } from '@/shared/components/ui/sonner'

export function SupportSessionDialog({
  org,
  open,
  onOpenChange,
}: {
  org: { id: string; name: string }
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const { startSupport } = useAuth()
  const navigate = useNavigate()
  const [reason, setReason] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (open) setReason('')
  }, [open])

  const begin = async () => {
    if (!reason.trim()) {
      toast.error('Enter a reason for support access')
      return
    }
    setLoading(true)
    try {
      const session = await platformService.startSupportSession(org.id, reason.trim())
      sessionStorage.setItem('counsel.support_session', session.id)
      sessionStorage.setItem('counsel.support_expires', session.expires_at)
      await startSupport(org.id)
      navigate('/', { replace: true })
    } catch (err) {
      toast.error('Could not start support session', { description: err instanceof Error ? err.message : undefined })
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Start support session
          </DialogTitle>
          <DialogDescription>
            You are about to access <strong>{org.name}</strong>'s workspace for support purposes. This is a
            30-minute, fully audited session — the firm can see that you accessed their workspace and why.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Reason for access</Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Investigating a reported issue with invoice generation (ticket #123)"
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" loading={loading} onClick={begin}>Enter workspace</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
