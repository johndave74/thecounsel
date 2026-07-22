import { supabase } from '@/shared/lib/supabase'
import type { Organization, Role } from '@/shared/types/database.types'
import type {
  InvitationWithRelations,
  MemberWithRelations,
  OrganizationSummary,
} from '@/features/administration/types'

export const administrationService = {
  /** Platform: every organization (RLS lets platform admins see all). */
  async listOrganizations(): Promise<OrganizationSummary[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*, memberships(count)')
      .order('created_at', { ascending: false })
    if (error) throw error
    const rows = (data ?? []) as unknown as (Organization & {
      memberships: { count: number }[]
    })[]
    return rows.map(({ memberships, ...rest }) => ({
      ...rest,
      member_count: memberships?.[0]?.count ?? 0,
    }))
  },

  async createOrganization(input: {
    name: string
    slug: string
    legalName?: string | null
  }): Promise<Organization> {
    const { data, error } = await supabase.rpc('create_organization', {
      p_name: input.name,
      p_slug: input.slug,
      p_legal_name: input.legalName ?? null,
    })
    if (error) throw error
    return data as Organization
  },

  /** Firm-assignable system roles (excludes platform-level roles). */
  async listAssignableRoles(): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('is_system', true)
      .gte('rank', 10)
      .order('rank', { ascending: true })
    if (error) throw error
    return data ?? []
  },

  async removeMember(membershipId: string, organizationId: string, name: string): Promise<void> {
    const { error } = await supabase.from('memberships').delete().eq('id', membershipId)
    if (error) throw error
    await supabase.rpc('log_audit', {
      p_org: organizationId,
      p_action: 'member.removed',
      p_entity_type: 'membership',
      p_entity_id: membershipId,
      p_summary: `Removed ${name} from the firm`,
    })
  },

  async listInvitations(organizationId: string): Promise<InvitationWithRelations[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, role:roles(id, name, key)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as InvitationWithRelations[]
  },

  async createInvitation(input: {
    organizationId: string
    email: string
    roleId: string
    message?: string | null
  }): Promise<void> {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('invitations').insert({
      organization_id: input.organizationId,
      email: input.email.toLowerCase(),
      role_id: input.roleId,
      message: input.message ?? null,
      invited_by: userData.user?.id ?? null,
    })
    if (error) throw error
    await supabase.rpc('log_audit', {
      p_org: input.organizationId,
      p_action: 'invitation.created',
      p_entity_type: 'invitation',
      p_summary: `Invited ${input.email}`,
    })
  },

  async revokeInvitation(id: string): Promise<void> {
    const { error } = await supabase.from('invitations').update({ status: 'revoked' }).eq('id', id)
    if (error) throw error
  },

  async listMembers(organizationId: string): Promise<MemberWithRelations[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        '*, profile:profiles!memberships_user_id_fkey(id, full_name, email, avatar_url, title), role:roles(id, name, key, rank)',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as unknown as MemberWithRelations[]
  },

  /** Pending invitations addressed to the signed-in user's email. */
  async listMyPendingInvitations(): Promise<InvitationWithRelations[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*, role:roles(id, name, key), organization:organizations(id, name, slug)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as unknown as InvitationWithRelations[]
  },
}
