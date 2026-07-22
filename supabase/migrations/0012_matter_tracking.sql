-- ============================================================================
-- Migration 0012 — Matter tracking: a per-matter timeline of everything that
-- happens on a matter. Automatic events are captured by triggers so the history
-- is complete regardless of which client wrote the change; users can also log
-- manual updates.
-- ============================================================================

create table public.matter_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid not null references public.matters(id) on delete cascade,
  actor_id        uuid references public.profiles(id) on delete set null,
  kind            text not null, -- created | status_changed | note_added | document_added | document_removed | update
  summary         text not null,
  metadata        jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

create index idx_matter_events_matter on public.matter_events (matter_id, created_at desc);

alter table public.matter_events enable row level security;

create policy "matter_events_select" on public.matter_events
  for select using (public.has_permission(organization_id, 'matters.view'));
create policy "matter_events_insert" on public.matter_events
  for insert with check (public.has_permission(organization_id, 'matters.view'));
create policy "matter_events_delete" on public.matter_events
  for delete using (public.has_permission(organization_id, 'matters.update') or actor_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Triggers — automatic timeline entries.
-- ----------------------------------------------------------------------------
create or replace function public.track_matter_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
  values (new.organization_id, new.id, auth.uid(), 'created', 'Matter opened as ' || new.status);
  return new;
end $$;

create or replace function public.track_matter_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary, metadata)
    values (new.organization_id, new.id, auth.uid(), 'status_changed',
            'Status changed from ' || old.status || ' to ' || new.status,
            jsonb_build_object('from', old.status, 'to', new.status));
  end if;
  return new;
end $$;

create or replace function public.track_note_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
  values (new.organization_id, new.matter_id, coalesce(new.author_id, auth.uid()), 'note_added',
          'Added a note: ' || left(new.body, 80));
  return new;
end $$;

create or replace function public.track_document_added()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.matter_id is not null then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (new.organization_id, new.matter_id, coalesce(new.uploaded_by, auth.uid()), 'document_added',
            'Uploaded ' || new.name);
  end if;
  return new;
end $$;

create or replace function public.track_document_removed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.matter_id is not null then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (old.organization_id, old.matter_id, auth.uid(), 'document_removed', 'Removed ' || old.name);
  end if;
  return old;
end $$;

create trigger trg_track_matter_created
  after insert on public.matters for each row execute function public.track_matter_created();
create trigger trg_track_matter_status
  after update on public.matters for each row execute function public.track_matter_status();
create trigger trg_track_note_added
  after insert on public.matter_notes for each row execute function public.track_note_added();
create trigger trg_track_document_added
  after insert on public.documents for each row execute function public.track_document_added();
create trigger trg_track_document_removed
  after delete on public.documents for each row execute function public.track_document_removed();
