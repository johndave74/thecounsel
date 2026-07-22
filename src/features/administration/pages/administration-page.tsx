import { useAuth } from '@/features/auth/context/auth-provider'
import { usePermissions } from '@/features/auth/hooks/use-permissions'
import { MembersPanel } from '@/features/administration/components/members-panel'
import { PageHeader } from '@/shared/components/page-header'
import { Badge } from '@/shared/components/ui/badge'

/** Organization administration — manage this firm's people. Firm-scoped only. */
export function AdministrationPage() {
  const { activeMembership, activeOrgId } = useAuth()
  const { has } = usePermissions()

  if (!activeOrgId) return null

  if (!has('members.view')) {
    return (
      <div>
        <PageHeader title="Firm Settings" />
        <p className="text-sm text-muted-foreground">
          You don't have access to firm administration. Contact your firm's Managing Partner.
        </p>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Firm Settings"
        description={`Manage people and access for ${activeMembership?.organization.name ?? 'your firm'}.`}
        actions={<Badge variant="outline">{activeMembership?.role.name}</Badge>}
      />
      <MembersPanel organizationId={activeOrgId} />
    </div>
  )
}
