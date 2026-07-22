-- ============================================================================
-- Migration 0008 — Clean up firm accounts when their organization is deleted.
--
-- Deleting an organization previously left its users' login accounts behind
-- (profiles/auth.users are not owned by the org row). This:
--   1. Removes any already-orphaned firm accounts (non-platform users that
--      belong to no organization).
--   2. Makes hard_delete_organization also delete accounts that existed ONLY
--      for the deleted firm (never touching platform staff or shared users).
-- Deleting from auth.users cascades to public.profiles and public.memberships.
-- ============================================================================

-- 1) One-time cleanup of existing orphans.
delete from auth.users u
where not exists (select 1 from public.memberships m where m.user_id = u.id)
  and not exists (select 1 from public.profiles p where p.id = u.id and p.is_platform_admin);

-- 2) Purge exclusive member accounts as part of a permanent org delete.
create or replace function public.hard_delete_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can delete organizations' using errcode = '42501';
  end if;

  -- Delete accounts that belong to this org only (skip platform staff and
  -- anyone who is also a member of another organization).
  delete from auth.users u
  using public.memberships m
  where m.organization_id = p_org
    and m.user_id = u.id
    and not exists (select 1 from public.profiles p where p.id = u.id and p.is_platform_admin)
    and not exists (
      select 1 from public.memberships m2 where m2.user_id = u.id and m2.organization_id <> p_org
    );

  delete from public.organizations where id = p_org and deleted_at is not null;
end;
$$;
