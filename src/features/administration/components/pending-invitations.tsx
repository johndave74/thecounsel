import * as React from 'react'
import { MailOpen } from 'lucide-react'
import { useMyPendingInvitations } from '@/features/administration/hooks/use-administration'
import { useAuth } from '@/features/auth/context/auth-provider'
import { authService } from '@/features/auth/services/auth.service'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Badge } from '@/shared/components/ui/badge'
import { toast } from '@/shared/components/ui/sonner'

/** Lists invitations addressed to the current user and lets them accept. */
export function PendingInvitations() {
  const { data, isLoading, refetch } = useMyPendingInvitations()
  const { refresh } = useAuth()
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null)

  if (isLoading || !data || data.length === 0) return null

  const accept = async (token: string, id: string) => {
    setAcceptingId(id)
    try {
      await authService.acceptInvitation(token)
      await Promise.all([refresh(), refetch()])
      toast.success('Invitation accepted', { description: 'Welcome to your firm workspace.' })
    } catch (err) {
      toast.error('Could not accept invitation', {
        description: err instanceof Error ? err.message : 'It may have expired.',
      })
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <Card className="mx-auto mt-8 w-full max-w-lg p-6 text-left">
      <div className="flex items-center gap-2">
        <MailOpen className="h-4 w-4 text-primary" />
        <h2 className="font-display text-lg font-semibold">Your invitations</h2>
      </div>
      <ul className="mt-4 space-y-3">
        {data.map((inv) => (
          <li
            key={inv.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{inv.organization?.name ?? 'A firm'}</p>
              <Badge variant="muted" className="mt-1">
                {inv.role?.name ?? 'Member'}
              </Badge>
            </div>
            <Button size="sm" loading={acceptingId === inv.id} onClick={() => accept(inv.token, inv.id)}>
              Accept
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}
