-- ============================================================================
-- Migration 0014 — Tasks & deadlines + Staff professional profiles.
-- ============================================================================

create type public.task_status as enum ('todo', 'in_progress', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table public.tasks (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  matter_id       uuid references public.matters(id) on delete set null,
  title           text not null,
  description     text,
  status          public.task_status not null default 'todo',
  priority        public.task_priority not null default 'medium',
  assignee_id     uuid references public.profiles(id) on delete set null,
  due_date        date,
  completed_at    timestamptz,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_tasks_org on public.tasks (organization_id);
create index idx_tasks_org_status on public.tasks (organization_id, status);
create index idx_tasks_assignee on public.tasks (assignee_id);
create index idx_tasks_matter on public.tasks (matter_id);
create index idx_tasks_due on public.tasks (organization_id, due_date);

create trigger trg_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

alter table public.tasks enable row level security;

create policy "tasks_select" on public.tasks
  for select using (public.has_permission(organization_id, 'tasks.view'));
create policy "tasks_insert" on public.tasks
  for insert with check (public.has_permission(organization_id, 'tasks.create'));
create policy "tasks_update" on public.tasks
  for update using (public.has_permission(organization_id, 'tasks.update') or assignee_id = auth.uid())
  with check (public.has_permission(organization_id, 'tasks.update') or assignee_id = auth.uid());
create policy "tasks_delete" on public.tasks
  for delete using (public.has_permission(organization_id, 'tasks.delete'));

-- Track tasks on the matter timeline.
create or replace function public.track_task_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.matter_id is not null then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (new.organization_id, new.matter_id, coalesce(new.created_by, auth.uid()), 'task_added',
            'Task added: ' || new.title);
  end if;
  return new;
end $$;

create or replace function public.track_task_completed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.matter_id is not null and new.status = 'done' and old.status is distinct from 'done' then
    insert into public.matter_events (organization_id, matter_id, actor_id, kind, summary)
    values (new.organization_id, new.matter_id, auth.uid(), 'task_completed', 'Task completed: ' || new.title);
  end if;
  return new;
end $$;

create trigger trg_track_task_created
  after insert on public.tasks for each row execute function public.track_task_created();
create trigger trg_track_task_completed
  after update on public.tasks for each row execute function public.track_task_completed();

-- ----------------------------------------------------------------------------
-- Staff professional profiles (firm-specific details for each member).
-- ----------------------------------------------------------------------------
create table public.staff_profiles (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  bar_number      text,
  year_admitted   int,
  qualifications  text[] not null default '{}',
  specializations text[] not null default '{}',
  hourly_rate     numeric(12,2),
  bio             text,
  availability    text not null default 'available', -- available | busy | on_leave
  phone           text,
  updated_at      timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create trigger trg_staff_profiles_updated_at
  before update on public.staff_profiles
  for each row execute function public.set_updated_at();

alter table public.staff_profiles enable row level security;

create policy "staff_profiles_select" on public.staff_profiles
  for select using (public.has_permission(organization_id, 'staff.view'));
create policy "staff_profiles_write" on public.staff_profiles
  for all using (public.has_permission(organization_id, 'staff.manage') or user_id = auth.uid())
  with check (public.has_permission(organization_id, 'staff.manage') or user_id = auth.uid());
