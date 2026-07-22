-- ============================================================================
-- Migration 0013 — Hearings (court calendar). Calendar views read from here.
-- ============================================================================

create type public.hearing_type as enum ('mention', 'hearing', 'trial', 'ruling', 'motion', 'conference', 'other');
create type public.hearing_status as enum ('scheduled', 'adjourned', 'held', 'cancelled');

create table public.hearings (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  matter_id        uuid references public.matters(id) on delete cascade,
  title            text not null,
  hearing_at       timestamptz not null,
  duration_minutes int,
  location         text,
  court            text,
  judge            text,
  type             public.hearing_type not null default 'hearing',
  status           public.hearing_status not null default 'scheduled',
  outcome          text,
  notes            text,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_hearings_org on public.hearings (organization_id);
create index idx_hearings_org_at on public.hearings (organization_id, hearing_at);
create index idx_hearings_matter on public.hearings (matter_id);

create trigger trg_hearings_updated_at
  before update on public.hearings
  for each row execute function public.set_updated_at();

alter table public.hearings enable row level security;

create policy "hearings_select" on public.hearings
  for select using (public.has_permission(organization_id, 'hearings.view'));
create policy "hearings_insert" on public.hearings
  for insert with check (public.has_permission(organization_id, 'hearings.create'));
create policy "hearings_update" on public.hearings
  for update using (public.has_permission(organization_id, 'hearings.update'))
  with check (public.has_permission(organization_id, 'hearings.update'));
create policy "hearings_delete" on public.hearings
  for delete using (public.has_permission(organization_id, 'hearings.delete'));

-- Drop a tracking entry on the matter timeline when a hearing is scheduled.
create or replace function public.track_hearing_scheduled()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.matter_id is not null then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (new.organization_id, new.matter_id, coalesce(new.created_by, auth.uid()), 'hearing_scheduled',
            'Hearing scheduled: ' || new.title || ' on ' || to_char(new.hearing_at, 'Mon DD, YYYY'));
  end if;
  return new;
end $$;

create trigger trg_track_hearing_scheduled
  after insert on public.hearings for each row execute function public.track_hearing_scheduled();
