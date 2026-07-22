-- ============================================================================
-- Migration 0009 — Fix create_organization enum cast.
--
-- The organization status was set from `case when p_trial then 'trial' else
-- 'active' end`, whose result type is `text`. Postgres will not implicitly cast
-- a CASE result into the `org_status` enum, so inserts failed with:
--   column "status" is of type org_status but expression is of type text
-- Adding an explicit ::public.org_status cast resolves it.
-- ============================================================================

create or replace function public.create_organization(
  p_name text,
  p_slug text,
  p_legal_name text default null,
  p_plan_id uuid default null,
  p_trial boolean default true,
  p_billing_cycle public.billing_cycle default 'monthly',
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
  resolved_plan_id uuid;
  period_end timestamptz;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can create organizations' using errcode = '42501';
  end if;

  insert into public.organizations (name, slug, legal_name, status)
  values (
    p_name,
    lower(p_slug),
    p_legal_name,
    (case when p_trial then 'trial' else 'active' end)::public.org_status
  )
  returning * into org;

  resolved_plan_id := coalesce(p_plan_id, (select id from public.plans where key = 'professional'));

  if p_trial then
    insert into public.subscriptions (organization_id, plan_id, status, billing_cycle, seats, trial_ends_at, current_period_end)
    values (org.id, resolved_plan_id, 'trialing', p_billing_cycle, 5, now() + interval '14 days', now() + interval '14 days');
  else
    period_end := case when p_billing_cycle = 'yearly' then now() + interval '1 year' else now() + interval '1 month' end;
    insert into public.subscriptions (organization_id, plan_id, status, billing_cycle, seats, current_period_end)
    values (org.id, resolved_plan_id, 'active', p_billing_cycle,
            coalesce((select max_users from public.plans where id = resolved_plan_id), 5), period_end);
  end if;

  if p_owner_user_id is not null then
    select id into owner_role_id from public.roles where key = 'managing_partner';
    insert into public.memberships (organization_id, user_id, role_id, status, is_owner, joined_at)
    values (org.id, p_owner_user_id, owner_role_id, 'active', true, now())
    on conflict (organization_id, user_id) do nothing;
    update public.profiles set default_organization_id = coalesce(default_organization_id, org.id)
      where id = p_owner_user_id;
  end if;

  perform public.log_audit(org.id, 'organization.created', 'organization', org.id,
    'Organization provisioned', jsonb_build_object('name', p_name, 'trial', p_trial));
  return org;
end;
$$;
