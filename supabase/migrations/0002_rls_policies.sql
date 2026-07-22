-- ============================================================================
-- Migration 0002 — Row Level Security
-- Helper functions are SECURITY DEFINER + STABLE so policies can call them
-- without triggering recursive RLS evaluation. Tenant isolation is enforced
-- centrally here: Law Firm A can never read Law Firm B's rows.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Authorization helper functions
-- ----------------------------------------------------------------------------

-- Is the current user a platform-level administrator?
create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_platform_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- Is the current user an active member of the given organization?
create or replace function public.is_org_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
      or exists (
        select 1
        from public.memberships m
        where m.user_id = auth.uid()
          and m.organization_id = org
          and m.status = 'active'
      );
$$;

-- Does the current user hold a specific permission within the organization?
create or replace function public.has_permission(org uuid, perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
      or exists (
        select 1
        from public.memberships m
        join public.role_permissions rp on rp.role_id = m.role_id
        join public.permissions p on p.id = rp.permission_id
        where m.user_id = auth.uid()
          and m.organization_id = org
          and m.status = 'active'
          and p.key = perm
      );
$$;

-- Is the current user an administrator of the organization (owner or member-manager)?
create or replace function public.is_org_admin(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
      or exists (
        select 1
        from public.memberships m
        where m.user_id = auth.uid()
          and m.organization_id = org
          and m.status = 'active'
          and m.is_owner = true
      )
      or public.has_permission(org, 'members.manage');
$$;

-- Do the current user and target user share at least one active organization?
create or replace function public.shares_organization(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships me
    join public.memberships them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target
  );
$$;

grant execute on function public.is_platform_admin() to authenticated;
grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.has_permission(uuid, text) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.shares_organization(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- Enable RLS
-- ----------------------------------------------------------------------------
alter table public.organizations   enable row level security;
alter table public.profiles        enable row level security;
alter table public.permissions     enable row level security;
alter table public.roles           enable row level security;
alter table public.role_permissions enable row level security;
alter table public.memberships     enable row level security;
alter table public.invitations     enable row level security;
alter table public.audit_logs      enable row level security;

-- ----------------------------------------------------------------------------
-- organizations
-- ----------------------------------------------------------------------------
create policy "org_select_members" on public.organizations
  for select using (public.is_org_member(id));

create policy "org_insert_platform_admin" on public.organizations
  for insert with check (public.is_platform_admin());

create policy "org_update_admins" on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

create policy "org_delete_platform_admin" on public.organizations
  for delete using (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- profiles
-- ----------------------------------------------------------------------------
create policy "profile_select_self_or_colleague" on public.profiles
  for select using (
    id = auth.uid()
    or public.is_platform_admin()
    or public.shares_organization(id)
  );

create policy "profile_update_self" on public.profiles
  for update using (id = auth.uid() or public.is_platform_admin())
  with check (id = auth.uid() or public.is_platform_admin());

-- profiles are created by the auth trigger (security definer); no public insert.

-- ----------------------------------------------------------------------------
-- permissions (read-only catalog for all authenticated users)
-- ----------------------------------------------------------------------------
create policy "permissions_select_all" on public.permissions
  for select using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- roles
-- ----------------------------------------------------------------------------
create policy "roles_select" on public.roles
  for select using (
    organization_id is null
    or public.is_org_member(organization_id)
  );

create policy "roles_write_admin" on public.roles
  for all using (
    (organization_id is not null and public.is_org_admin(organization_id))
    or public.is_platform_admin()
  )
  with check (
    (organization_id is not null and public.is_org_admin(organization_id))
    or public.is_platform_admin()
  );

-- ----------------------------------------------------------------------------
-- role_permissions
-- ----------------------------------------------------------------------------
create policy "role_permissions_select" on public.role_permissions
  for select using (
    exists (
      select 1 from public.roles r
      where r.id = role_id
        and (r.organization_id is null or public.is_org_member(r.organization_id))
    )
  );

create policy "role_permissions_write_admin" on public.role_permissions
  for all using (
    exists (
      select 1 from public.roles r
      where r.id = role_id
        and (
          (r.organization_id is not null and public.is_org_admin(r.organization_id))
          or public.is_platform_admin()
        )
    )
  )
  with check (
    exists (
      select 1 from public.roles r
      where r.id = role_id
        and (
          (r.organization_id is not null and public.is_org_admin(r.organization_id))
          or public.is_platform_admin()
        )
    )
  );

-- ----------------------------------------------------------------------------
-- memberships
-- ----------------------------------------------------------------------------
create policy "memberships_select" on public.memberships
  for select using (
    user_id = auth.uid()
    or public.is_org_member(organization_id)
  );

create policy "memberships_write_admin" on public.memberships
  for all using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ----------------------------------------------------------------------------
-- invitations
-- ----------------------------------------------------------------------------
create policy "invitations_select" on public.invitations
  for select using (
    public.is_org_admin(organization_id)
    or email = (select p.email from public.profiles p where p.id = auth.uid())
  );

create policy "invitations_write_admin" on public.invitations
  for all using (public.is_org_admin(organization_id))
  with check (public.is_org_admin(organization_id));

-- ----------------------------------------------------------------------------
-- audit_logs (append-only; read gated by permission)
-- ----------------------------------------------------------------------------
create policy "audit_select" on public.audit_logs
  for select using (
    public.is_org_admin(organization_id)
    or public.has_permission(organization_id, 'audit.read')
  );

create policy "audit_insert_members" on public.audit_logs
  for insert with check (public.is_org_member(organization_id));
