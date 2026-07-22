-- ============================================================================
-- Migration 0004 — Server-side RPCs for the foundation flows.
-- All are SECURITY DEFINER with explicit internal authorization checks.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Audit helper — insert an audit entry.
-- ----------------------------------------------------------------------------
create or replace function public.log_audit(
  p_org uuid,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_summary text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns public.audit_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.audit_logs;
begin
  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, summary, metadata)
  values (p_org, auth.uid(), p_action, p_entity_type, p_entity_id, p_summary, coalesce(p_metadata, '{}'::jsonb))
  returning * into rec;
  return rec;
end;
$$;

-- ----------------------------------------------------------------------------
-- Provision a new organization (Platform Admin only) and optionally seat an owner.
-- ----------------------------------------------------------------------------
create or replace function public.create_organization(
  p_name text,
  p_slug text,
  p_legal_name text default null,
  p_owner_user_id uuid default null
)
returns public.organizations
language plpgsql
security definer
set search_path = public
as $$
declare
  org public.organizations;
  owner_role_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can create organizations'
      using errcode = '42501';
  end if;

  insert into public.organizations (name, slug, legal_name, status)
  values (p_name, lower(p_slug), p_legal_name, 'active')
  returning * into org;

  if p_owner_user_id is not null then
    select id into owner_role_id from public.roles where key = 'managing_partner';

    insert into public.memberships (organization_id, user_id, role_id, status, is_owner, joined_at)
    values (org.id, p_owner_user_id, owner_role_id, 'active', true, now())
    on conflict (organization_id, user_id) do nothing;

    update public.profiles
      set default_organization_id = coalesce(default_organization_id, org.id)
      where id = p_owner_user_id;
  end if;

  perform public.log_audit(org.id, 'organization.created', 'organization', org.id,
    'Organization provisioned', jsonb_build_object('name', p_name, 'slug', lower(p_slug)));

  return org;
end;
$$;

-- ----------------------------------------------------------------------------
-- Accept an invitation as the currently signed-in user.
-- ----------------------------------------------------------------------------
create or replace function public.accept_invitation(p_token uuid)
returns public.memberships
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations;
  me_email citext;
  mem public.memberships;
begin
  select email into me_email from public.profiles where id = auth.uid();
  if me_email is null then
    raise exception 'No authenticated profile' using errcode = '42501';
  end if;

  select * into inv from public.invitations where token = p_token;
  if inv.id is null then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if inv.status <> 'pending' then
    raise exception 'Invitation is no longer valid' using errcode = 'P0001';
  end if;
  if inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = inv.id;
    raise exception 'Invitation has expired' using errcode = 'P0001';
  end if;
  if lower(inv.email) <> lower(me_email) then
    raise exception 'Invitation was issued to a different email' using errcode = '42501';
  end if;

  insert into public.memberships (organization_id, user_id, role_id, status, invited_by, invited_at, joined_at)
  values (inv.organization_id, auth.uid(), inv.role_id, 'active', inv.invited_by, inv.created_at, now())
  on conflict (organization_id, user_id)
    do update set status = 'active', role_id = excluded.role_id
  returning * into mem;

  update public.invitations set status = 'accepted', accepted_at = now() where id = inv.id;

  update public.profiles
    set default_organization_id = coalesce(default_organization_id, inv.organization_id)
    where id = auth.uid();

  perform public.log_audit(inv.organization_id, 'invitation.accepted', 'membership', mem.id,
    'User accepted invitation', jsonb_build_object('email', me_email));

  return mem;
end;
$$;

grant execute on function public.log_audit(uuid, text, text, uuid, text, jsonb) to authenticated;
grant execute on function public.create_organization(text, text, text, uuid) to authenticated;
grant execute on function public.accept_invitation(uuid) to authenticated;
