-- ============================================================================
-- Migration 0010 — Clients module + Realtime for the activity feed.
-- First firm-data module: establishes the org-scoped RLS pattern using
-- has_permission(organization_id, '<perm>').
-- ============================================================================

create type public.client_type as enum ('individual', 'corporate');
create type public.client_status as enum ('active', 'inactive', 'prospect');

create table public.clients (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type            public.client_type not null default 'individual',
  display_name    text not null,
  first_name      text,
  last_name       text,
  company_name    text,
  email           text,
  phone           text,
  website         text,
  address         text,
  city            text,
  country         text,
  status          public.client_status not null default 'active',
  notes           text,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_clients_org on public.clients (organization_id);
create index idx_clients_org_status on public.clients (organization_id, status);
create index idx_clients_org_type on public.clients (organization_id, type);
create index idx_clients_display_name on public.clients (organization_id, display_name);

create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- RLS — org-scoped, permission-gated.
alter table public.clients enable row level security;

create policy "clients_select" on public.clients
  for select using (public.has_permission(organization_id, 'clients.view'));
create policy "clients_insert" on public.clients
  for insert with check (public.has_permission(organization_id, 'clients.create'));
create policy "clients_update" on public.clients
  for update using (public.has_permission(organization_id, 'clients.update'))
  with check (public.has_permission(organization_id, 'clients.update'));
create policy "clients_delete" on public.clients
  for delete using (public.has_permission(organization_id, 'clients.delete'));

-- ----------------------------------------------------------------------------
-- Realtime: stream audit events for the live activity feed. RLS still applies,
-- so each firm only receives its own rows.
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'audit_logs'
  ) then
    alter publication supabase_realtime add table public.audit_logs;
  end if;
end $$;
