-- ============================================================================
-- Migration 0006 — Platform commercial layer: plans, subscriptions, trials,
-- organization enrichments, and soft-delete lifecycle.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type public.subscription_status as enum (
  'trialing', 'active', 'past_due', 'paused', 'cancelled'
);
create type public.billing_cycle as enum ('monthly', 'yearly');

-- ----------------------------------------------------------------------------
-- Organization enrichments
-- ----------------------------------------------------------------------------
alter table public.organizations
  add column industry text,
  add column storage_used_bytes bigint not null default 0,
  add column last_login_at timestamptz,
  add column deleted_at timestamptz,
  add column deleted_by uuid references public.profiles(id) on delete set null;

create index idx_organizations_deleted_at on public.organizations (deleted_at);

-- ----------------------------------------------------------------------------
-- plans  (reference data; platform-managed, org-readable)
-- ----------------------------------------------------------------------------
create table public.plans (
  id             uuid primary key default gen_random_uuid(),
  key            text unique,                      -- null for custom plans
  name           text not null,
  description    text,
  currency       text not null default 'NGN',
  price_monthly  numeric(12,2) not null default 0,
  price_yearly   numeric(12,2) not null default 0,
  max_users      integer,                          -- null = unlimited
  storage_gb     integer not null default 0,
  support_level  text not null default 'Community',
  features       jsonb not null default '{}'::jsonb,
  highlights     text[] not null default '{}',
  is_custom      boolean not null default false,
  is_active      boolean not null default true,
  sort_order     integer not null default 100,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger trg_plans_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- subscriptions  (one per organization)
-- ----------------------------------------------------------------------------
create table public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  organization_id    uuid not null unique references public.organizations(id) on delete cascade,
  plan_id            uuid references public.plans(id) on delete set null,
  status             public.subscription_status not null default 'trialing',
  billing_cycle      public.billing_cycle not null default 'monthly',
  seats              integer not null default 5,
  auto_renew         boolean not null default true,
  trial_ends_at      timestamptz,
  current_period_end timestamptz,
  cancelled_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_subscriptions_plan on public.subscriptions (plan_id);
create index idx_subscriptions_status on public.subscriptions (status);

create trigger trg_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
alter table public.plans enable row level security;
alter table public.subscriptions enable row level security;

-- Plans: any authenticated user may read (orgs need their plan); platform writes.
create policy "plans_select_all" on public.plans
  for select using (auth.role() = 'authenticated');
create policy "plans_write_platform" on public.plans
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Subscriptions: org members read their own; platform admins manage all.
create policy "subscriptions_select" on public.subscriptions
  for select using (public.is_org_member(organization_id));
create policy "subscriptions_write_platform" on public.subscriptions
  for all using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ----------------------------------------------------------------------------
-- Seed default plans (Naira)
-- ----------------------------------------------------------------------------
insert into public.plans (key, name, description, price_monthly, price_yearly, max_users, storage_gb, support_level, features, highlights, sort_order) values
  ('starter', 'Starter', 'For small practices getting started', 50000, 500000, 5, 10, 'Community',
    '{"case_management":true,"calendar":true,"tasks":true,"reports_basic":true,"billing":false,"document_versioning":false,"custom_branding":false,"sso":false,"audit_logs":false,"api_access":false,"advanced_security":false,"ai_features":false}'::jsonb,
    array['Up to 5 users','10 GB storage','Case management','Calendar','Tasks','Basic reports','Community support'], 10),
  ('professional', 'Professional', 'For growing firms', 100000, 1000000, 15, 100, 'Priority Email',
    '{"case_management":true,"calendar":true,"tasks":true,"reports_basic":true,"reports_advanced":true,"billing":true,"invoices":true,"document_versioning":true,"custom_branding":false,"sso":false,"audit_logs":false,"api_access":false,"advanced_security":false,"ai_features":false}'::jsonb,
    array['Up to 15 users','100 GB storage','Everything in Starter','Billing & invoices','Advanced reports','Document versioning','Priority email support'], 20),
  ('enterprise', 'Enterprise', 'For large firms with advanced needs', 250000, 2500000, null, 1024, 'Dedicated',
    '{"case_management":true,"calendar":true,"tasks":true,"reports_basic":true,"reports_advanced":true,"billing":true,"invoices":true,"document_versioning":true,"custom_branding":true,"sso":true,"audit_logs":true,"api_access":true,"advanced_security":true,"ai_features":true}'::jsonb,
    array['Unlimited users','1 TB storage','Everything included','Custom branding','SSO','Dedicated support','Audit logs','API access','Advanced security'], 30)
on conflict (key) do nothing;

-- ----------------------------------------------------------------------------
-- create_organization: also start a 14-day Professional trial subscription.
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
  trial_plan_id uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can create organizations'
      using errcode = '42501';
  end if;

  insert into public.organizations (name, slug, legal_name, status)
  values (p_name, lower(p_slug), p_legal_name, 'trial')
  returning * into org;

  select id into trial_plan_id from public.plans where key = 'professional';
  insert into public.subscriptions (organization_id, plan_id, status, billing_cycle, seats, trial_ends_at, current_period_end)
  values (org.id, trial_plan_id, 'trialing', 'monthly', 5, now() + interval '14 days', now() + interval '14 days');

  if p_owner_user_id is not null then
    select id into owner_role_id from public.roles where key = 'managing_partner';
    insert into public.memberships (organization_id, user_id, role_id, status, is_owner, joined_at)
    values (org.id, p_owner_user_id, owner_role_id, 'active', true, now())
    on conflict (organization_id, user_id) do nothing;
    update public.profiles set default_organization_id = coalesce(default_organization_id, org.id)
      where id = p_owner_user_id;
  end if;

  perform public.log_audit(org.id, 'organization.created', 'organization', org.id,
    'Organization provisioned with 14-day trial', jsonb_build_object('name', p_name, 'slug', lower(p_slug)));
  return org;
end;
$$;

-- ----------------------------------------------------------------------------
-- Soft-delete lifecycle
-- ----------------------------------------------------------------------------
create or replace function public.soft_delete_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can delete organizations' using errcode = '42501';
  end if;
  update public.organizations
    set deleted_at = now(), deleted_by = auth.uid(), status = 'suspended'
    where id = p_org and deleted_at is null;
  perform public.log_audit(p_org, 'organization.soft_deleted', 'organization', p_org,
    'Organization moved to trash (30-day grace period)');
end;
$$;

create or replace function public.restore_organization(p_org uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Only a platform administrator can restore organizations' using errcode = '42501';
  end if;
  update public.organizations
    set deleted_at = null, deleted_by = null, status = 'active'
    where id = p_org;
  perform public.log_audit(p_org, 'organization.restored', 'organization', p_org,
    'Organization restored from trash');
end;
$$;

-- Permanently remove organizations soft-deleted more than 30 days ago.
create or replace function public.purge_deleted_organizations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  with removed as (
    delete from public.organizations
    where deleted_at is not null and deleted_at < now() - interval '30 days'
    returning id
  )
  select count(*) into n from removed;
  return n;
end;
$$;

grant execute on function public.soft_delete_organization(uuid) to authenticated;
grant execute on function public.restore_organization(uuid) to authenticated;
