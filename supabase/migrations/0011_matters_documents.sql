-- ============================================================================
-- Migration 0011 — Matters (core), matter notes, documents + Storage.
-- ============================================================================

create type public.matter_status as enum ('open', 'pending', 'in_court', 'closed', 'won', 'lost');

-- Per-org, per-year running counter for human-friendly matter numbers.
create table public.matter_counters (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  year            int not null,
  seq             int not null default 0,
  primary key (organization_id, year)
);

create table public.matters (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  matter_number    text,
  title            text not null,
  description      text,
  client_id        uuid references public.clients(id) on delete set null,
  practice_area    text,
  status           public.matter_status not null default 'open',
  lead_lawyer_id   uuid references public.profiles(id) on delete set null,
  opposing_counsel text,
  court            text,
  judge            text,
  priority         text not null default 'medium',
  opened_on        date not null default current_date,
  closed_on        date,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, matter_number)
);

create index idx_matters_org on public.matters (organization_id);
create index idx_matters_org_status on public.matters (organization_id, status);
create index idx_matters_client on public.matters (client_id);

create trigger trg_matters_updated_at
  before update on public.matters
  for each row execute function public.set_updated_at();

-- Assign MAT-<year>-<seq> on insert.
create or replace function public.assign_matter_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  y int := extract(year from now())::int;
  n int;
begin
  if new.matter_number is not null and new.matter_number <> '' then
    return new;
  end if;
  insert into public.matter_counters (organization_id, year, seq)
    values (new.organization_id, y, 1)
    on conflict (organization_id, year) do update set seq = public.matter_counters.seq + 1
    returning seq into n;
  new.matter_number := 'MAT-' || y || '-' || lpad(n::text, 4, '0');
  return new;
end;
$$;

create trigger trg_matters_number
  before insert on public.matters
  for each row execute function public.assign_matter_number();

-- Notes ----------------------------------------------------------------------
create table public.matter_notes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid not null references public.matters(id) on delete cascade,
  author_id       uuid references public.profiles(id) on delete set null,
  body            text not null,
  created_at      timestamptz not null default now()
);
create index idx_matter_notes_matter on public.matter_notes (matter_id, created_at desc);

-- Documents -------------------------------------------------------------------
create table public.documents (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid references public.matters(id) on delete cascade,
  name            text not null,
  storage_path    text not null unique,
  mime_type       text,
  size_bytes      bigint,
  category        text,
  uploaded_by     uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index idx_documents_org on public.documents (organization_id);
create index idx_documents_matter on public.documents (matter_id, created_at desc);

-- RLS -------------------------------------------------------------------------
alter table public.matters enable row level security;
alter table public.matter_notes enable row level security;
alter table public.documents enable row level security;

create policy "matters_select" on public.matters
  for select using (public.has_permission(organization_id, 'matters.view'));
create policy "matters_insert" on public.matters
  for insert with check (public.has_permission(organization_id, 'matters.create'));
create policy "matters_update" on public.matters
  for update using (public.has_permission(organization_id, 'matters.update'))
  with check (public.has_permission(organization_id, 'matters.update'));
create policy "matters_delete" on public.matters
  for delete using (public.has_permission(organization_id, 'matters.delete'));

create policy "matter_notes_select" on public.matter_notes
  for select using (public.has_permission(organization_id, 'matters.view'));
create policy "matter_notes_insert" on public.matter_notes
  for insert with check (public.has_permission(organization_id, 'matters.view'));
create policy "matter_notes_delete" on public.matter_notes
  for delete using (public.has_permission(organization_id, 'matters.update') or author_id = auth.uid());

create policy "documents_select" on public.documents
  for select using (public.has_permission(organization_id, 'documents.view'));
create policy "documents_insert" on public.documents
  for insert with check (public.has_permission(organization_id, 'documents.upload'));
create policy "documents_update" on public.documents
  for update using (public.has_permission(organization_id, 'documents.update'))
  with check (public.has_permission(organization_id, 'documents.update'));
create policy "documents_delete" on public.documents
  for delete using (public.has_permission(organization_id, 'documents.delete'));

-- ----------------------------------------------------------------------------
-- Storage: private 'documents' bucket. Object paths are <org_id>/<...>, so the
-- first path segment identifies the tenant and drives permission checks.
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "documents_storage_select" on storage.objects
  for select using (
    bucket_id = 'documents'
    and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.view')
  );
create policy "documents_storage_insert" on storage.objects
  for insert with check (
    bucket_id = 'documents'
    and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.upload')
  );
create policy "documents_storage_delete" on storage.objects
  for delete using (
    bucket_id = 'documents'
    and public.has_permission(((storage.foldername(name))[1])::uuid, 'documents.delete')
  );
