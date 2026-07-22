-- ============================================================================
-- CloudTech Legal Suite — The Counsel
-- Migration 0001 — Core multi-tenancy: organizations, profiles, roles,
-- permissions, memberships, invitations, audit logs.
--
-- Conventions:
--   * All primary keys are UUID (gen_random_uuid()).
--   * Every tenant-scoped table carries organization_id -> organizations(id).
--   * created_at / updated_at maintained by triggers.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "citext";         -- case-insensitive email

-- ----------------------------------------------------------------------------
-- Enumerated types
-- ----------------------------------------------------------------------------
create type public.org_status as enum ('trial', 'active', 'suspended', 'cancelled');

create type public.membership_status as enum ('invited', 'active', 'suspended', 'disabled');

create type public.invitation_status as enum ('pending', 'accepted', 'revoked', 'expired');

-- The 12 canonical roles. Custom per-org roles may be added later with is_system = false.
create type public.role_key as enum (
  'platform_owner',
  'platform_admin',
  'managing_partner',
  'partner',
  'senior_associate',
  'associate',
  'junior_associate',
  'paralegal',
  'secretary',
  'finance',
  'hr',
  'receptionist'
);

-- ----------------------------------------------------------------------------
-- Shared helpers
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- organizations  (the tenant root)
-- ----------------------------------------------------------------------------
create table public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          citext not null unique,
  legal_name    text,
  logo_url      text,
  primary_color text not null default '#B38A3E',
  status        public.org_status not null default 'trial',
  plan          text not null default 'professional',
  billing_email citext,
  phone         text,
  website       text,
  timezone      text not null default 'UTC',
  settings      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- profiles  (1:1 with auth.users; platform-level identity)
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   citext not null,
  full_name               text,
  avatar_url              text,
  phone                   text,
  title                   text,
  is_platform_admin       boolean not null default false,
  default_organization_id uuid references public.organizations(id) on delete set null,
  last_seen_at            timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- permissions  (global catalog of resource.action grants)
-- ----------------------------------------------------------------------------
create table public.permissions (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,        -- e.g. 'cases.create'
  resource    text not null,               -- e.g. 'cases'
  action      text not null,               -- e.g. 'create'
  description text,
  created_at  timestamptz not null default now()
);

create index idx_permissions_resource on public.permissions (resource);

-- ----------------------------------------------------------------------------
-- roles  (system templates have organization_id = null; custom roles are per-org)
-- ----------------------------------------------------------------------------
create table public.roles (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  key             public.role_key,
  name            text not null,
  description     text,
  rank            integer not null default 100,  -- lower = more senior/privileged
  is_system       boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- system roles are unique by key; custom roles unique by (org, name)
  constraint uq_system_role_key unique (key),
  constraint uq_org_role_name unique (organization_id, name)
);

create index idx_roles_organization on public.roles (organization_id);

create trigger trg_roles_updated_at
  before update on public.roles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- role_permissions  (M:N)
-- ----------------------------------------------------------------------------
create table public.role_permissions (
  role_id       uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

create index idx_role_permissions_permission on public.role_permissions (permission_id);

-- ----------------------------------------------------------------------------
-- memberships  (a user's seat within one organization)
-- ----------------------------------------------------------------------------
create table public.memberships (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role_id         uuid not null references public.roles(id) on delete restrict,
  status          public.membership_status not null default 'active',
  is_owner        boolean not null default false,
  title           text,
  invited_by      uuid references public.profiles(id) on delete set null,
  invited_at      timestamptz,
  joined_at       timestamptz default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_membership_org_user unique (organization_id, user_id)
);

create index idx_memberships_user on public.memberships (user_id);
create index idx_memberships_org on public.memberships (organization_id);
create index idx_memberships_role on public.memberships (role_id);

create trigger trg_memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- invitations  (org admin invites a user by email)
-- ----------------------------------------------------------------------------
create table public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           citext not null,
  role_id         uuid not null references public.roles(id) on delete restrict,
  token           uuid not null default gen_random_uuid() unique,
  status          public.invitation_status not null default 'pending',
  invited_by      uuid references public.profiles(id) on delete set null,
  message         text,
  expires_at      timestamptz not null default (now() + interval '14 days'),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint uq_pending_invite unique (organization_id, email)
);

create index idx_invitations_org on public.invitations (organization_id);
create index idx_invitations_email on public.invitations (email);

create trigger trg_invitations_updated_at
  before update on public.invitations
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- audit_logs  (append-only activity trail, per tenant)
-- ----------------------------------------------------------------------------
create table public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_id        uuid references public.profiles(id) on delete set null,
  action          text not null,             -- e.g. 'membership.created'
  entity_type     text,                      -- e.g. 'membership'
  entity_id       uuid,
  summary         text,
  metadata        jsonb not null default '{}'::jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

create index idx_audit_logs_org_created on public.audit_logs (organization_id, created_at desc);
create index idx_audit_logs_entity on public.audit_logs (entity_type, entity_id);

-- ----------------------------------------------------------------------------
-- New auth user -> profile row
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
