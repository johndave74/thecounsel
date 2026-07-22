import { Building2 } from 'lucide-react'
import { useAuth } from '@/features/auth/context/auth-provider'
import { PendingInvitations } from '@/features/administration/components/pending-invitations'
import { Button } from '@/shared/components/ui/button'

/** Shown to a signed-in user who has no active organization membership. */
export function NoOrganizationState() {
  const { signOut } = useAuth()
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/12 text-primary">
        <Building2 className="h-8 w-8" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold">No workspace yet</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Your account isn't a member of any firm workspace. Accept a pending invitation below, or
        contact your firm administrator.
      </p>

      <PendingInvitations />

      <Button variant="ghost" className="mt-8" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  )
}
